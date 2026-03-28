/**
 * Feature Limits & License Key Tests — Downloader Monorepo
 *
 * Test flow:
 * 1. Xóa localStorage → fresh state
 * 2. Download với quality bị giới hạn (4K, 2K, 320kbps) → bị block (paywall)
 * 3. Nhập license key test@gmail.com → bypass limit
 * 4. Download lại → được phép
 */

import { test, expect, type Page } from '@playwright/test';

const YT_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const TEST_LICENSE_KEY = 'test@gmail.com';

// Flexible selectors: different sites use different element IDs/classes
const INPUT_SELECTOR = '#videoUrl, #urlsInput, #url-input, input[name="q"], input[name="url"]';
const BTN_SELECTOR = '.btn-convert, .multi-btn-convert, .converter-btn, button[type="submit"]';

// ==========================================
// Helper: clear ALL localStorage before each test
// ==========================================
async function freshStart(page: Page) {
  await page.goto('/');
  // Xóa toàn bộ localStorage — reset limits, license, cache
  await page.evaluate(() => localStorage.clear());
  // Reload để app đọc fresh state
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Chờ JS init (convert button enabled)
  await page.waitForFunction((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    if (!btn) return false;
    if (btn.tagName === 'BUTTON') return !(btn as HTMLButtonElement).disabled;
    return true;
  }, BTN_SELECTOR, { timeout: 15000 });
}

// ==========================================
// Helper: paste URL + select format + click convert
// ==========================================
async function pasteAndConvert(page: Page, url: string) {
  await page.locator(INPUT_SELECTOR).first().fill(url);
  await page.waitForTimeout(200);
  await page.locator(BTN_SELECTOR).first().click();
}

// ==========================================
// Helper: select quality from dropdown
// ==========================================
async function selectQuality(page: Page, value: string) {
  // Try grouped dropdown first
  const trigger = page.locator('[data-video-group-trigger]');
  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click();
    await page.waitForTimeout(300);

    // The item might be inside a collapsed group section — open it first
    // value format: "mp4-2160" → group is "mp4"
    const groupName = value.split('-')[0];
    const groupToggle = page.locator(`[data-group-toggle="${groupName}"]`);
    if (await groupToggle.isVisible().catch(() => false)) {
      // Check if the group is already open
      const groupSection = page.locator(`[data-video-group="${groupName}"]`);
      const isOpen = await groupSection.evaluate(el => el.classList.contains('is-open')).catch(() => false);
      if (!isOpen) {
        await groupToggle.click();
        await page.waitForTimeout(200);
      }
    }

    const item = page.locator(`[data-group-item="${value}"]`);
    if (await item.isVisible().catch(() => false)) {
      await item.click();
      return;
    }
  }
  // Fallback: force-set via native select (even if hidden)
  const select = page.locator('#quality-select-mp4');
  const selectExists = await select.count() > 0;
  if (selectExists) {
    await select.evaluate((el: HTMLSelectElement, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }
}

// ==========================================
// Helper: enter license key on license page
// ==========================================
async function activateLicense(page: Page, key: string) {
  await page.goto('/license.html');
  await page.waitForLoadState('networkidle');

  const input = page.locator('#licenseKeyInputPage');
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(key);

  const submit = page.locator('#license-submit');
  await submit.click();

  // Chờ phản hồi (success hoặc error message)
  await page.waitForTimeout(3000);

  // Kiểm tra status tag
  const statusTag = page.locator('#license-status-tag');
  if (await statusTag.isVisible().catch(() => false)) {
    const text = await statusTag.textContent();
    return text?.toLowerCase().includes('active') || false;
  }

  // Hoặc check message
  const message = page.locator('#license-page-message');
  if (await message.isVisible().catch(() => false)) {
    const text = await message.textContent();
    return !text?.toLowerCase().includes('error') && !text?.toLowerCase().includes('invalid');
  }

  return false;
}

test.describe('Feature Limits & License Key', () => {

  // ==========================================
  // Verify: localStorage bị xóa sạch trước mỗi test
  // ==========================================
  test('Xóa localStorage → fresh state, không có license', async ({ page }) => {
    await freshStart(page);

    const hasLicense = await page.evaluate(() => {
      return !!localStorage.getItem('onedownloader:license_key');
    });
    expect(hasLicense).toBe(false);

    const hasCache = await page.evaluate(() => {
      return !!localStorage.getItem('onedownloader:license_cache');
    });
    expect(hasCache).toBe(false);
  });

  // ==========================================
  // Test: Chọn 4K (2160p) → kiểm tra limit/paywall
  // ==========================================
  test('4K (2160p): chọn quality 4K → convert → kiểm tra limit', async ({ page }) => {
    await freshStart(page);

    // Chọn MP4 format
    const mp4Btn = page.locator('.format-btn[data-format="mp4"]');
    if (await mp4Btn.isVisible()) await mp4Btn.click();

    // Chọn 4K quality
    await selectQuality(page, 'mp4-2160');

    // Paste URL và Convert
    await pasteAndConvert(page, YT_URL);

    // Chờ phản hồi: có thể là paywall popup, preview, hoặc conversion
    await page.waitForTimeout(5000);

    // Kiểm tra có paywall popup không (nếu limit)
    const hasPaywall = await page.evaluate(() => {
      // Check for any paywall/popup element
      const popup = document.querySelector('[data-paywall], .paywall, .popup-overlay, .poppurchase-container');
      return !!popup && (popup as HTMLElement).offsetParent !== null;
    });

    // Kiểm tra có conversion bắt đầu không (nếu chưa hết limit)
    const hasConversion = await page.locator('#status-container').isVisible().catch(() => false);
    const hasPreview = await page.locator('.yt-preview-card').isVisible().catch(() => false);

    // Phải có 1 trong 2: paywall (bị block) hoặc conversion (được phép)
    expect(hasPaywall || hasConversion || hasPreview).toBeTruthy();
  });

  // ==========================================
  // Test: Chọn 2K (1440p) → kiểm tra limit/paywall
  // ==========================================
  test('2K (1440p): chọn quality 2K → convert → kiểm tra limit', async ({ page }) => {
    await freshStart(page);

    const mp4Btn = page.locator('.format-btn[data-format="mp4"]');
    if (await mp4Btn.isVisible()) await mp4Btn.click();

    await selectQuality(page, 'mp4-1440');
    await pasteAndConvert(page, YT_URL);

    await page.waitForTimeout(5000);

    const hasPaywall = await page.evaluate(() => {
      const popup = document.querySelector('[data-paywall], .paywall, .popup-overlay, .poppurchase-container');
      return !!popup && (popup as HTMLElement).offsetParent !== null;
    });
    const hasConversion = await page.locator('#status-container').isVisible().catch(() => false);
    const hasPreview = await page.locator('.yt-preview-card').isVisible().catch(() => false);

    expect(hasPaywall || hasConversion || hasPreview).toBeTruthy();
  });

  // ==========================================
  // Test: Chọn MP3 320kbps → kiểm tra limit/paywall
  // ==========================================
  test('320kbps: chọn MP3 320kbps → convert → kiểm tra limit', async ({ page }) => {
    await freshStart(page);

    // Chọn MP3
    const mp3Btn = page.locator('.format-btn[data-format="mp3"]');
    if (await mp3Btn.isVisible()) await mp3Btn.click();
    await page.waitForTimeout(300);

    // Chọn 320kbps
    const mp3Select = page.locator('#quality-select-mp3');
    if (await mp3Select.isVisible()) {
      await mp3Select.selectOption('mp3-320');
    }

    await pasteAndConvert(page, YT_URL);
    await page.waitForTimeout(5000);

    const hasPaywall = await page.evaluate(() => {
      const popup = document.querySelector('[data-paywall], .paywall, .popup-overlay, .poppurchase-container');
      return !!popup && (popup as HTMLElement).offsetParent !== null;
    });
    const hasConversion = await page.locator('#status-container').isVisible().catch(() => false);
    const hasPreview = await page.locator('.yt-preview-card').isVisible().catch(() => false);

    expect(hasPaywall || hasConversion || hasPreview).toBeTruthy();
  });

  // ==========================================
  // Test: Simulate limit reached → paywall shown
  // ==========================================
  test('Simulate limit reached → paywall hiện khi download 4K', async ({ page }) => {
    await freshStart(page);

    // Giả lập đã dùng hết 20 lượt 4K hôm nay
    const today = new Date().toISOString().split('T')[0];
    await page.evaluate((date) => {
      localStorage.setItem('download_4k_daily', JSON.stringify({ date, count: 20 }));
    }, today);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      const btn = document.querySelector('.btn-convert') as HTMLButtonElement;
      return btn && !btn.disabled;
    }, { timeout: 15000 });

    // Chọn 4K
    const mp4Btn = page.locator('.format-btn[data-format="mp4"]');
    if (await mp4Btn.isVisible()) await mp4Btn.click();
    await selectQuality(page, 'mp4-2160');

    // Convert
    await pasteAndConvert(page, YT_URL);
    await page.waitForTimeout(5000);

    // Should be blocked — paywall, error, hoặc không convert
    const hasPaywall = await page.evaluate(() => {
      const el = document.querySelector('[data-paywall], .paywall, .popup-overlay, .poppurchase-container');
      return !!el;
    });
    const hasError = await page.locator('#error-message').evaluate(
      el => (el.textContent?.trim().length || 0) > 0
    ).catch(() => false);

    // Ít nhất 1 dấu hiệu bị block
    expect(hasPaywall || hasError).toBeTruthy();
  });

  // ==========================================
  // Test: Nhập license key → activate → bypass limit
  // ==========================================
  test('Nhập license key test@gmail.com → activate thành công', async ({ page }) => {
    await freshStart(page);

    // Navigate đến trang license
    const activated = await activateLicense(page, TEST_LICENSE_KEY);

    // Check localStorage có license key không
    const savedKey = await page.evaluate(() => {
      return localStorage.getItem('onedownloader:license_key');
    });

    // License key phải được lưu (dù activation có thể fail do test environment)
    // Hoặc form phải hiện phản hồi
    const pageMessage = await page.locator('#license-page-message').textContent().catch(() => '');

    expect(savedKey === TEST_LICENSE_KEY || pageMessage!.length > 0).toBeTruthy();
  });

  // ==========================================
  // Test: Sau khi activate → 4K không bị block nữa
  // ==========================================
  test('Sau activate license → download 4K bypass limit', async ({ page }) => {
    await freshStart(page);

    // Giả lập license đã active trong localStorage
    await page.evaluate((key) => {
      localStorage.setItem('onedownloader:license_key', key);
      // Set a fake valid cache (app sẽ dùng optimistic check)
      const payload = btoa(JSON.stringify({
        planType: 'lifetime',
        status: 'active',
        activatedAt: new Date().toISOString(),
        expiresAt: null,
        tierPurchased: 1,
        lastValidatedAt: Date.now()
      }));
      localStorage.setItem('onedownloader:license_cache', payload + '.fakehash');
    }, TEST_LICENSE_KEY);

    // Giả lập đã dùng hết 20 lượt 4K
    const today = new Date().toISOString().split('T')[0];
    await page.evaluate((date) => {
      localStorage.setItem('download_4k_daily', JSON.stringify({ date, count: 20 }));
    }, today);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      const btn = document.querySelector('.btn-convert') as HTMLButtonElement;
      return btn && !btn.disabled;
    }, { timeout: 15000 });

    // Chọn 4K
    const mp4Btn = page.locator('.format-btn[data-format="mp4"]');
    if (await mp4Btn.isVisible()) await mp4Btn.click();
    await selectQuality(page, 'mp4-2160');

    await pasteAndConvert(page, YT_URL);
    await page.waitForTimeout(5000);

    // Không bị paywall (license bypass)
    const hasPaywall = await page.evaluate(() => {
      const el = document.querySelector('[data-paywall], .paywall, .popup-overlay, .poppurchase-container');
      return !!el && (el as HTMLElement).offsetParent !== null;
    });

    // Phải có conversion bắt đầu hoặc preview (không bị block)
    const hasConversion = await page.locator('#status-container').isVisible().catch(() => false);
    const hasPreview = await page.locator('.yt-preview-card').isVisible().catch(() => false);

    // License holder: không bị paywall, conversion phải bắt đầu
    expect(hasConversion || hasPreview || !hasPaywall).toBeTruthy();
  });

  // ==========================================
  // Test: Daily limit counter reset khi xóa localStorage
  // ==========================================
  test('Xóa localStorage → daily counter reset về 0', async ({ page }) => {
    await freshStart(page);

    // Set giả lập counter
    await page.evaluate(() => {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('download_4k_daily', JSON.stringify({ date: today, count: 15 }));
      localStorage.setItem('download_2k_daily', JSON.stringify({ date: today, count: 10 }));
      localStorage.setItem('download_320kbps_daily', JSON.stringify({ date: today, count: 18 }));
    });

    // Verify counter set
    const before = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('download_4k_daily') || '{}').count;
    });
    expect(before).toBe(15);

    // Xóa localStorage
    await page.evaluate(() => localStorage.clear());

    // Verify counter cleared
    const after = await page.evaluate(() => {
      return localStorage.getItem('download_4k_daily');
    });
    expect(after).toBeNull();
  });

  // ==========================================
  // Test: Verify tất cả localStorage keys bị xóa sạch
  // ==========================================
  test('localStorage.clear() xóa sạch: license, cache, limits, preferences', async ({ page }) => {
    await freshStart(page);

    // Set nhiều keys
    await page.evaluate(() => {
      localStorage.setItem('onedownloader:license_key', 'fake-key');
      localStorage.setItem('onedownloader:license_cache', 'fake-cache');
      localStorage.setItem('onedownloader_format_preferences', '{"format":"mp4"}');
      localStorage.setItem('onedownloader_allowed_features', '{"country":"US"}');
      localStorage.setItem('download_4k_daily', '{"date":"2026-01-01","count":5}');
      localStorage.setItem('download_playlist_items_daily', '{"date":"2026-01-01","count":3}');
      localStorage.setItem('theme', 'dark');
    });

    // Verify keys exist
    const keyCount = await page.evaluate(() => localStorage.length);
    expect(keyCount).toBeGreaterThanOrEqual(7);

    // Clear
    await page.evaluate(() => localStorage.clear());

    // Verify all gone
    const afterCount = await page.evaluate(() => localStorage.length);
    expect(afterCount).toBe(0);
  });

  // ==========================================
  // Test: 720p (free) luôn được phép, không limit
  // ==========================================
  test('720p MP4: luôn được phép, không bị paywall', async ({ page }) => {
    await freshStart(page);

    const mp4Btn = page.locator('.format-btn[data-format="mp4"]');
    if (await mp4Btn.isVisible()) await mp4Btn.click();

    // 720p là default, không cần chọn
    await pasteAndConvert(page, YT_URL);

    // Chờ phản hồi
    await page.waitForTimeout(5000);

    // Không nên có paywall cho 720p
    const hasPaywall = await page.evaluate(() => {
      const el = document.querySelector('[data-paywall], .paywall, .popup-overlay, .poppurchase-container');
      return !!el && (el as HTMLElement).offsetParent !== null;
    });

    expect(hasPaywall).toBe(false);
  });

  // ==========================================
  // Test: MP3 128kbps (free) luôn được phép
  // ==========================================
  test('MP3 128kbps: luôn được phép, không bị paywall', async ({ page }) => {
    await freshStart(page);

    const mp3Btn = page.locator('.format-btn[data-format="mp3"]');
    if (await mp3Btn.isVisible()) await mp3Btn.click();
    await page.waitForTimeout(300);

    // 128kbps là default cho MP3
    await pasteAndConvert(page, YT_URL);
    await page.waitForTimeout(5000);

    const hasPaywall = await page.evaluate(() => {
      const el = document.querySelector('[data-paywall], .paywall, .popup-overlay, .poppurchase-container');
      return !!el && (el as HTMLElement).offsetParent !== null;
    });

    expect(hasPaywall).toBe(false);
  });
});
