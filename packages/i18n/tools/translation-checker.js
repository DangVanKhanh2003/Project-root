#!/usr/bin/env node
/**
 * Translation Checker Tool
 * Validates locale files for missing/unused keys
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// ==========================================
// Locale File Operations
// ==========================================

/**
 * Load all locale files
 */
function loadLocales() {
  const localesDir = join(__dirname, '../src/locales');
  const files = readdirSync(localesDir).filter(f => f.endsWith('.json'));

  const locales = {};
  for (const file of files) {
    const lang = file.replace('.json', '');
    const filePath = join(localesDir, file);
    try {
      locales[lang] = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (err) {
      log(colors.red, `❌ Failed to parse ${file}:`, err.message);
    }
  }

  return locales;
}

/**
 * Flatten nested object to dot notation keys
 */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...flattenKeys(obj[key], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

// ==========================================
// Validation Functions
// ==========================================

/**
 * Check for missing keys (compared to English)
 */
function checkMissingKeys(locales) {
  const englishKeys = new Set(flattenKeys(locales.en));
  const report = {};

  for (const lang in locales) {
    if (lang === 'en') continue;

    const langKeys = new Set(flattenKeys(locales[lang]));
    const missing = [...englishKeys].filter(key => !langKeys.has(key));

    if (missing.length > 0) {
      report[lang] = missing;
    }
  }

  return report;
}

/**
 * Check for extra keys (not in English)
 */
function checkExtraKeys(locales) {
  const englishKeys = new Set(flattenKeys(locales.en));
  const report = {};

  for (const lang in locales) {
    if (lang === 'en') continue;

    const langKeys = new Set(flattenKeys(locales[lang]));
    const extra = [...langKeys].filter(key => !englishKeys.has(key));

    if (extra.length > 0) {
      report[lang] = extra;
    }
  }

  return report;
}

/**
 * Check for empty values
 */
function checkEmptyValues(locales) {
  const report = {};

  for (const lang in locales) {
    const keys = flattenKeys(locales[lang]);
    const empty = [];

    function checkEmpty(obj, prefix = '') {
      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object') {
          checkEmpty(obj[key], path);
        } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
          empty.push(path);
        }
      }
    }

    checkEmpty(locales[lang]);

    if (empty.length > 0) {
      report[lang] = empty;
    }
  }

  return report;
}

/**
 * Calculate translation coverage
 */
function calculateCoverage(locales) {
  const englishKeyCount = flattenKeys(locales.en).length;
  const coverage = {};

  for (const lang in locales) {
    const langKeyCount = flattenKeys(locales[lang]).length;
    const percentage = ((langKeyCount / englishKeyCount) * 100).toFixed(1);
    coverage[lang] = {
      keys: langKeyCount,
      total: englishKeyCount,
      percentage: parseFloat(percentage)
    };
  }

  return coverage;
}

// ==========================================
// Report Generation
// ==========================================

/**
 * Print validation report
 */
function printReport() {
  log(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.cyan, '  Translation Checker Report');
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const locales = loadLocales();
  const langCount = Object.keys(locales).length;

  log(colors.blue, `📦 Loaded ${langCount} locale files\n`);

  // 1. Coverage Report
  log(colors.cyan, '📊 Translation Coverage:');
  const coverage = calculateCoverage(locales);
  for (const lang in coverage) {
    const { keys, total, percentage } = coverage[lang];
    const color = percentage === 100 ? colors.green : percentage >= 50 ? colors.yellow : colors.red;
    const bar = '█'.repeat(Math.floor(percentage / 5));
    log(color, `  ${lang}: ${bar} ${percentage}% (${keys}/${total} keys)`);
  }

  // 2. Missing Keys
  console.log('');
  log(colors.cyan, '🔍 Missing Keys Check:');
  const missing = checkMissingKeys(locales);
  if (Object.keys(missing).length === 0) {
    log(colors.green, '  ✅ No missing keys found!');
  } else {
    for (const lang in missing) {
      log(colors.red, `  ❌ ${lang}: ${missing[lang].length} missing keys`);
      missing[lang].slice(0, 5).forEach(key => {
        console.log(`     - ${key}`);
      });
      if (missing[lang].length > 5) {
        console.log(`     ... and ${missing[lang].length - 5} more`);
      }
    }
  }

  // 3. Extra Keys
  console.log('');
  log(colors.cyan, '🔍 Extra Keys Check:');
  const extra = checkExtraKeys(locales);
  if (Object.keys(extra).length === 0) {
    log(colors.green, '  ✅ No extra keys found!');
  } else {
    for (const lang in extra) {
      log(colors.yellow, `  ⚠️  ${lang}: ${extra[lang].length} extra keys`);
      extra[lang].forEach(key => {
        console.log(`     - ${key}`);
      });
    }
  }

  // 4. Empty Values
  console.log('');
  log(colors.cyan, '🔍 Empty Values Check:');
  const empty = checkEmptyValues(locales);
  if (Object.keys(empty).length === 0) {
    log(colors.green, '  ✅ No empty values found!');
  } else {
    for (const lang in empty) {
      log(colors.red, `  ❌ ${lang}: ${empty[lang].length} empty values`);
      empty[lang].forEach(key => {
        console.log(`     - ${key}`);
      });
    }
  }

  // 5. Summary
  console.log('');
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const totalIssues =
    Object.values(missing).reduce((sum, arr) => sum + arr.length, 0) +
    Object.values(extra).reduce((sum, arr) => sum + arr.length, 0) +
    Object.values(empty).reduce((sum, arr) => sum + arr.length, 0);

  if (totalIssues === 0) {
    log(colors.green, '✅ All checks passed! Translations are in sync.');
  } else {
    log(colors.yellow, `⚠️  Found ${totalIssues} issues across all locales.`);
  }
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ==========================================
// Main
// ==========================================

printReport();
