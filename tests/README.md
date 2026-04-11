# Test Suite — Downloader Monorepo (downloader-monorepo)

**Project:** downloader-monorepo — Ứng dụng tải video/audio từ YouTube, Facebook, TikTok, Instagram, X.

**19 sites:** onedownloader.net, ssvid.cc, yt1s.guru, ytmp4.gg, ytsss.com, convert1s.com, tube1s.com, snap1s.com, snakeloader.com, u2snap.com, y2save.com, sstube.net, ytconvert.org, ytmp3.my, y2matepro, y2matevc, mp3fast, ezconv, 4kvideopro

**Packages:** @downloader/core, @downloader/ui-components, @downloader/ui-shared, @downloader/i18n, @downloader/vidtool-popup

Bao gồm: Unit Tests (404), Stress Tests (300), E2E Browser Automation, và Test Dashboard.

---

## Quick Start

> **QUAN TRỌNG:** Tất cả commands chạy từ thư mục **root** (`Project-root`), KHÔNG phải `packages/core`.

```bash
cd f:/downloader/Project-root
```

### Chạy Unit + Stress Tests (Vitest, 704 tests)
```bash
npm test                     # Tất cả unit + stress (704 tests, ~3s)
npm run test:unit            # Chỉ unit (không stress)
npm run test:stress          # Chỉ stress tests
npm run test:watch           # Watch mode (auto re-run khi file thay đổi)
npm run test:coverage        # Coverage report (HTML + LCOV)
```

### Chạy E2E Tests (Playwright, mở browser thật)
```bash
npm run test:e2e             # Build site → mở Chrome → click thật (headed, slowMo 400ms)
npm run test:e2e:smoke       # Build → smoke test (page load, SEO, UI)
npm run test:e2e:download    # Build → test flow Paste URL → Convert → Download → Start Over
npm run test:e2e:i18n        # Build → test 19 ngôn ngữ + RTL
npm run test:e2e:all-sites   # Build ALL 19 sites → test song song
npm run test:e2e:headless    # Build → chạy nền (nhanh hơn, dùng cho CI)
npm run test:e2e:debug       # Build → debug step-by-step
npm run test:e2e:ui          # Playwright interactive UI
npm run test:e2e:report      # Xem HTML report sau khi test xong
```

### Chạy Full Pipeline (Unit + Stress + Build + E2E)
```bash
npm run test:full            # Unit+Stress → Build 1 site → E2E
npm run test:full:all        # Unit+Stress → Build ALL sites → E2E all sites
```

### Test Dashboard (UI trực quan)
```bash
npm run test:dashboard
```
Auto-mở browser tại `http://localhost:3333` (nếu port bận → tự nhảy 3334, 3335...).

**Dashboard features:**
- Ring chart % pass rate (xanh/đỏ)
- Mini stat cards (files, duration, unit/stress/e2e count)
- Bấm nút chạy test trực tiếp từ browser (Unit, Stress, E2E, Full)
- E2E mở Chrome thật — nhìn thấy Playwright click, gõ URL, scroll
- Live log stream qua WebSocket
- Phần **Conclusion** tổng kết sau mỗi lần chạy: bảng per-file (PASS/FAIL, mô tả nội dung, duration)
- Nút **Stop All** kill toàn bộ process tree (browser, vitest workers, child processes)
- Filter + Tabs (Unit / Stress / E2E / Failed Only)

---

## Cấu trúc

```
tests/
├── e2e/                                    # Playwright E2E tests
│   ├── fixtures/
│   │   ├── selectors.ts                    # Real DOM selectors (#videoUrl, .btn-convert, ...)
│   │   └── test-data.ts                    # URLs, languages, formats, invalid URLs
│   ├── smoke/
│   │   └── cross-app-smoke.spec.ts         # Smoke test tất cả sites
│   ├── download-flow/
│   │   ├── single-download.spec.ts         # Full flow: Paste → Convert → Download → Start Over
│   │   └── concurrent-downloads.spec.ts    # Stress: rapid submit, network failure, navigation
│   └── i18n/
│       └── language-switching.spec.ts      # 19 languages, RTL, hreflang, font rendering
│
├── dashboard/
│   ├── index.html                          # Dashboard UI (ring chart, stats, conclusion)
│   └── server.mjs                          # Node.js server (WebSocket, process management)
│
├── test-results/                           # Auto-generated (gitignored)
│   ├── html-report/                        # Playwright HTML report
│   ├── results.json                        # Playwright JSON results
│   └── artifacts/                          # Screenshots, videos
│
├── TEST-LOGIC.md                           # Mô tả chi tiết logic từng bài test
└── README.md                               # File này

packages/core/tests/                        # Vitest unit + stress tests
├── conversion/                             # Conversion engine (strategies, progress, types)
│   ├── strategies/                         # PollingStrategy, BaseStrategy, iOS, Direct, Stream
│   ├── progress/                           # PollingProgressMapper (video/audio weighted)
│   ├── state-interface/                    # IStateUpdater contract
│   └── types/                              # Type validation, routing logic
├── http/
│   ├── http-client.test.ts                 # HttpClient (GET/POST, headers, timeout, cancel)
│   ├── http-client.stress.test.ts          # 16 status codes, concurrent, error parsing
│   ├── http-error.test.ts                  # ApiError, NetworkError, TimeoutError, CancellationError
│   ├── retry-helper.test.ts               # retryWithBackoff, isTimeoutError, isRetryableError
│   ├── download-queue.test.ts              # Queue concurrency, FIFO, cancel, duplicate skip
│   ├── download-queue.stress.test.ts       # Playlist 30 items, channel pagination, cancel mid-flight
│   ├── polling.test.ts                     # Polling loop: pending→complete, error, timeout
│   └── polling.stress.test.ts              # 50 polls, alternating errors, 20 timeouts
├── mappers/v3/
│   ├── download.mapper.test.ts             # Quality/bitrate/format mapping, OS detection
│   ├── download.mapper.stress.test.ts      # 200+ combinations, 15 UAs, 1000 rapid perf
│   ├── download.mapper.limits.test.ts      # 4K/2K/320kbps premium limits, trim, fallback
│   └── error.mapper.test.ts               # Error code classification
├── services/v3/
│   ├── download.service.test.ts            # V3 createJob, getStatusByUrl, validation
│   └── playlist.service.test.ts            # Playlist extraction, pagination, daily limits
└── utils/
    ├── link-validator.test.ts              # Link expiration, TTL 25 min
    └── link-validator.stress.test.ts       # Performance, boundary values
```

---

## Test Categories

### 1. Unit Tests (Vitest) — 404 tests

| Module | Files | Tests | Nội dung |
|--------|-------|-------|----------|
| Conversion Strategies | 5 | ~100 | Polling, direct, iOS RAM, stream download strategies |
| Progress & Types | 2 | ~70 | Progress calculation (60% video + 40% audio), routing logic |
| HTTP Client | 2 | ~35 | GET/POST, headers, error parsing, timeout, cancellation |
| Retry & Queue & Polling | 3 | ~54 | Retry backoff, FIFO queue max 5, polling loop |
| Mappers | 2 | ~63 | Quality/bitrate/format mapping, OS detection |
| Services | 1 | ~14 | V3 createJob, getStatusByUrl |
| Utils | 2 | ~57 | Link expiration, TTL, remaining time |

### 2. Stress Tests (Vitest) — 300 tests

| File | Tests | Nội dung |
|------|-------|----------|
| download.mapper.stress.test.ts | ~200 | Tất cả quality×container×bitrate, 15 URL variations, 15 user agents, 1000 rapid mappings |
| download.mapper.limits.test.ts | 24 | 4K/2K/320kbps premium tiers, trim/cut, fallback quality, combined premium |
| http-client.stress.test.ts | ~50 | 16 HTTP status codes, 10 concurrent, error formats, cancellation stress |
| polling.stress.test.ts | ~15 | 50 polls, alternating error-success, 20 timeouts, boundary errors |
| download-queue.stress.test.ts | 9 | Playlist 30 items, channel 50 items pagination, cancel mid-flight |
| playlist.service.test.ts | 18 | Playlist extraction, pagination, daily limit tracker (4K/320k/cut) |

### 3. E2E Tests (Playwright) — Browser Automation

| Suite | Tests | Nội dung |
|-------|-------|----------|
| **single-download.spec.ts** | 14 | **Paste URL** (#videoUrl) → **Chọn MP4/MP3** (.format-btn) → **Chọn quality** (dropdown) → **Ấn Convert** (.btn-convert) → **Xem preview** (.yt-preview-card) → **Progress bar** (#status-container) → **Click Download** (#conversion-download-btn) → **Start Over** (#btn-new-convert). Full flow MP4 720p + MP3 320kbps. Error handling. Mobile menu. Stress 3x rapid submit. |
| **concurrent-downloads.spec.ts** | 6 | Rapid URL changes, submit cancel previous, back/forward navigation, network failure recovery, page load < 5s |
| **cross-app-smoke.spec.ts** | 9 | Homepage load, header/footer, #videoUrl visible font≥16px, .btn-convert, format selector, SEO tags, no console errors, no broken images, no horizontal scroll mobile |
| **language-switching.spec.ts** | ~80 | 19 language pages load, RTL (Arabic/Urdu) dir + layout, translated title + hero, hreflang SEO, font rendering 9 scripts |

### 4. Test Dashboard

| Feature | Mô tả |
|---------|-------|
| Ring Chart | Biểu đồ tròn % pass rate |
| Mini Stats | Test files, duration, unit/stress/e2e count với bar charts |
| Run Buttons | Unit+Stress, Stress Only, E2E (opens Chrome), Full Pipeline |
| E2E Sub-buttons | 1 Site, ALL Sites Parallel, Smoke, Download Flow, i18n |
| Stop All | Kill toàn bộ process tree (browsers, vitest workers, child processes) |
| Live Log | Stream output realtime qua WebSocket |
| Conclusion | Bảng tổng kết per-file: PASS/FAIL, tests count, duration, mô tả nội dung |
| Filter + Tabs | Lọc theo tên, tab Unit/Stress/E2E/Failed |
| Port Retry | Nếu port 3333 bận → tự nhảy 3334, 3335... |

---

## E2E: Flow thực tế

E2E tests tự động **build site trước**, rồi **mở Chrome thật** và thao tác:

```
1. Build:    npm run build (trong apps/onedownloader.net/)
2. Preview:  vite preview --port 4005 (serve file đã build)
3. Browser:  Playwright mở Chrome, navigate đến localhost:4005
4. Actions:  Click #videoUrl → fill URL → click .btn-convert → chờ progress → click Download
```

### Selectors thật (từ source code, dùng chung 19 sites):

| Element | Selector | Ghi chú |
|---------|----------|---------|
| Ô input URL | `#videoUrl` | Font ≥ 16px (iOS zoom prevention) |
| Nút Paste/Clear | `#input-action-button` | Toggle paste/clear |
| Nút Convert | `.btn-convert` | Disabled mặc định, JS enable sau init |
| Format MP4 | `.format-btn[data-format="mp4"]` | Class `active` khi được chọn |
| Format MP3 | `.format-btn[data-format="mp3"]` | |
| Quality MP4 | `#quality-select-mp4` | Native select (có thể hidden, dùng custom dropdown) |
| Quality MP3 | `#quality-select-mp3` | Visible khi MP3 active |
| Quality dropdown | `[data-video-group-trigger]` | Custom grouped dropdown |
| Quality item | `[data-group-item="mp4-720"]` | Class `is-selected` |
| Preview card | `.yt-preview-card` | `.skeleton` khi loading |
| Video title | `.yt-preview-title` | |
| Format badge | `.badge-format` | MP4/MP3 |
| Status bar | `#status-container` | Progress bar + spinner |
| Status text | `.status-text` | "Processing... 45%" |
| Download button | `#conversion-download-btn` | Visible khi convert xong |
| Retry button | `#conversion-retry-btn` | Visible khi convert fail |
| Start Over | `#btn-new-convert` | Quay lại form nhập URL |
| Mobile menu | `#mobile-menu-btn` | Mở drawer |
| Mobile drawer | `#mobile-drawer` | Navigation drawer |
| Error message | `#error-message` | Hiện khi URL invalid |

---

## Multi-Site Parallel Testing

```bash
npm run test:e2e:all-sites   # Build + test ALL 19 sites song song
```

Mỗi site chạy trên port riêng, Playwright tạo 2 projects per site (desktop + mobile):

| Site | Port | Desktop | Mobile |
|------|------|---------|--------|
| 4kvideopro | 4001 | ✓ | ✓ |
| convert1s.com | 4002 | ✓ | ✓ |
| ezconv | 4003 | ✓ | ✓ |
| onedownloader.net | 4005 | ✓ | ✓ |
| ssvid.cc | 4009 | ✓ | ✓ |
| yt1s.guru | 4015 | ✓ | ✓ |
| ytmp4.gg | 4018 | ✓ | ✓ |
| ... | ... | ✓ | ✓ |

Config: `fullyParallel: true`, `workers: 4` (4 browser instances song song).

---

## Performance

- **Unit + Stress (704 tests):** ~3s (Vitest, 4-8 threads parallel)
- **E2E (29 tests, 1 site):** ~45s (Playwright, headed + slowMo 400ms)
- **E2E headless:** ~20s (không slowMo)

---

## Viết Test Mới

### Unit/Stress test (Vitest)
```typescript
// File: packages/core/tests/<module>/<name>.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/path/to/module';  // @ = packages/core/src

describe('myFunction', () => {
  it('does something', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

### E2E test (Playwright)
```typescript
// File: tests/e2e/<category>/<name>.spec.ts
import { test, expect } from '@playwright/test';

test('user can download video', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Chờ JS init (convert button enabled)
  await page.waitForFunction(() => {
    const btn = document.querySelector('.btn-convert') as HTMLButtonElement;
    return btn && !btn.disabled;
  });
  await page.locator('#videoUrl').fill('https://youtube.com/watch?v=test');
  await page.locator('.btn-convert').click();
  // ...
});
```

---

## CI/CD Integration

```yaml
# GitHub Actions
- name: Run unit + stress tests
  run: npm test

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Build site for E2E
  run: cd apps/onedownloader.net && npm run build

- name: Run E2E tests
  run: HEADLESS=1 npm run test:e2e:skip-build
```
