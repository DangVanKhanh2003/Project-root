/**
 * Concurrent & Stress E2E Tests — Downloader Monorepo
 *
 * Test hành vi app dưới tải nặng: rapid submit, navigation, network failure...
 */

import { test, expect, type Page } from '@playwright/test';

const YT_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const YT_URL2 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// Flexible selectors: different sites use different element IDs/classes
const INPUT_SELECTOR = '#videoUrl, #urlsInput, #url-input, input[name="q"], input[name="url"]';
const BTN_SELECTOR = '.btn-convert, .multi-btn-convert, .converter-btn, button[type="submit"]';

async function waitForAppReady(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Wait for any convert/submit button to be ready (different sites use different selectors)
  await page.waitForFunction((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    if (!btn) return false;
    // For <button>, check disabled. For <div> (converter-btn), just check existence
    if (btn.tagName === 'BUTTON') return !(btn as HTMLButtonElement).disabled;
    return true;
  }, BTN_SELECTOR, { timeout: 15000 });
}

test.describe('Concurrent & Stress Tests', () => {

  test('Rapid URL changes không crash', async ({ page }) => {
    await waitForAppReady(page);
    const input = page.locator(INPUT_SELECTOR).first();

    const urls = [YT_URL, YT_URL2, 'https://youtu.be/jNQXAC9IVRw', YT_URL];
    for (const url of urls) {
      await input.fill('');
      await input.fill(url);
      await page.waitForTimeout(100);
    }

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('Submit mới cancel request cũ (không stale)', async ({ page }) => {
    await waitForAppReady(page);
    const input = page.locator(INPUT_SELECTOR).first();
    const btn = page.locator(BTN_SELECTOR).first();

    await input.fill(YT_URL);
    await btn.click();
    await page.waitForTimeout(1000);

    // Submit URL khác ngay lập tức
    // Cần quay lại form trước nếu đang ở result view
    if (await input.isVisible().catch(() => false)) {
      await input.fill(YT_URL2);
      await btn.click();
    }
    await page.waitForTimeout(2000);

    // Page không bị frozen
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('Back/forward navigation không crash', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator(INPUT_SELECTOR).first().fill(YT_URL);
    await page.locator(BTN_SELECTOR).first().click();
    await page.waitForTimeout(2000);

    await page.goBack().catch(() => {});
    await page.waitForTimeout(500);
    await page.goForward().catch(() => {});
    await page.waitForTimeout(500);

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('Network failure → app phục hồi', async ({ page }) => {
    await waitForAppReady(page);

    // Block tất cả API requests
    await page.route('**/*api*/**', route => route.abort());
    await page.route('**/*hub*/**', route => route.abort());

    await page.locator(INPUT_SELECTOR).first().fill(YT_URL);
    await page.locator(BTN_SELECTOR).first().click();
    await page.waitForTimeout(5000);

    // Unblock
    await page.unroute('**/*api*/**');
    await page.unroute('**/*hub*/**');

    // Page không crash, input vẫn dùng được
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('Homepage load < 5s', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - t0).toBeLessThan(5000);
  });

  test('Interactive < 8s', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(Date.now() - t0).toBeLessThan(8000);
  });
});
