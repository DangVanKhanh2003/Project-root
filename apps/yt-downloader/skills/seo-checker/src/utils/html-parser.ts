/**
 * HTML Parser Utility
 * Parse HTML files và extract SEO-related elements
 */

import * as fs from 'node:fs';
import * as cheerio from 'cheerio';
import type {
  ParsedHTML,
  CanonicalTag,
  AlternateTag,
  MetaTags,
  JsonLdData,
} from '../types.js';

// ============================================
// Core Parser
// ============================================

/**
 * Load và parse HTML file
 */
export function parseHtmlFile(filePath: string): ParsedHTML {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(raw);

  return {
    $,
    raw,
    filePath,
  };
}

/**
 * Parse HTML string
 */
export function parseHtmlString(html: string, filePath: string = ''): ParsedHTML {
  const $ = cheerio.load(html);
  return {
    $,
    raw: html,
    filePath,
  };
}

// ============================================
// SEO Element Extractors
// ============================================

/**
 * Extract canonical tag
 */
export function extractCanonical(parsed: ParsedHTML): CanonicalTag {
  const { $ } = parsed;
  const canonical = $('link[rel="canonical"]');

  if (canonical.length === 0) {
    return { exists: false };
  }

  return {
    exists: true,
    href: canonical.attr('href'),
    element: canonical,
  };
}

/**
 * Extract alternate (hreflang) tags
 */
export function extractAlternateTags(parsed: ParsedHTML): AlternateTag[] {
  const { $ } = parsed;
  const alternates: AlternateTag[] = [];

  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const $el = $(el);
    const hreflang = $el.attr('hreflang');
    const href = $el.attr('href');

    if (hreflang && href) {
      alternates.push({ hreflang, href });
    }
  });

  return alternates;
}

/**
 * Extract meta tags
 */
export function extractMetaTags(parsed: ParsedHTML): MetaTags {
  const { $ } = parsed;

  return {
    title: $('title').first().text().trim() || undefined,
    description: $('meta[name="description"]').attr('content')?.trim(),
    robots: $('meta[name="robots"]').attr('content')?.trim(),
    ogTitle: $('meta[property="og:title"]').attr('content')?.trim(),
    ogDescription: $('meta[property="og:description"]').attr('content')?.trim(),
    ogImage: $('meta[property="og:image"]').attr('content')?.trim(),
    twitterCard: $('meta[name="twitter:card"]').attr('content')?.trim(),
  };
}

/**
 * Extract JSON-LD structured data
 */
export function extractJsonLd(parsed: ParsedHTML): JsonLdData[] {
  const { $ } = parsed;
  const results: JsonLdData[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const $el = $(el);
    const raw = $el.html()?.trim();
    const inHead = $el.parents('head').length > 0;

    if (!raw) {
      results.push({
        exists: true,
        isValid: false,
        parseError: 'Empty JSON-LD script',
        inHead,
      });
      return;
    }

    try {
      const data = JSON.parse(raw);
      results.push({
        exists: true,
        isValid: true,
        data,
        raw,
        inHead,
      });
    } catch (error) {
      results.push({
        exists: true,
        isValid: false,
        raw,
        parseError: error instanceof Error ? error.message : 'Invalid JSON',
        inHead,
      });
    }
  });

  if (results.length === 0) {
    results.push({
      exists: false,
      isValid: false,
      inHead: false,
    });
  }

  return results;
}

/**
 * Extract all internal links
 */
export function extractInternalLinks(parsed: ParsedHTML): string[] {
  const { $ } = parsed;
  const links: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#')) {
      links.push(href);
    }
  });

  return [...new Set(links)];
}

/**
 * Check if language dropdown exists
 */
export function hasLanguageDropdown(parsed: ParsedHTML): boolean {
  const { $ } = parsed;

  // Check various selectors for language dropdown
  const selectors = [
    '#language-dropdown',
    '.language-dropdown',
    '[data-language-dropdown]',
    '.lang-selector',
    '#lang-selector',
    '[data-lang-selector]',
    '.language-switcher',
    '#language-switcher',
  ];

  return selectors.some((selector) => $(selector).length > 0);
}

/**
 * Extract HTML lang attribute
 */
export function extractHtmlLang(parsed: ParsedHTML): string | undefined {
  const { $ } = parsed;
  return $('html').attr('lang')?.trim();
}

/**
 * Check if page has specific element
 */
export function hasElement(parsed: ParsedHTML, selector: string): boolean {
  const { $ } = parsed;
  return $(selector).length > 0;
}

/**
 * Count occurrences of an element
 */
export function countElements(parsed: ParsedHTML, selector: string): number {
  const { $ } = parsed;
  return $(selector).length;
}

/**
 * Extract text content from selector
 */
export function extractText(parsed: ParsedHTML, selector: string): string | undefined {
  const { $ } = parsed;
  return $(selector).first().text().trim() || undefined;
}

/**
 * Extract attribute from selector
 */
export function extractAttr(
  parsed: ParsedHTML,
  selector: string,
  attr: string
): string | undefined {
  const { $ } = parsed;
  return $(selector).first().attr(attr)?.trim();
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Check if JSON-LD contains HTML tags
 */
export function jsonLdContainsHtml(jsonLd: JsonLdData): { contains: boolean; fields: string[] } {
  if (!jsonLd.data) {
    return { contains: false, fields: [] };
  }

  const htmlTagRegex = /<[^>]+>/;
  const fieldsWithHtml: string[] = [];

  function checkValue(value: unknown, path: string): void {
    if (typeof value === 'string' && htmlTagRegex.test(value)) {
      fieldsWithHtml.push(path);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else {
        Object.entries(value).forEach(([key, val]) => checkValue(val, `${path}.${key}`));
      }
    }
  }

  checkValue(jsonLd.data, 'root');
  return { contains: fieldsWithHtml.length > 0, fields: fieldsWithHtml };
}

/**
 * Check if JSON-LD contains placeholder text
 */
export function jsonLdContainsPlaceholders(
  jsonLd: JsonLdData
): { contains: boolean; fields: string[] } {
  if (!jsonLd.data) {
    return { contains: false, fields: [] };
  }

  // Patterns để detect placeholder text trong JSON-LD
  // - TODO/FIXME: chỉ match UPPERCASE (tránh "todo" tiếng Tây Ban Nha)
  // - Word boundary (\b) để tránh match một phần của từ khác
  const placeholderPatterns = [
    /\bTODO\b/,       // Chỉ uppercase, tránh "todo" (Spanish)
    /\bFIXME\b/,      // Chỉ uppercase
    /\[INSERT\]/i,    // [INSERT] hoặc [insert]
    /\[YOUR/i,        // [YOUR ...
    /\bPLACEHOLDER\b/i,
    /\bXXX\b/,        // XXX marker
    /\{\{.*\}\}/,     // Template syntax {{...}}
  ];

  const fieldsWithPlaceholders: string[] = [];

  function checkValue(value: unknown, path: string): void {
    if (typeof value === 'string') {
      for (const pattern of placeholderPatterns) {
        if (pattern.test(value)) {
          fieldsWithPlaceholders.push(path);
          break;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else {
        Object.entries(value).forEach(([key, val]) => checkValue(val, `${path}.${key}`));
      }
    }
  }

  checkValue(jsonLd.data, 'root');
  return { contains: fieldsWithPlaceholders.length > 0, fields: fieldsWithPlaceholders };
}

export default {
  parseHtmlFile,
  parseHtmlString,
  extractCanonical,
  extractAlternateTags,
  extractMetaTags,
  extractJsonLd,
  extractInternalLinks,
  hasLanguageDropdown,
  extractHtmlLang,
  hasElement,
  countElements,
  extractText,
  extractAttr,
  jsonLdContainsHtml,
  jsonLdContainsPlaceholders,
};
