#!/usr/bin/env npx tsx
/**
 * Interactive SEO Tester
 * Cho phep chon site nao de test SEO
 */

import { checkbox, confirm } from '@inquirer/prompts';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

// ============================================
// Configuration
// ============================================

interface SiteConfig {
  name: string;
  path: string;
  seoCheckerPath: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Tim tat ca apps co seo-checker skill
 */
function findAppsWithSeoChecker(rootDir: string): SiteConfig[] {
  const appsDir = path.join(rootDir, 'apps');
  const sites: SiteConfig[] = [];

  if (!fs.existsSync(appsDir)) {
    console.log('Khong tim thay thu muc apps/');
    return sites;
  }

  const apps = fs.readdirSync(appsDir, { withFileTypes: true });

  for (const app of apps) {
    if (!app.isDirectory()) continue;

    const appPath = path.join(appsDir, app.name);
    const seoCheckerPath = path.join(appPath, 'skills', 'seo-checker');

    if (fs.existsSync(seoCheckerPath)) {
      sites.push({
        name: app.name,
        path: appPath,
        seoCheckerPath,
      });
    }
  }

  return sites;
}

/**
 * Chay SEO checker cho 1 site
 */
function runSeoChecker(site: SiteConfig): Promise<{ passed: boolean; output: string }> {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  Testing: ${site.name}`);
    console.log(`${'='.repeat(60)}\n`);

    const isWindows = process.platform === 'win32';
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';

    const child = spawn(npmCmd, ['run', 'dev'], {
      cwd: site.seoCheckerPath,
      stdio: 'inherit',
      shell: true,
    });

    let output = '';

    child.on('close', (code) => {
      resolve({
        passed: code === 0,
        output,
      });
    });

    child.on('error', (err) => {
      console.error(`Error running seo-checker for ${site.name}:`, err.message);
      resolve({
        passed: false,
        output: err.message,
      });
    });
  });
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  const rootDir = process.cwd();

  console.log('\n');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║       SEO TESTER - Interactive Mode      ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('\n');

  // Tim cac sites co seo-checker
  const sites = findAppsWithSeoChecker(rootDir);

  if (sites.length === 0) {
    console.log('Khong tim thay site nao co seo-checker skill.');
    console.log('Dam bao ban dang chay tu thu muc root cua project.');
    process.exit(1);
  }

  console.log(`Tim thay ${sites.length} site(s) co seo-checker:\n`);

  // Hien thi checkbox de nguoi dung chon
  const selectedSites = await checkbox({
    message: 'Chon site(s) de test SEO (Space de chon, Enter de confirm):',
    choices: sites.map((site) => ({
      name: site.name,
      value: site,
      checked: false,
    })),
    required: true,
  });

  if (selectedSites.length === 0) {
    console.log('\nKhong co site nao duoc chon. Thoat.');
    process.exit(0);
  }

  // Xac nhan truoc khi chay
  const confirmed = await confirm({
    message: `Ban se test ${selectedSites.length} site(s). Tiep tuc?`,
    default: true,
  });

  if (!confirmed) {
    console.log('\nDa huy. Thoat.');
    process.exit(0);
  }

  // Chay SEO checker cho tung site
  const results: Array<{ site: string; passed: boolean }> = [];

  for (const site of selectedSites) {
    const result = await runSeoChecker(site);
    results.push({
      site: site.name,
      passed: result.passed,
    });
  }

  // Hien thi ket qua tong hop
  console.log('\n');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║              KET QUA TONG HOP            ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('\n');

  let allPassed = true;

  for (const result of results) {
    const status = result.passed ? '✓ PASSED' : '✗ FAILED';
    const color = result.passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${color}${status}\x1b[0m  ${result.site}`);
    if (!result.passed) allPassed = false;
  }

  console.log('\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
