# Supporter System — Handoff Document

> **Mục đích**: Tổng hợp những gì đã làm và hướng dẫn cho AI tiếp theo implement phần còn lại.

---

## PHẦN 1 — Những gì đã được làm trong session này

### 1.1 Refactor: Move shared code lên base packages

Thay vì implement riêng trong từng app, code dùng chung đã được đưa về `packages/`:

#### `packages/core` (thêm mới)

| File | Nội dung |
|------|----------|
| `src/supporter/feature-access-constants.ts` | `FEATURE_KEYS`, `FEATURE_KEY_ALIASES`, `GEO_RESTRICTED_FEATURES` |
| `src/supporter/index.ts` | barrel export |
| `src/utils/playlist-redirect.ts` | `shouldPromptPlaylistRedirect`, `shouldPromptPlaylistRedirectForMulti` |
| `src/services/supporter/supporter.service.ts` | `createSupporterService(ytMetaClient, supporterClient)` |
| `src/services/supporter/index.ts` | barrel export |

**Export từ `@downloader/core`**:
```typescript
import {
  FEATURE_KEYS, FEATURE_KEY_ALIASES, GEO_RESTRICTED_FEATURES, type FeatureKey,
  shouldPromptPlaylistRedirect, shouldPromptPlaylistRedirectForMulti,
  createSupporterService, type ISupporterService,
  type AllowedFeaturesResponse, type CheckKeyResponse,
} from '@downloader/core';
```

`ISupporterService` có 2 methods:
- `fetchAllowedFeatures()` → GET `{ytMetaBaseUrl}/allowed-features`
- `checkLicenseKey(key)` → POST `{supporterApiBaseUrl}/api/check-key`

#### `packages/ui-shared` (thêm mới)

| File | Nội dung |
|------|----------|
| `src/supporter/maintenance-popup.ts` | 4 popup functions |
| `src/supporter/index.ts` | barrel export |
| `src/styles/maintenance-popup.css` | CSS của popup |

**Export từ `@downloader/ui-shared`**:
```typescript
import {
  showLimitReachedPopup,
  showVideoLimitPopup,
  showMaintenancePopup,
  showSupporterUpsellPopup,
  type MaintenancePopupConfig,
} from '@downloader/ui-shared';
```

**Cách dùng popup** — mỗi app tạo 1 config object:
```typescript
// src/features/supporter-popup-config.ts (cần tạo cho ssvid.cc)
import type { MaintenancePopupConfig } from '@downloader/ui-shared';

export const POPUP_CONFIG: MaintenancePopupConfig = {
  supporterCtaUrl: 'https://ko-fi.com/s/d242437374',
  oneTimeDownloadUrl: 'https://ssvid.cc/',  // trang chủ ssvid
  logEvent: (eventName, eventParams) => {
    import('../libs/firebase')
      .then(({ logEvent }) => logEvent(eventName, eventParams))
      .catch(() => {});
  },
};
```

**CSS cần import** trong `src/styles/index.css`:
```css
@import '@downloader/ui-shared/styles/maintenance-popup.css';
```

---

### 1.2 Wiring vào apps

#### `apps/ssvid.cc/src/api/index.ts` (đã cập nhật)
- Import `createSupporterService` từ `@downloader/core`
- Tạo thêm `supporterHttpClient` (base: `getSupporterApiBaseUrl()` → `ytmp3-supporter.ytmp3.gg`)
- **Export**: `export const supporterService = createSupporterService(ytMetaHttpClient, supporterHttpClient);`

#### `apps/ssvid.cc/src/environment.ts` (đã cập nhật)
- Thêm `supporterApiBaseUrl: 'https://ytmp3-supporter.ytmp3.gg'`
- Thêm getter `getSupporterApiBaseUrl()`

#### `apps/ezconv` (đồng bộ)
- Đã remove `src/api/allowed-features.ts`, `src/constants/feature-access-constants.ts`, `src/features/ui/maintenance-popup.ts`
- Đã update import về packages
- Tạo `src/features/supporter-popup-config.ts`

---

### 1.3 Cleanup trong ssvid.cc
- Xóa `src/features/downloader/logic/redirect-helper.ts`
- Xóa duplicate inline trong `multi-downloader-main.ts` và `input-form.ts`
- Cả hai giờ import `shouldPromptPlaylistRedirect*` từ `@downloader/core`

---

## PHẦN 2 — Những gì CHƯA làm (cần implement tiếp)

Tất cả items dưới đây thuộc **ssvid.cc only** — ezconv đã có đủ.

### Nhóm A — Foundation (làm trước)

| # | File | Mô tả |
|---|------|--------|
| A1 | `src/features/download-limit.ts` | Daily limit engine, localStorage |
| A2 | `src/features/allowed-features.ts` | Orchestrator 3 lớp: license → geo → limit |
| A3 | `src/features/supporter-popup-config.ts` | POPUP_CONFIG cho ssvid.cc |

### Nhóm B — License UI

| # | File | Mô tả |
|---|------|--------|
| B1 | `src/features/license/license-selector.ts` | License button dropdown logic |
| B2 | `src/features/license/supporter-tag.ts` | Badge supporter trên logo |
| B3 | `src/features/license/license-page.ts` | Form nhập key, gọi `supporterService.checkLicenseKey()` |
| B4 | `license.html` (trang mới) | Copy y hệt từ ytmp3.gg |
| B5 | `vite.config.ts` | Thêm entry point cho `license.html` |

### Nhóm C — Nâng cấp Widget Level Manager

| # | File | Mô tả |
|---|------|--------|
| C1 | `src/features/widget-level-manager.ts` | Thêm license support, supporter badge, `applyInitialVisibility()` |

### Nhóm D — Quality Limit Integration

| # | File | Mô tả |
|---|------|--------|
| D1 | `src/features/downloader/logic/input-form.ts` hoặc conversion file | Check 4K + 320kbps limit trước khi submit |

### Nhóm E — HTML/CSS

| # | File | Mô tả |
|---|------|--------|
| E1 | `src/main.ts` | Import CSS popup, gọi `applyInitialVisibility()` |
| E2 | `src/multi-downloader-main.ts` | Import CSS popup |
| E3 | `src/playlist-downloader-main.ts` | Import CSS popup |
| E4 | HTML headers (index.html, youtube-multi-downloader.html, v.v.) | Thêm license button HTML |
| E5 | `src/styles/index.css` | `@import '@downloader/ui-shared/styles/maintenance-popup.css'` |

---

## PHẦN 3 — Chi tiết implement từng file còn lại

### A1 — `src/features/download-limit.ts`

**Nguồn tham chiếu**: `F:\downloader\ytmp3.gg\src\script\libs\downloader-lib-standalone\download-limit.js`

**Điều chỉnh khi port**:
- Storage: dùng `localStorage` trực tiếp (không qua utility)
- License key: `localStorage.getItem('ssvid:license_key')`
- Daily counter keys: `download_4k_daily`, `download_320kbps_daily`, `download_playlist_daily`, `download_multi_daily`, `download_channel_daily`
- Counter format JSON: `{ date: 'YYYY-MM-DD', count: number }`
- Reset logic: so sánh `date` với ngày hôm nay (local time)

**Constants**:
```typescript
export const MAX_PER_DAY = 1;
export const MAX_MULTI_DOWNLOAD_VIDEOS = 10;
```

**Exports cần có**:
```typescript
export function hasLicenseKey(): boolean
export function checkLimit(featureKey: string): { allowed: boolean; reason?: string; usedToday?: number; maxPerDay?: number }
export function recordUsage(featureKey: string): void
export function getUsageToday(featureKey: string): number
export function getSecondsUntilNextMidnight(): number  // dùng cho popup countdown
```

---

### A2 — `src/features/allowed-features.ts`

**Nguồn tham chiếu**: `F:\downloader\ytmp3.gg\src\temp\allowed-features.js`

**Điều chỉnh quan trọng**:
- Import `supporterService` từ `'../api'` (đã wired)
- Import `hasLicenseKey`, `checkLimit` từ `'./download-limit'`
- **`GEO_RESTRICTED_FEATURES` của ssvid.cc** bao gồm `download_multi` (khác ezconv!):
  ```typescript
  const GEO_RESTRICTED_FEATURES = new Set([
    'download_playlist',
    'download_multi',      // ← ssvid.cc có, ezconv KHÔNG có
    'download_channel',
  ]);
  ```
- Cache 5 phút: `const API_CACHE_TTL_MS = 5 * 60 * 1000`
- Retry 2 lần: `const MAX_ATTEMPTS = 2`
- Inflight guard: Promise cache để tránh parallel calls

**Exports**:
```typescript
export async function evaluateFeatureAccess(feature: string): Promise<{
  allowed: boolean;
  reason: 'allowed' | 'geo_restricted' | 'limit_reached' | 'api_unavailable';
  country?: string;
}>
export async function isFeatureAllowed(feature: string): Promise<boolean>
export async function isAnyFeatureAllowed(features: string[]): Promise<boolean>
```

---

### A3 — `src/features/supporter-popup-config.ts`

```typescript
import type { MaintenancePopupConfig } from '@downloader/ui-shared';

export const POPUP_CONFIG: MaintenancePopupConfig = {
  supporterCtaUrl: 'https://ko-fi.com/s/d242437374',
  oneTimeDownloadUrl: 'https://ssvid.cc/',
  logEvent: (eventName, eventParams) => {
    import('../libs/firebase')
      .then(({ logEvent }) => logEvent(eventName, eventParams))
      .catch(() => {});
  },
};
```

---

### B1 — `src/features/license/license-selector.ts`

**Nguồn**: `F:\downloader\ytmp3.gg\src\script\features\license-selector.js`

- HTML của license button: **copy y hệt từ ytmp3.gg** vào header HTML
- Logic: toggle dropdown, load key từ localStorage
- Storage key: `ssvid:license_key`
- Ko-fi link: `https://ko-fi.com/s/d242437374`

**Exports**:
```typescript
export function getSavedLicenseKey(): string | null
export function saveLicenseKey(key: string): void
export function resetLicenseKey(): void
export function initLicenseSelector(): void  // mount event listeners
```

---

### B2 — `src/features/license/supporter-tag.ts`

**Nguồn**: `F:\downloader\ytmp3.gg\src\script\features\tag-supporter-user.js`

- Badge PNG: `/images/tag-supporter.png` (copy từ ytmp3.gg)
- Inject `<style>` tag một lần, append badge vào target selector
- `init(targetSelector: string)` → `show()` / `hide()`

---

### B3 — `src/features/license/license-page.ts`

**Nguồn**: `F:\downloader\ytmp3.gg\src\script\features\license-page.js`

- Dùng `supporterService.checkLicenseKey(key)` (import từ `'../../api'`)
- Valid → `saveLicenseKey(key)` → hiện success message
- Invalid → hiện error message

---

### B4 + B5 — `license.html` + `vite.config.ts`

- Copy `pages/license/index.html` (hoặc tương đương) từ ytmp3.gg
- Không thay đổi HTML/CSS/layout
- Thêm vào `vite.config.ts`:
  ```typescript
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        license: 'license.html',
        // ...existing entries
      }
    }
  }
  ```

---

### C1 — Nâng cấp `src/features/widget-level-manager.ts`

**Nguồn**: `F:\downloader\ytmp3.gg\src\script\features\supporter-level-manager.js`

**Thêm vào file hiện tại**:
```typescript
import { hasLicenseKey } from './download-limit';
import { initLicenseSelector } from './license/license-selector';
import { init as initSupporterTag } from './license/supporter-tag';
```

**Level rules**:
- Level 1: 0–1 lần tải
- Level 2: 2–6 lần → hiện license button
- Level 3: >6 lần → hiện license button + supporter badge + ẩn ad banner
- Supporter (license key): bypass limit, hiện supporter badge

**Thêm function**:
```typescript
export function applyInitialVisibility(): void
// → gọi initLicenseSelector(), check hasLicenseKey(), apply level
```

**Gọi trong `src/main.ts`**:
```typescript
import { applyInitialVisibility } from './features/widget-level-manager';
// trong loadFeatures():
applyInitialVisibility();
```

---

### D1 — Quality Limit Integration

**File cần sửa**: Tìm chỗ submit download trong `src/features/downloader/logic/input-form.ts` hoặc conversion file.

**Vị trí check**: Trước khi gọi API convert, sau khi đọc format/quality state:

```typescript
import { checkLimit, recordUsage } from '../download-limit';
import { showLimitReachedPopup } from '@downloader/ui-shared';
import { POPUP_CONFIG } from '../supporter-popup-config';

// Check 4K
if (videoQuality === '2160p') {
  const limit = checkLimit('download_4k');
  if (!limit.allowed) {
    showLimitReachedPopup(POPUP_CONFIG);
    return;
  }
}

// Check 320kbps
if (audioFormat === 'mp3' && audioBitrate === '320') {
  const limit = checkLimit('download_320kbps');
  if (!limit.allowed) {
    showLimitReachedPopup(POPUP_CONFIG);
    return;
  }
}

// ... gọi API ...

// Sau khi thành công:
if (videoQuality === '2160p') recordUsage('download_4k');
if (audioFormat === 'mp3' && audioBitrate === '320') recordUsage('download_320kbps');
```

**Detection** (từ `format-selector-state.ts`):
- 4K: `videoQuality === '2160p'`
- 320kbps: `audioBitrate === '320'` (với `audioFormat === 'mp3'`)

---

## PHẦN 4 — Lưu ý kỹ thuật quan trọng cho AI tiếp theo

### 4.1 Discrepancy: GEO_RESTRICTED_FEATURES

`packages/core` export `GEO_RESTRICTED_FEATURES` chỉ có `playlist` và `channel` (theo ezconv).
**ssvid.cc cần define lại** trong `src/features/allowed-features.ts`:
```typescript
// KHÔNG import GEO_RESTRICTED_FEATURES từ @downloader/core
// Define riêng trong file này:
const GEO_RESTRICTED_FEATURES = new Set([
  'download_playlist',
  'download_multi',   // ← ssvid.cc có thêm cái này
  'download_channel',
]);
```

### 4.2 Allowed-features endpoint

Tài liệu gốc nói `https://ytmp3-supporter.ytmp3.gg/api/allowed-features`.
Thực tế đã confirm: endpoint dùng `yt-meta.ytconvert.org/allowed-features` (đã wired qua `ytMetaHttpClient`).
`supporterService.fetchAllowedFeatures()` gọi đúng endpoint rồi.

### 4.3 API đã sẵn sàng

Không cần tạo HTTP client hay API setup gì thêm. Chỉ cần:
```typescript
import { supporterService } from '../../api';
// supporterService.fetchAllowedFeatures()
// supporterService.checkLicenseKey(key)
```

### 4.4 Thứ tự init trong main.ts

```typescript
async function loadFeatures() {
  // ... existing ...
  applyInitialVisibility();  // ← thêm vào đây
  await initDownloaderUI();
  // ...
}
```

### 4.5 Multi/Playlist geo check

`evaluateFeatureAccess('download_multi')` và `evaluateFeatureAccess('download_playlist')` phải được gọi **trước** khi bắt đầu multi-download hoặc playlist fetch — trong `multi-downloader-main.ts` và `playlist-downloader-main.ts`.

---

## PHẦN 5 — Prompt cho AI tiếp theo

### Tài liệu cần cung cấp

1. **File này** (`supporter-system-handoff.md`) — đọc trước
2. **`supporter-system-context-for-ai.md`** — context gốc đầy đủ
3. **Các file nguồn từ ytmp3.gg** (đọc để tham chiếu logic):
   - `F:\downloader\ytmp3.gg\src\script\libs\downloader-lib-standalone\download-limit.js`
   - `F:\downloader\ytmp3.gg\src\temp\allowed-features.js`
   - `F:\downloader\ytmp3.gg\src\script\features\license-selector.js`
   - `F:\downloader\ytmp3.gg\src\script\features\license-page.js`
   - `F:\downloader\ytmp3.gg\src\script\features\tag-supporter-user.js`
   - `F:\downloader\ytmp3.gg\src\script\features\supporter-level-manager.js`
4. **Các file ssvid.cc hiện tại** (đọc để hiểu context):
   - `F:\downloader\Project-root\apps\ssvid.cc\src\features\widget-level-manager.ts`
   - `F:\downloader\Project-root\apps\ssvid.cc\src\features\downloader\logic\input-form.ts`
   - `F:\downloader\Project-root\apps\ssvid.cc\src\api\index.ts`
   - `F:\downloader\Project-root\apps\ssvid.cc\src\environment.ts`
   - `F:\downloader\Project-root\apps\ssvid.cc\src\main.ts`
   - `F:\downloader\Project-root\apps\ssvid.cc\src\multi-downloader-main.ts`
   - `F:\downloader\Project-root\apps\ssvid.cc\src\playlist-downloader-main.ts`
5. **Packages đã implement** (đọc để biết API):
   - `F:\downloader\Project-root\packages\core\src\services\supporter\supporter.service.ts`
   - `F:\downloader\Project-root\packages\ui-shared\src\supporter\maintenance-popup.ts`

---

### Prompt mẫu cho AI tiếp theo

```
Bạn là senior TypeScript developer đang implement Supporter System cho ssvid.cc.

**ĐÃ LÀM RỒI** (đừng làm lại):
- `packages/core`: FEATURE_KEYS, GEO_RESTRICTED_FEATURES, createSupporterService, shouldPromptPlaylistRedirect*
- `packages/ui-shared`: showLimitReachedPopup, showVideoLimitPopup, showSupporterUpsellPopup, maintenance-popup.css
- `apps/ssvid.cc/src/api/index.ts`: đã export `supporterService` (fetchAllowedFeatures + checkLicenseKey)
- `apps/ssvid.cc/src/environment.ts`: đã có `getSupporterApiBaseUrl()`

**CÒN PHẢI LÀM** (theo thứ tự dependency):
1. `src/features/download-limit.ts` — port từ ytmp3.gg download-limit.js sang TS
2. `src/features/allowed-features.ts` — orchestrator 3 lớp (license → geo → limit)
3. `src/features/supporter-popup-config.ts` — POPUP_CONFIG cho ssvid.cc
4. `src/features/license/license-selector.ts` — license button dropdown
5. `src/features/license/supporter-tag.ts` — supporter badge trên logo
6. `src/features/license/license-page.ts` — form nhập key, gọi supporterService.checkLicenseKey()
7. `license.html` — copy từ ytmp3.gg, thêm vào vite.config.ts
8. Nâng cấp `src/features/widget-level-manager.ts` — thêm license/supporter logic
9. Tích hợp limit check vào download flow (4K + 320kbps)
10. Thêm license button HTML vào tất cả HTML pages
11. Import popup CSS vào src/styles/index.css
12. Gọi applyInitialVisibility() trong src/main.ts

**QUY TẮC**:
- Port logic từ ytmp3.gg JS sang TypeScript
- Không copy cấu trúc thư mục ytmp3.gg
- HTML/CSS của license button và trang /license: copy y hệt từ ytmp3.gg
- API calls: dùng `supporterService` từ `import { supporterService } from '../../api'`
- GEO_RESTRICTED_FEATURES trong allowed-features.ts phải bao gồm download_multi (khác ezconv)
- Popup calls: dùng `import { showLimitReachedPopup } from '@downloader/ui-shared'` + POPUP_CONFIG

Đọc supporter-system-handoff.md và supporter-system-context-for-ai.md trước khi bắt đầu.
```

---

## PHẦN 6 — Cấu trúc file ssvid.cc sau khi hoàn thành

```
src/
├── api/
│   ├── index.ts          ← ✅ đã có supporterService export
│   └── v3.ts
├── constants/
│   └── youtube-constants.ts
├── features/
│   ├── download-limit.ts          ← ❌ CẦN TẠO
│   ├── allowed-features.ts        ← ❌ CẦN TẠO
│   ├── supporter-popup-config.ts  ← ❌ CẦN TẠO
│   ├── widget-level-manager.ts    ← ⚠️ CẦN NÂNG CẤP
│   ├── license/
│   │   ├── license-selector.ts    ← ❌ CẦN TẠO
│   │   ├── license-page.ts        ← ❌ CẦN TẠO
│   │   └── supporter-tag.ts       ← ❌ CẦN TẠO
│   └── downloader/
│       └── logic/
│           └── input-form.ts      ← ⚠️ CẦN THÊM quality limit check
├── styles/
│   └── index.css                  ← ⚠️ CẦN THÊM popup CSS import
└── main.ts                        ← ⚠️ CẦN THÊM applyInitialVisibility()

license.html                       ← ❌ CẦN TẠO (root, cùng cấp index.html)
vite.config.ts                     ← ⚠️ CẦN THÊM entry point license.html
```

**Legend**: ✅ done | ⚠️ cần sửa | ❌ cần tạo mới
