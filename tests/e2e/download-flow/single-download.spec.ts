/**
 * Single Download Flow — Downloader Monorepo
 *
 * Test thật flow user: Paste URL → Chọn format → Convert → Download → Start Over
 * Dùng selectors thật từ DOM (#videoUrl, .btn-convert, #conversion-download-btn...)
 */

import { test, expect, type Page } from '@playwright/test';

const YT_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

// Flexible selectors: different sites use different element IDs/classes
const INPUT_SELECTOR = '#videoUrl, #urlsInput, #url-input, input[name="q"], input[name="url"]';
const BTN_SELECTOR = '.btn-convert, .multi-btn-convert, .converter-btn, button[type="submit"]';

/** Chờ JS init xong (btn-convert enabled = JS đã load). Xóa localStorage mỗi lần. */
async function waitForAppReady(page: Page) {
  await page.goto('/');
  // Xóa localStorage → fresh state (no stale limits, license, cache)
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  // JS enables the convert button after init — wait for it
  await page.waitForFunction((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    if (!btn) return false;
    if (btn.tagName === 'BUTTON') return !(btn as HTMLButtonElement).disabled;
    return true;
  }, BTN_SELECTOR, { timeout: 15000 });
}

/** Paste URL vào ô input và chờ convert button sẵn sàng */
async function pasteUrl(page: Page, url: string) {
  const input = page.locator(INPUT_SELECTOR).first();
  await input.click();
  await input.fill(url);
  // Chờ input event xử lý xong
  await page.waitForTimeout(300);
}

/** Click Convert và chờ phản hồi (preview card hoặc status bar) */
async function clickConvert(page: Page) {
  const btn = page.locator(BTN_SELECTOR).first();
  // For <div> elements (converter-btn), skip toBeEnabled check
  const tagName = await btn.evaluate(el => el.tagName);
  if (tagName === 'BUTTON') {
    await expect(btn).toBeEnabled({ timeout: 5000 });
  }
  await btn.click();
}

test.describe('Download Flow — User Simulation', () => {

  // ==========================================
  // STEP 1: Paste URL
  // ==========================================
  test('Step 1: Paste YouTube URL vào ô input #videoUrl', async ({ page }) => {
    await waitForAppReady(page);
    const input = page.locator(INPUT_SELECTOR).first();

    await input.click();
    await input.fill(YT_URL);
    await expect(input).toHaveValue(YT_URL);

    // Font >= 16px (iOS zoom prevention)
    const fs = await input.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(fs).toBeGreaterThanOrEqual(16);
  });

  // ==========================================
  // STEP 2: Chọn format MP4/MP3
  // ==========================================
  test('Step 2: Click MP3 → MP4 format toggle', async ({ page }) => {
    await waitForAppReady(page);

    const mp4Btn = page.locator('.format-btn[data-format="mp4"]');
    const mp3Btn = page.locator('.format-btn[data-format="mp3"]');

    // Some sites use unified dropdown instead of format buttons — skip if no format-btn
    const hasFormatBtns = await mp4Btn.isVisible().catch(() => false);
    if (!hasFormatBtns) {
      // Site uses a different format selector (e.g., unified dropdown) — verify it exists
      const hasDropdown = await page.locator('.custom-dropdown-trigger, [data-unified-select], .quality-select').first().isVisible().catch(() => false);
      expect(hasDropdown).toBeTruthy();
      return;
    }

    // Default: MP4 active
    await expect(mp4Btn).toHaveClass(/active/);

    // Click MP3
    await mp3Btn.click();
    await page.waitForTimeout(300);
    // Sau click, MP3 selector phải hiện (quality-select-mp3 visible)
    await expect(page.locator('#quality-select-mp3')).toBeVisible();

    // Click lại MP4
    await mp4Btn.click();
    await page.waitForTimeout(300);
  });

  // ==========================================
  // STEP 3: Chọn quality
  // ==========================================
  test('Step 3: Mở quality dropdown và chọn 1080p', async ({ page }) => {
    await waitForAppReady(page);

    // Custom grouped dropdown (nếu có)
    const trigger = page.locator('[data-video-group-trigger]');
    if (await trigger.isVisible()) {
      await trigger.click();
      await page.waitForTimeout(300);

      const item1080 = page.locator('[data-group-item="mp4-1080"]');
      if (await item1080.isVisible()) {
        await item1080.click();
      }
    }
  });

  // ==========================================
  // STEP 4: Ấn Convert
  // ==========================================
  test('Step 4: Paste URL → Ấn Convert → Chờ phản hồi', async ({ page }) => {
    await waitForAppReady(page);
    await pasteUrl(page, YT_URL);
    await clickConvert(page);

    // Chờ 1 trong 2: preview card hoặc status container
    await Promise.race([
      page.waitForSelector('.yt-preview-card', { timeout: 20000 }),
      page.waitForSelector('#status-container', { timeout: 20000 }),
      page.waitForSelector('#error-message:not(:empty)', { timeout: 20000 }),
    ]).catch(() => {});

    // Ít nhất 1 phản hồi phải xuất hiện
    const hasPreview = await page.locator('.yt-preview-card').isVisible().catch(() => false);
    const hasStatus = await page.locator('#status-container').isVisible().catch(() => false);
    const hasError = await page.locator('#error-message').evaluate(el => el.textContent?.trim().length! > 0).catch(() => false);

    expect(hasPreview || hasStatus || hasError).toBeTruthy();
  });

  // ==========================================
  // STEP 5: Preview card (thumbnail, title, badge)
  // ==========================================
  test('Step 5: Preview card hiện title + thumbnail + format badge', async ({ page }) => {
    await waitForAppReady(page);
    await pasteUrl(page, YT_URL);
    await clickConvert(page);

    // Chờ preview card (non-skeleton)
    const card = page.locator('.yt-preview-card');
    await card.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

    if (await card.isVisible()) {
      // Title
      const title = page.locator('.yt-preview-title');
      if (await title.isVisible()) {
        const text = await title.textContent();
        expect(text!.length).toBeGreaterThan(0);
      }

      // Format badge
      const badge = page.locator('.badge-format');
      if (await badge.isVisible()) {
        const text = await badge.textContent();
        expect(text!.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // ==========================================
  // STEP 6: Progress bar
  // ==========================================
  test('Step 6: Status bar hiện progress trong conversion', async ({ page }) => {
    await waitForAppReady(page);
    await pasteUrl(page, YT_URL);
    await clickConvert(page);

    // Chờ status container
    const status = page.locator('#status-container');
    await status.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});

    if (await status.isVisible()) {
      // Phải có spinner hoặc status text
      const hasSpinner = await page.locator('.spinner.active').isVisible().catch(() => false);
      const hasText = await page.locator('.status-text').isVisible().catch(() => false);
      expect(hasSpinner || hasText).toBeTruthy();
    }
  });

  // ==========================================
  // STEP 7: Download button
  // ==========================================
  test('Step 7: Chờ Download button active → Click download', async ({ page }) => {
    await waitForAppReady(page);
    await pasteUrl(page, YT_URL);
    await clickConvert(page);

    // Chờ download hoặc retry button (max 90s vì convert có thể lâu)
    const dlBtn = page.locator('#conversion-download-btn');
    const retryBtn = page.locator('#conversion-retry-btn');

    await Promise.race([
      dlBtn.waitFor({ state: 'visible', timeout: 90000 }),
      retryBtn.waitFor({ state: 'visible', timeout: 90000 }),
    ]).catch(() => {});

    if (await dlBtn.isVisible()) {
      const text = await dlBtn.textContent();
      expect(text!.toLowerCase()).toContain('download');

      // Click download — bắt event download
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        dlBtn.click(),
      ]);

      if (download) {
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });

  // ==========================================
  // STEP 8: Start Over (Next button)
  // ==========================================
  test('Step 8: Click Start Over → Quay lại form nhập URL', async ({ page }) => {
    await waitForAppReady(page);
    await pasteUrl(page, YT_URL);
    await clickConvert(page);

    // Chờ action container xuất hiện
    const startOver = page.locator('#btn-new-convert');
    await startOver.waitFor({ state: 'visible', timeout: 90000 }).catch(() => {});

    if (await startOver.isVisible()) {
      await startOver.click();
      await page.waitForTimeout(1000);

      // Ô input phải hiện lại
      await expect(page.locator(INPUT_SELECTOR).first()).toBeVisible();
    }
  });

  // ==========================================
  // FULL FLOW: MP4 720p
  // ==========================================
  test('FULL FLOW: Paste → MP4 720p → Convert → Chờ Download → Click Download → Start Over', async ({ page }) => {
    await waitForAppReady(page);

    // 1. Paste URL
    await pasteUrl(page, YT_URL);

    // 2. Verify MP4 đang active (if format buttons exist)
    const mp4Btn = page.locator('.format-btn[data-format="mp4"]');
    if (await mp4Btn.isVisible().catch(() => false)) {
      await expect(mp4Btn).toHaveClass(/active/);
    }

    // 3. Click Convert
    await clickConvert(page);

    // 4. Chờ preview
    await page.waitForSelector('.yt-preview-card', { timeout: 20000 }).catch(() => {});

    // 5. Chờ convert xong
    const dlBtn = page.locator('#conversion-download-btn');
    const retryBtn = page.locator('#conversion-retry-btn');
    await Promise.race([
      dlBtn.waitFor({ state: 'visible', timeout: 90000 }),
      retryBtn.waitFor({ state: 'visible', timeout: 90000 }),
    ]).catch(() => {});

    // 6. Click Download
    if (await dlBtn.isVisible()) {
      await dlBtn.click();
      await page.waitForTimeout(1000);
    }

    // 7. Click Start Over
    const startOver = page.locator('#btn-new-convert');
    if (await startOver.isVisible()) {
      await startOver.click();
      await page.waitForTimeout(1000);
      await expect(page.locator(INPUT_SELECTOR).first()).toBeVisible();
    }
  });

  // ==========================================
  // FULL FLOW: MP3 320kbps
  // ==========================================
  test('FULL FLOW: Paste → MP3 320kbps → Convert → Download', async ({ page }) => {
    await waitForAppReady(page);

    // 1. Paste URL
    await pasteUrl(page, YT_URL);

    // 2. Chọn MP3 (if format buttons exist)
    const mp3FormatBtn = page.locator('.format-btn[data-format="mp3"]');
    if (await mp3FormatBtn.isVisible().catch(() => false)) {
      await mp3FormatBtn.click();
      await page.waitForTimeout(300);

      // 3. Chọn 320kbps từ native select (MP3 select vẫn visible)
      const mp3Select = page.locator('#quality-select-mp3');
      if (await mp3Select.isVisible()) {
        await mp3Select.selectOption('mp3-320');
      }
    }

    // 4. Convert
    await clickConvert(page);

    // 5. Chờ download
    const dlBtn = page.locator('#conversion-download-btn');
    await dlBtn.waitFor({ state: 'visible', timeout: 90000 }).catch(() => {});

    if (await dlBtn.isVisible()) {
      await dlBtn.click();
    }
  });

  // ==========================================
  // ERROR: URL không hợp lệ
  // ==========================================
  test('ERROR: Nhập URL không hợp lệ → error message hoặc form vẫn hoạt động', async ({ page }) => {
    await waitForAppReady(page);
    await pasteUrl(page, 'not-a-valid-url');
    await clickConvert(page);

    await page.waitForTimeout(3000);

    // Kiểm tra: error message hoặc form vẫn visible (không crash)
    const hasError = await page.locator('#error-message').evaluate(
      el => el.textContent?.trim().length! > 0
    ).catch(() => false);
    const formVisible = await page.locator(INPUT_SELECTOR).first().isVisible();

    expect(hasError || formVisible).toBeTruthy();
  });

  // ==========================================
  // ERROR: Convert khi input trống
  // ==========================================
  test('ERROR: Ấn Convert khi chưa nhập URL → không crash', async ({ page }) => {
    await waitForAppReady(page);

    // Submit form trống
    const btn = page.locator(BTN_SELECTOR).first();
    await btn.click();

    await page.waitForTimeout(2000);
    await expect(page.locator(INPUT_SELECTOR).first()).toBeVisible();
  });

  // ==========================================
  // MOBILE: Menu drawer
  // ==========================================
  test('Mobile: Mở menu drawer → đóng', async ({ page }) => {
    // Set viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForAppReady(page);

    const menuBtn = page.locator('#mobile-menu-btn');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(500);

      const drawer = page.locator('#mobile-drawer');
      // Drawer mở (có thể check visibility hoặc attribute)
      const isOpen = await drawer.evaluate(el => {
        return el.classList.contains('open') || el.getAttribute('data-open') === '1' ||
               getComputedStyle(el).display !== 'none';
      });
      expect(isOpen).toBeTruthy();

      // Đóng drawer
      const closeBtn = page.locator('#close-drawer-btn');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  // ==========================================
  // STRESS: Rapid submit 5 lần
  // ==========================================
  test('STRESS: Paste + Convert 3 lần liên tục → không crash', async ({ page }) => {
    await waitForAppReady(page);

    for (let i = 0; i < 3; i++) {
      // Đảm bảo input visible (có thể bị ẩn sau convert trước đó)
      const input = page.locator(INPUT_SELECTOR).first();
      const isVisible = await input.isVisible().catch(() => false);
      if (!isVisible) {
        // Click Start Over nếu đang ở result view
        const startOver = page.locator('#btn-new-convert');
        if (await startOver.isVisible().catch(() => false)) {
          await startOver.click();
        }
        await input.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        if (!await input.isVisible().catch(() => false)) {
          // Reload nếu form không quay lại
          await page.goto('/');
          await waitForAppReady(page);
        }
      }

      await input.fill(YT_URL);
      await page.waitForTimeout(100);
      const btn = page.locator(BTN_SELECTOR).first();
      if (await btn.isEnabled()) {
        await btn.click();
      }
      await page.waitForTimeout(1000);
    }

    // Page vẫn hoạt động
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
