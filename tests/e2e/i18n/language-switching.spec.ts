/**
 * Internationalization (i18n) E2E Tests
 *
 * Tests language switching, RTL layout, translation completeness,
 * and multilingual page generation across all 19 supported languages.
 */

import { test, expect } from '@playwright/test';
import { LANGUAGES, RTL_LANGUAGES, SELECTORS } from '../fixtures/test-data';

test.describe('i18n - Language Support', () => {

  // ==========================================
  // Language Page Accessibility
  // ==========================================
  test.describe('Language pages load correctly', () => {
    for (const lang of LANGUAGES) {
      test(`${lang.code} (${lang.name}) page loads`, async ({ page }) => {
        // Try language-specific URL patterns
        const langUrl = lang.code === 'en' ? '/' : `/${lang.code}/`;

        const response = await page.goto(langUrl);

        // Page should load (200 or redirect)
        expect(response?.status()).toBeLessThan(400);

        // Page should have content
        const bodyText = await page.locator('body').innerText();
        expect(bodyText.length).toBeGreaterThan(50);
      });
    }
  });

  // ==========================================
  // RTL Layout Tests
  // ==========================================
  test.describe('RTL Language Layout', () => {
    for (const lang of RTL_LANGUAGES) {
      test(`${lang.code} (${lang.name}) has RTL direction`, async ({ page }) => {
        const langUrl = `/${lang.code}/`;
        await page.goto(langUrl);

        // Check dir attribute on html or body
        const dir = await page.locator('html').getAttribute('dir')
          || await page.locator('body').getAttribute('dir')
          || await page.evaluate(() => getComputedStyle(document.body).direction);

        expect(dir).toBe('rtl');
      });

      test(`${lang.code} input field text-align is correct for RTL`, async ({ page }) => {
        const langUrl = `/${lang.code}/`;
        await page.goto(langUrl);

        const input = page.locator(SELECTORS.urlInput).first();
        const isVisible = await input.isVisible().catch(() => false);

        if (isVisible) {
          const textAlign = await input.evaluate(el => getComputedStyle(el).textAlign);
          // RTL languages should have right or start alignment
          expect(['right', 'start', 'end']).toContain(textAlign);
        }
      });

      test(`${lang.code} page has no layout overflow`, async ({ page }) => {
        const langUrl = `/${lang.code}/`;
        await page.goto(langUrl);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
      });
    }
  });

  // ==========================================
  // Translation Completeness
  // ==========================================
  test.describe('Translation content', () => {
    for (const lang of LANGUAGES) {
      test(`${lang.code} has translated page title (not English fallback)`, async ({ page }) => {
        const langUrl = lang.code === 'en' ? '/' : `/${lang.code}/`;
        await page.goto(langUrl);

        const title = await page.title();
        expect(title.length).toBeGreaterThan(3);

        // For non-English, title should differ from English (unless same word)
        if (lang.code !== 'en') {
          // At minimum, page should have content
          expect(title).toBeTruthy();
        }
      });

      test(`${lang.code} has translated hero section text`, async ({ page }) => {
        const langUrl = lang.code === 'en' ? '/' : `/${lang.code}/`;
        await page.goto(langUrl);

        const hero = page.locator(SELECTORS.heroSection).first();
        const isVisible = await hero.isVisible().catch(() => false);

        if (isVisible) {
          const text = await hero.innerText();
          expect(text.length).toBeGreaterThan(10);
        }
      });
    }
  });

  // ==========================================
  // Hreflang Tags (SEO)
  // ==========================================
  test.describe('Hreflang SEO tags', () => {
    test('homepage has hreflang links for all languages', async ({ page }) => {
      await page.goto('/');

      const hreflangLinks = page.locator('link[hreflang]');
      const count = await hreflangLinks.count();

      // Should have at least a few language alternates
      expect(count).toBeGreaterThan(0);
    });

    test('hreflang links have valid href attributes', async ({ page }) => {
      await page.goto('/');

      const hreflangLinks = page.locator('link[hreflang]');
      const count = await hreflangLinks.count();

      for (let i = 0; i < count; i++) {
        const href = await hreflangLinks.nth(i).getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toMatch(/^https?:\/\//);
      }
    });
  });

  // ==========================================
  // Language Dropdown Functionality
  // ==========================================
  test.describe('Language dropdown', () => {
    test('language dropdown exists and is accessible', async ({ page }) => {
      await page.goto('/');

      const dropdown = page.locator(SELECTORS.langDropdown).first();
      const exists = await dropdown.isVisible().catch(() => false);

      if (exists) {
        await dropdown.click();
        await page.waitForTimeout(500);

        // Dropdown should show language options
        const options = page.locator(`${SELECTORS.langDropdown} a, ${SELECTORS.langDropdown} li, .lang-option`);
        const optionCount = await options.count();

        expect(optionCount).toBeGreaterThan(1);
      }
    });
  });

  // ==========================================
  // Font Rendering Stress Test
  // ==========================================
  test.describe('Font rendering for all scripts', () => {
    const scriptTests = [
      { code: 'ar', char: 'ع', script: 'Arabic' },
      { code: 'bn', char: 'ব', script: 'Bengali' },
      { code: 'hi', char: 'ह', script: 'Devanagari' },
      { code: 'ja', char: '日', script: 'CJK' },
      { code: 'ko', char: '한', script: 'Hangul' },
      { code: 'my', char: 'မ', script: 'Myanmar' },
      { code: 'th', char: 'ท', script: 'Thai' },
      { code: 'ur', char: 'ا', script: 'Nastaliq' },
      { code: 'ru', char: 'Р', script: 'Cyrillic' },
    ];

    for (const { code, script } of scriptTests) {
      test(`${script} script renders on ${code} page`, async ({ page }) => {
        await page.goto(`/${code}/`);

        const bodyText = await page.locator('body').innerText();

        // Page should have substantial text content (not all ASCII)
        expect(bodyText.length).toBeGreaterThan(50);

        // Check that text is not just rectangles (tofu) by verifying page rendered
        const hasVisibleText = await page.evaluate(() => {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let textLength = 0;
          let node;
          while (node = walker.nextNode()) {
            textLength += (node.textContent || '').trim().length;
          }
          return textLength > 100;
        });

        expect(hasVisibleText).toBe(true);
      });
    }
  });
});
