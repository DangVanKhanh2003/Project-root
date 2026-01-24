/**
 * SEO Checker Configuration
 * Cấu hình chung cho tất cả validators
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { getSiteConfig } from './sites.config.js';
import type { SiteConfig } from './sites.config.js';

// ============================================
// Target Directory Configuration
// ============================================

/**
 * Thứ tự ưu tiên tìm target directory bên trong một app:
 * 1. dist/ (Vite build output) - ưu tiên cao nhất
 * 2. _11ty-output/ (Eleventy output)
 * 3. public/ (static files)
 * 4. root của app (fallback)
 */
const TARGET_PRIORITY = ['dist', '_11ty-output', 'public', '.'] as const;

/**
 * Lấy đường dẫn gốc của monorepo.
 * Giả định rằng thư mục 'skills' nằm ở gốc.
 */
export function getMonorepoRoot(): string {
  // __dirname là thư mục hiện tại (src), đi lên 2 cấp để ra khỏi 'src' và 'test-seo'
  return path.resolve(process.cwd(), '..', '..');
}

/**
 * Lấy đường dẫn gốc của một app cụ thể.
 * @param siteId - ID của site (tên thư mục trong `apps/`)
 * @returns Đường dẫn tuyệt đối đến thư mục của app.
 */
export function getAppRoot(siteId: string): string {
  return path.resolve(getMonorepoRoot(), 'apps', siteId);
}

/**
 * Tìm target directory (thư mục build output) để check SEO trong một app.
 * @param appRoot - Thư mục gốc của app.
 * @returns Đường dẫn tuyệt đối đến target directory.
 */
export function getTargetDir(appRoot: string): string {
  // Check nếu có environment variable override
  const envTarget = process.env.SEO_CHECK_TARGET;
  if (envTarget) {
    const envTargetPath = path.resolve(appRoot, envTarget);
    if (fs.existsSync(envTargetPath)) {
      return envTargetPath;
    }
    console.warn(`Warning: SEO_CHECK_TARGET="${envTarget}" not found, using auto-detect`);
  }

  // Auto-detect target directory theo thứ tự ưu tiên
  for (const dir of TARGET_PRIORITY) {
    const targetPath = dir === '.' ? appRoot : path.resolve(appRoot, dir);
    if (fs.existsSync(targetPath)) {
      // Với dist/ hoặc _11ty-output/, kiểm tra có HTML files không để chắc chắn
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

  // Fallback to app root
  return appRoot;
}


// ============================================
// File Patterns
// ============================================

export const FILE_PATTERNS = {
  /** Patterns to include when scanning */
  include: ['**/*.html'],

  /** Patterns to exclude when scanning */
  exclude: [
    '**/node_modules/**',
    '**/404.html',
    '**/*.min.html',
  ],
} as const;

// ============================================
// Export default config
// ============================================

export default {
  getTargetDir,
  getAppRoot,
  getSiteConfig,
  FILE_PATTERNS,
};