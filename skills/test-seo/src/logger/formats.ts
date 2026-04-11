/**
 * Log Formatting Utilities
 * Các hàm format log cho console và file
 */

import chalk from 'chalk';
import type { LogEntry, LogLevel } from '../types.js';

// ============================================
// Colors & Styles
// ============================================

export const colors = {
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  success: chalk.green,
  muted: chalk.gray,
  highlight: chalk.cyan,
  bold: chalk.bold,
  dim: chalk.dim,
};

export const icons = {
  error: '\u274C',      // ❌
  warning: '\u26A0\uFE0F',  // ⚠️
  success: '\u2705',    // ✅
  info: '\u2139\uFE0F',     // ℹ️
  file: '\uD83D\uDCC4',     // 📄
  location: '\uD83D\uDCCD', // 📍
  component: '\uD83D\uDD27', // 🔧
  fix: '\uD83D\uDCA1',      // 💡
  clock: '\u23F1\uFE0F',    // ⏱️
  check: '\u2714\uFE0F',    // ✔️
  cross: '\u2716\uFE0F',    // ✖️
};

// ============================================
// Box Drawing Characters
// ============================================

const box = {
  topLeft: '\u250C',
  topRight: '\u2510',
  bottomLeft: '\u2514',
  bottomRight: '\u2518',
  horizontal: '\u2500',
  vertical: '\u2502',
  teeRight: '\u251C',
  teeLeft: '\u2524',
};

// ============================================
// Formatting Functions
// ============================================

export function divider(char = '\u2500', length = 60): string {
  return char.repeat(length);
}

export function boxHeader(title: string, width = 60): string {
  const padding = title.length > width - 4 ? 0 : width - title.length - 4;
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;

  return [
    box.topLeft + box.horizontal.repeat(width - 2) + box.topRight,
    box.vertical + ' '.repeat(leftPad) + title + ' '.repeat(rightPad) + box.vertical,
    box.bottomLeft + box.horizontal.repeat(width - 2) + box.bottomRight,
  ].join('\n');
}

export function sectionHeader(title: string): string {
  return `\n${colors.bold(colors.highlight(`=== ${title} ===`))}\n`;
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

// ============================================
// Log Entry Formatting
// ============================================

export function formatLogEntryForFile(entry: LogEntry, index: number): string {
  const levelIcon = entry.level === 'error' ? icons.error : icons.warning;
  const levelLabel = entry.level.toUpperCase();

  const lines = [
    divider(),
    `${box.topLeft}${box.horizontal} ${levelIcon} ${levelLabel} #${index + 1}`,
    `${box.vertical} ${icons.file} File: ${entry.file}`,
  ];

  if (entry.location) {
    lines.push(`${box.vertical} ${icons.location} Location: ${entry.location}`);
  }

  lines.push(`${box.vertical} ${icons.component} Component: ${entry.component}`);
  lines.push(`${box.vertical} ${levelIcon} Issue: ${entry.issue}`);

  if (entry.reason) {
    lines.push(`${box.vertical} ${icons.info} Reason: ${entry.reason}`);
  }

  if (entry.currentValue) {
    lines.push(`${box.vertical}    Current: "${entry.currentValue}"`);
  }

  if (entry.expectedValue) {
    lines.push(`${box.vertical}    Expected: "${entry.expectedValue}"`);
  }

  if (entry.fix) {
    lines.push(`${box.vertical} ${icons.fix} Fix: ${entry.fix}`);
  }

  lines.push(`${box.vertical} ${icons.clock} Validator: ${entry.validator}`);
  lines.push(`${box.vertical} ${icons.clock} Time: ${formatTimestamp(entry.timestamp)}`);
  lines.push(`${box.bottomLeft}${divider(box.horizontal, 59)}`);

  return lines.join('\n');
}

export function formatLogEntryForConsole(entry: LogEntry): string {
  const colorFn = entry.level === 'error' ? colors.error : colors.warning;
  const icon = entry.level === 'error' ? icons.error : icons.warning;

  return colorFn(
    `${icon} [${entry.validator}] ${entry.file}: ${entry.issue}`
  );
}

// ============================================
// Summary Formatting
// ============================================

export function formatValidatorSummary(
  name: string,
  passed: boolean,
  errors: number,
  warnings: number,
  duration: number
): string {
  const status = passed
    ? colors.success(`${icons.success} PASSED`)
    : colors.error(`${icons.error} FAILED`);

  const stats = [
    errors > 0 ? colors.error(`${errors} errors`) : colors.muted('0 errors'),
    warnings > 0 ? colors.warning(`${warnings} warnings`) : colors.muted('0 warnings'),
  ].join(', ');

  return `${status} ${colors.bold(name)} - ${stats} (${formatDuration(duration)})`;
}

export function formatAuditHeader(timestamp: Date): string {
  return [
    '',
    boxHeader('SEO AUDIT REPORT'),
    '',
    `${icons.clock} Started: ${formatTimestamp(timestamp)}`,
    divider(),
    '',
  ].join('\n');
}

export function formatAuditFooter(
  passed: boolean,
  totalErrors: number,
  totalWarnings: number,
  duration: number
): string {
  const status = passed
    ? colors.success.bold(`\n${icons.success} ALL CHECKS PASSED`)
    : colors.error.bold(`\n${icons.error} AUDIT FAILED`);

  return [
    '',
    divider('='),
    status,
    '',
    `Total Errors: ${totalErrors > 0 ? colors.error(totalErrors.toString()) : colors.success('0')}`,
    `Total Warnings: ${totalWarnings > 0 ? colors.warning(totalWarnings.toString()) : colors.success('0')}`,
    `Duration: ${formatDuration(duration)}`,
    divider('='),
  ].join('\n');
}

// ============================================
// File Header/Footer
// ============================================

export function fileHeader(title: string, timestamp: Date): string {
  return [
    divider('='),
    `${title}`,
    `Generated: ${formatTimestamp(timestamp)}`,
    divider('='),
    '',
  ].join('\n');
}

export function fileFooter(errorCount: number, warningCount: number): string {
  return [
    '',
    divider('='),
    `SUMMARY`,
    `Total Errors: ${errorCount}`,
    `Total Warnings: ${warningCount}`,
    divider('='),
  ].join('\n');
}