/**
 * SEO Checker Types
 * Định nghĩa các interface cho hệ thống SEO validation
 */

// ============================================
// Log Entry Types
// ============================================

export type LogLevel = 'error' | 'warning' | 'info';

export interface LogEntry {
  /** Timestamp của log */
  timestamp: Date;
  /** Level của log: error, warning, info */
  level: LogLevel;
  /** Tên validator tạo log */
  validator: string;
  /** File HTML bị lỗi */
  file: string;
  /** Vị trí trong file (e.g., <head>, <body>, line 42) */
  location?: string;
  /** Component bị ảnh hưởng (e.g., "Canonical URL", "Meta Description") */
  component: string;
  /** Mô tả vấn đề */
  issue: string;
  /** Lý do tại sao đây là vấn đề */
  reason?: string;
  /** Cách fix */
  fix?: string;
  /** Giá trị hiện tại (nếu có) */
  currentValue?: string;
  /** Giá trị mong đợi (nếu có) */
  expectedValue?: string;
}

// ============================================
// Validator Types
// ============================================

export interface ValidatorResult {
  /** Tên validator */
  name: string;
  /** Slug của validator (dùng cho CLI) */
  slug: string;
  /** Validator có pass không */
  passed: boolean;
  /** Số lỗi */
  errorCount: number;
  /** Số warning */
  warningCount: number;
  /** Số file đã check */
  filesChecked: number;
  /** Thời gian chạy (ms) */
  duration: number;
}

export interface Validator {
  /** Tên hiển thị của validator */
  name: string;
  /** Slug để dùng trong CLI */
  slug: string;
  /** Mô tả validator */
  description: string;
  /** Hàm chạy validation */
  run: (logger: ValidatorLogger) => Promise<ValidatorResult>;
}

// ============================================
// Logger Types
// ============================================

export interface ValidatorLogger {
  /** Tên validator */
  validatorName: string;
  /** Slug của validator */
  validatorSlug: string;
  /** Log error */
  error: (entry: Omit<LogEntry, 'timestamp' | 'level' | 'validator'>) => void;
  /** Log warning */
  warning: (entry: Omit<LogEntry, 'timestamp' | 'level' | 'validator'>) => void;
  /** Log info */
  info: (message: string) => void;
  /** Lấy stats */
  getStats: () => { errors: number; warnings: number };
}

export interface CentralLoggerConfig {
  /** Thư mục gốc để lưu logs */
  logDir: string;
  /** Có ghi log ra console không */
  console: boolean;
  /** Có ghi log ra file không */
  file: boolean;
}

// ============================================
// File Scanner Types
// ============================================

export interface ScanOptions {
  /** Thư mục gốc để scan */
  rootDir: string;
  /** Glob patterns để include */
  include?: string[];
  /** Glob patterns để exclude */
  exclude?: string[];
}

export interface ScannedFile {
  /** Đường dẫn tuyệt đối */
  absolutePath: string;
  /** Đường dẫn tương đối từ rootDir */
  relativePath: string;
  /** Ngôn ngữ (nếu có, e.g., 'en', 'vi') */
  language?: string;
  /** Loại trang (e.g., 'index', 'faq', 'youtube-to-mp3') */
  pageType?: string;
}

// ============================================
// HTML Parser Types
// ============================================

import type { CheerioAPI } from 'cheerio';

export interface ParsedHTML {
  /** Cheerio instance */
  $: CheerioAPI;
  /** Nội dung HTML raw */
  raw: string;
  /** Đường dẫn file */
  filePath: string;
}

export interface CanonicalTag {
  exists: boolean;
  href?: string;
  element?: unknown; // Cheerio element
}

export interface AlternateTag {
  hreflang: string;
  href: string;
}

export interface MetaTags {
  title?: string;
  description?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
}

export interface JsonLdData {
  exists: boolean;
  isValid: boolean;
  data?: Record<string, unknown>;
  raw?: string;
  parseError?: string;
  inHead: boolean;
}

// ============================================
// Audit Report Types
// ============================================

export interface AuditSummary {
  /** Timestamp bắt đầu audit */
  startTime: Date;
  /** Timestamp kết thúc audit */
  endTime: Date;
  /** Tổng thời gian (ms) */
  totalDuration: number;
  /** Tổng số file đã check */
  totalFilesChecked: number;
  /** Tổng số errors */
  totalErrors: number;
  /** Tổng số warnings */
  totalWarnings: number;
  /** Kết quả từng validator */
  validators: ValidatorResult[];
  /** Audit có pass không (0 errors) */
  passed: boolean;
}

// Re-export cheerio types for convenience
export type { CheerioAPI };
