/**
 * Centralized Logger
 * Quản lý tất cả logs - tất cả validators đều log vào file chung
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  LogEntry,
  LogLevel,
  ValidatorLogger,
  ValidatorResult,
  AuditSummary,
  CentralLoggerConfig,
} from '../types.js';
import {
  formatLogEntryForFile,
  formatLogEntryForConsole,
  formatValidatorSummary,
  formatAuditHeader,
  formatAuditFooter,
  fileHeader,
  fileFooter,
  formatTimestamp,
  divider,
  colors,
  icons,
} from './formats.js';

// ============================================
// Central Logger Class
// ============================================

export class CentralLogger {
  private config: CentralLoggerConfig;
  private errors: LogEntry[] = [];
  private warnings: LogEntry[] = [];
  private startTime: Date;
  private logDir: string;
  private errorLogPath: string;
  private warningLogPath: string;
  private fullLogPath: string;
  private timestamp: string;

  constructor(config: Partial<CentralLoggerConfig> = {}) {
    this.config = {
      logDir: config.logDir || './logs/seo-checks',
      console: config.console ?? true,
      file: config.file ?? true,
    };

    this.startTime = new Date();
    this.timestamp = this.startTime.toISOString().replace(/[:.]/g, '-').substring(0, 19);

    // Setup log directory
    this.logDir = path.resolve(this.config.logDir);
    this.ensureDir(this.logDir);

    // Log file paths - TẤT CẢ validators log vào file chung
    this.errorLogPath = path.join(this.logDir, `errors-${this.timestamp}.log`);
    this.warningLogPath = path.join(this.logDir, `warnings-${this.timestamp}.log`);
    this.fullLogPath = path.join(this.logDir, `audit-full-${this.timestamp}.log`);

    // Initialize log files with headers
    if (this.config.file) {
      this.initLogFiles();
    }
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initLogFiles(): void {
    const errorHeader = fileHeader('SEO ERRORS LOG', this.startTime);
    const warningHeader = fileHeader('SEO WARNINGS LOG', this.startTime);

    fs.writeFileSync(this.errorLogPath, errorHeader);
    fs.writeFileSync(this.warningLogPath, warningHeader);
    fs.writeFileSync(this.fullLogPath, formatAuditHeader(this.startTime));
  }

  /**
   * Tạo một ValidatorLogger cho một validator cụ thể
   * Validator sẽ dùng logger này để log, và logs sẽ được ghi vào file chung
   */
  createValidatorLogger(validatorName: string, validatorSlug: string): ValidatorLogger {
    const self = this;

    return {
      validatorName,
      validatorSlug,

      error(entry: Omit<LogEntry, 'timestamp' | 'level' | 'validator'>): void {
        const fullEntry: LogEntry = {
          ...entry,
          timestamp: new Date(),
          level: 'error',
          validator: validatorName,
        };

        self.errors.push(fullEntry);
        self.writeLogEntry(fullEntry);
      },

      warning(entry: Omit<LogEntry, 'timestamp' | 'level' | 'validator'>): void {
        const fullEntry: LogEntry = {
          ...entry,
          timestamp: new Date(),
          level: 'warning',
          validator: validatorName,
        };

        self.warnings.push(fullEntry);
        self.writeLogEntry(fullEntry);
      },

      info(message: string): void {
        if (self.config.console) {
          console.log(colors.info(`${icons.info} [${validatorName}] ${message}`));
        }
      },

      getStats(): { errors: number; warnings: number } {
        return {
          errors: self.errors.filter((e) => e.validator === validatorName).length,
          warnings: self.warnings.filter((w) => w.validator === validatorName).length,
        };
      },
    };
  }

  /**
   * Ghi một log entry vào file tương ứng
   */
  private writeLogEntry(entry: LogEntry): void {
    // Console output
    if (this.config.console) {
      console.log(formatLogEntryForConsole(entry));
    }

    // File output
    if (this.config.file) {
      const logPath = entry.level === 'error' ? this.errorLogPath : this.warningLogPath;
      const index = entry.level === 'error'
        ? this.errors.length - 1
        : this.warnings.length - 1;

      const formatted = formatLogEntryForFile(entry, index);
      fs.appendFileSync(logPath, formatted + '\n');
      fs.appendFileSync(this.fullLogPath, formatted + '\n');
    }
  }

  /**
   * Log kết quả của một validator
   */
  logValidatorResult(result: ValidatorResult): void {
    const summary = formatValidatorSummary(
      result.name,
      result.passed,
      result.errorCount,
      result.warningCount,
      result.duration
    );

    if (this.config.console) {
      console.log(summary);
    }

    if (this.config.file) {
      // Strip ANSI codes for file
      const plainSummary = summary.replace(/\x1B\[[0-9;]*m/g, '');
      fs.appendFileSync(this.fullLogPath, plainSummary + '\n');
    }
  }

  /**
   * Finalize logs và tạo summary
   */
  finalize(results: ValidatorResult[]): AuditSummary {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.startTime.getTime();

    const summary: AuditSummary = {
      startTime: this.startTime,
      endTime,
      totalDuration,
      totalFilesChecked: results.reduce((sum, r) => sum + r.filesChecked, 0),
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      validators: results,
      passed: this.errors.length === 0,
    };

    // Console output
    if (this.config.console) {
      console.log(
        formatAuditFooter(
          summary.passed,
          summary.totalErrors,
          summary.totalWarnings,
          summary.totalDuration
        )
      );
    }

    // File output
    if (this.config.file) {
      // Update error log footer
      fs.appendFileSync(
        this.errorLogPath,
        fileFooter(this.errors.length, 0)
      );

      // Update warning log footer
      fs.appendFileSync(
        this.warningLogPath,
        fileFooter(0, this.warnings.length)
      );

      // Update full log footer
      const plainFooter = formatAuditFooter(
        summary.passed,
        summary.totalErrors,
        summary.totalWarnings,
        summary.totalDuration
      ).replace(/\x1B\[[0-9;]*m/g, '');
      fs.appendFileSync(this.fullLogPath, plainFooter);

      // Write summary JSON
      const summaryPath = path.join(this.logDir, `summary-${this.timestamp}.json`);
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

      // Create symlinks to latest logs
      this.createLatestSymlinks();

      // Log file locations
      console.log(colors.muted(`\n${icons.file} Logs saved to:`));
      console.log(colors.muted(`   Errors:   ${this.errorLogPath}`));
      console.log(colors.muted(`   Warnings: ${this.warningLogPath}`));
      console.log(colors.muted(`   Full:     ${this.fullLogPath}`));
      console.log(colors.muted(`   Summary:  ${summaryPath}`));
    }

    return summary;
  }

  /**
   * Tạo symlinks đến logs mới nhất
   */
  private createLatestSymlinks(): void {
    const links = [
      { target: this.errorLogPath, link: path.join(this.logDir, 'latest-errors.log') },
      { target: this.warningLogPath, link: path.join(this.logDir, 'latest-warnings.log') },
      { target: this.fullLogPath, link: path.join(this.logDir, 'latest-full.log') },
    ];

    for (const { target, link } of links) {
      try {
        if (fs.existsSync(link)) {
          fs.unlinkSync(link);
        }
        // On Windows, copy instead of symlink (symlinks require admin)
        fs.copyFileSync(target, link);
      } catch {
        // Ignore symlink errors (Windows permission issues)
      }
    }
  }

  /**
   * Getters cho stats
   */
  get errorCount(): number {
    return this.errors.length;
  }

  get warningCount(): number {
    return this.warnings.length;
  }

  get allErrors(): LogEntry[] {
    return [...this.errors];
  }

  get allWarnings(): LogEntry[] {
    return [...this.warnings];
  }
}

export default CentralLogger;