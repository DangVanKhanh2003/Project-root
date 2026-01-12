/**
 * File Scanner Utility
 * Scan HTML files trong project
 *
 * IMPORTANT: Mặc định scan trong dist/ (build output)
 * vì đó là output thực tế sẽ deploy
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import type { ScanOptions, ScannedFile } from '../types.js';
import { FILE_PATTERNS } from '../config.js';

// ============================================
// Default Configuration
// ============================================

const DEFAULT_INCLUDE = FILE_PATTERNS.include;
const DEFAULT_EXCLUDE = FILE_PATTERNS.exclude;

// Language codes được support
export const SUPPORTED_LANGUAGES = [
  'en', 'vi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
  'ar', 'hi', 'th', 'id', 'ms', 'tr', 'pl', 'nl', 'sv', 'da', 'no',
  'fi', 'cs', 'el', 'he', 'uk', 'ro', 'hu', 'sk', 'bg', 'hr', 'sr',
  'bn', 'ur', 'my',
];

// ============================================
// File Scanner Functions
// ============================================

/**
 * Scan tất cả HTML files trong project
 */
export async function scanHtmlFiles(options: ScanOptions): Promise<ScannedFile[]> {
  const { rootDir, include = DEFAULT_INCLUDE, exclude = DEFAULT_EXCLUDE } = options;

  const absoluteRoot = path.resolve(rootDir);

  // Use fast-glob to find files
  const patterns = include.map((p) => path.posix.join(absoluteRoot.replace(/\\/g, '/'), p));
  const ignorePatterns = exclude.map((p) => path.posix.join(absoluteRoot.replace(/\\/g, '/'), p));

  const files = await fg(patterns, {
    ignore: ignorePatterns,
    onlyFiles: true,
    absolute: true,
    dot: false,
  });

  return files.map((absolutePath) => {
    const relativePath = path.relative(absoluteRoot, absolutePath).replace(/\\/g, '/');
    const { language, pageType } = parseFilePath(relativePath);

    return {
      absolutePath: absolutePath.replace(/\\/g, '/'),
      relativePath,
      language,
      pageType,
    };
  });
}

/**
 * Scan chỉ root HTML files (không trong pages/)
 */
export async function scanRootHtmlFiles(options: ScanOptions): Promise<ScannedFile[]> {
  const allFiles = await scanHtmlFiles(options);
  return allFiles.filter((f) => !f.relativePath.startsWith('pages/'));
}

/**
 * Scan chỉ pages HTML files
 */
export async function scanPageHtmlFiles(options: ScanOptions): Promise<ScannedFile[]> {
  const allFiles = await scanHtmlFiles(options);
  return allFiles.filter((f) => f.relativePath.startsWith('pages/'));
}

/**
 * Scan language directories
 */
export async function scanLanguageDirectories(rootDir: string): Promise<string[]> {
  const pagesDir = path.join(rootDir, 'pages');

  if (!fs.existsSync(pagesDir)) {
    return [];
  }

  const entries = fs.readdirSync(pagesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_LANGUAGES.includes(name));
}

/**
 * Get all pages for a specific language
 */
export async function scanLanguagePages(
  rootDir: string,
  language: string
): Promise<ScannedFile[]> {
  const langDir = path.join(rootDir, 'pages', language);

  if (!fs.existsSync(langDir)) {
    return [];
  }

  return scanHtmlFiles({
    rootDir: langDir,
    include: ['*.html'],
    exclude: [],
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse file path để extract language và page type
 */
function parseFilePath(relativePath: string): { language?: string; pageType?: string } {
  // Pattern: pages/{lang}/{page}.html
  const pagesMatch = relativePath.match(/^pages\/([a-z]{2}(?:-[A-Z]{2})?)\/(.+)\.html$/);

  if (pagesMatch) {
    return {
      language: pagesMatch[1],
      pageType: pagesMatch[2],
    };
  }

  // Root pages: {page}.html
  const rootMatch = relativePath.match(/^([^/]+)\.html$/);
  if (rootMatch) {
    return {
      language: undefined,
      pageType: rootMatch[1],
    };
  }

  return {};
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Read file content
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Get expected URL for a file
 */
export function getExpectedUrl(
  relativePath: string,
  baseUrl: string = 'https://y2matepro.com'
): string {
  // Remove .html extension và /index
  let url = relativePath
    .replace(/\.html$/, '')
    .replace(/\/index$/, '');

  // Handle root index
  if (url === 'index') {
    url = '';
  }

  return `${baseUrl}/${url}`.replace(/\/+$/, '') || baseUrl;
}

/**
 * Get all page types từ root directory
 */
export async function getPageTypes(rootDir: string): Promise<string[]> {
  const rootFiles = await scanRootHtmlFiles({ rootDir });
  return rootFiles
    .map((f) => f.pageType)
    .filter((p): p is string => !!p && p !== '404');
}

export default {
  scanHtmlFiles,
  scanRootHtmlFiles,
  scanPageHtmlFiles,
  scanLanguageDirectories,
  scanLanguagePages,
  fileExists,
  readFile,
  getExpectedUrl,
  getPageTypes,
  SUPPORTED_LANGUAGES,
};
