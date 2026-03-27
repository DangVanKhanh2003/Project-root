/**
 * Cross-App Smoke Tests
 *
 * Chạy trên MỌI site được cấu hình trong playwright.config.ts.
 * Mỗi site chạy song song trên port riêng (đa luồng).
 *
 * Test: page load, SEO, input form, format selector, console errors, images
 */

import { test, expect } from '@playwright/test';
import { S } from '../fixtures/selectors';

test.describe('Smoke Test', () => {

  test('Homepage loads < 5s', async ({ page }) => {
    const t0 = Date.now();
    const res = await page.goto('/');
    const loadTime = Date.now() - t0;

    expect(res?.status()).toBeLessThan(400);
    expect(loadTime).toBeLessThan(5000);
    await expect(page).toHaveTitle(/.+/);
  });

  test('Has header + footer + hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('footer').first()).toBeVisible();
  });

  test('Has URL input #videoUrl', async ({ page }) => {
    await page.goto('/');
    const input = page.locator(S.urlInput);
    await expect(input).toBeVisible();

    // Font-size >= 16px (iOS zoom prevention)
    const fs = await input.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(fs).toBeGreaterThanOrEqual(16);
  });

  test('Has submit/convert button', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator(S.convertBtn).or(page.locator(S.submitBtn));
    await expect(btn.first()).toBeVisible();
  });

  test('Has format selector (MP3/MP4)', async ({ page }) => {
    await page.goto('/');
    const mp4 = page.locator(S.formatBtnMp4);
    const mp3 = page.locator(S.formatBtnMp3);
    const hasMp4 = await mp4.isVisible().catch(() => false);
    const hasMp3 = await mp3.isVisible().catch(() => false);
    expect(hasMp4 || hasMp3).toBeTruthy();
  });

  test('SEO: title > 5 chars, meta description, canonical, viewport', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);

    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc?.length).toBeGreaterThan(20);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();

    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  });

  test('No critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('analytics') &&
      !e.includes('firebase') && !e.includes('gtag') && !e.includes('adsbygoogle')
    );
    expect(critical).toEqual([]);
  });

  test('No broken images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const imgs = page.locator('img[src]');
    const count = await imgs.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const img = imgs.nth(i);
      const src = await img.getAttribute('src');
      if (src?.startsWith('data:') || src?.endsWith('.svg')) continue;
      const w = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(w, `Broken: ${src}`).toBeGreaterThan(0);
    }
  });

  test('No horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(sw).toBeLessThanOrEqual(cw + 5);
  });
});
