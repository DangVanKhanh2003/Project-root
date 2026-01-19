/**
 * SEO Checker Configuration
 * Cấu hình chung cho tất cả validators
 */

import * as path from 'node:path';
import * as fs from 'node:fs';

// ============================================
// Target Directory Configuration
// ============================================

/**
 * Thứ tự ưu tiên tìm target directory:
 * 1. dist/ (Vite build output) - ưu tiên cao nhất
 * 2. _11ty-output/ (Eleventy output)
 * 3. public/ (static files)
 * 4. root (fallback)
 */
const TARGET_PRIORITY = ['dist', '_11ty-output', 'public', '.'] as const;

/**
 * Tìm target directory để check SEO
 * @param rootDir - Thư mục gốc của project (default: process.cwd())
 * @returns Target directory path
 */
export function getTargetDir(rootDir: string = process.cwd()): string {
  // Check nếu có environment variable override
  const envTarget = process.env.SEO_CHECK_TARGET;
  if (envTarget) {
    const envTargetPath = path.resolve(rootDir, envTarget);
    if (fs.existsSync(envTargetPath)) {
      return envTargetPath;
    }
    console.warn(`Warning: SEO_CHECK_TARGET="${envTarget}" not found, using auto-detect`);
  }

  // Auto-detect target directory theo thứ tự ưu tiên
  for (const dir of TARGET_PRIORITY) {
    const targetPath = dir === '.' ? rootDir : path.resolve(rootDir, dir);
    if (fs.existsSync(targetPath)) {
      // Với dist/, kiểm tra có HTML files không
      if (dir === 'dist' || dir === '_11ty-output') {
        const hasHtml = fs.readdirSync(targetPath).some(f => f.endsWith('.html'));
        if (hasHtml) {
          return targetPath;
        }
      } else {
        return targetPath;
      }
    }
  }

  // Fallback to root
  return rootDir;
}

/**
 * Lấy project root directory
 * Tìm ngược lên từ cwd cho đến khi thấy package.json
 */
export function getProjectRoot(): string {
  let current = process.cwd();

  // Nếu đang chạy từ skills/seo-checker, tìm ngược lên
  while (current !== path.dirname(current)) {
    const packageJson = path.join(current, 'package.json');
    if (fs.existsSync(packageJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
        // Tìm package.json của ytmp3.my (không phải của seo-checker)
        if (pkg.name === 'ytmp3.my') {
          return current;
        }
      } catch {
        // Ignore parse errors
      }
    }
    current = path.dirname(current);
  }

  // Fallback to cwd
  return process.cwd();
}

// ============================================
// Site Configuration
// ============================================

export const SITE_CONFIG = {
  baseUrl: 'https://ytmp3.my',
  defaultLanguage: 'en',
  supportedLanguages: [
    'ar', 'bn', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko',
    'ms', 'my', 'pt', 'ru', 'th', 'tr', 'ur', 'vi',
  ],
} as const;

// ============================================
// File Patterns
// ============================================

export const FILE_PATTERNS = {
  /** Patterns to include when scanning */
  include: ['**/*.html'],

  /** Patterns to exclude when scanning */
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/_11ty-output/**',
    '**/_templates/**',
    '**/_html-backup/**',
    '**/404.html',
    '**/*.min.html',
  ],
} as const;

// ============================================
// Export default config
// ============================================

export default {
  getTargetDir,
  getProjectRoot,
  SITE_CONFIG,
  FILE_PATTERNS,
};
