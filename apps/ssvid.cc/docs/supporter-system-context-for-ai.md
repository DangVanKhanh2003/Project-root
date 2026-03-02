# Supporter System — AI Context Document for ssvid.cc

> **Mục đích tài liệu này**: Cung cấp đủ context để AI đọc xong và tạo ra implementation plan chi tiết cho việc port hệ thống Supporter từ `ytmp3.gg` sang `ssvid.cc`.

> [!NOTE]
> **Quy tắc copy**: Với **License Button (HTML/CSS)** và **trang `/license`**: copy **y hệt** từ ytmp3.gg, không thay đổi giao diện, không refactor HTML/CSS. Với **logic TypeScript**: tham chiếu ytmp3.gg rồi port sang TS theo cấu trúc ssvid.cc.

---

## PHẦN 1 — Tình trạng hiện tại của project

### Project path
```
F:\downloader\Project-root\apps\ssvid.cc\
```

### Tech stack
- **Language**: TypeScript (Vite build)
- **Entry point**: `src/main.ts`
- **Styling**: Vanilla CSS (`src/styles/`)
- **Không dùng**: React, Vue hay bất kỳ framework UI nào

### Cấu trúc thư mục hiện tại (`src/`)
```
src/
├── api/
│   ├── index.ts           ← API setup, createVerifiedServices, HTTP clients
│   └── v3.ts
├── constants/
│   └── youtube-constants.ts   ← CHỈ có YouTube constants, THIẾU feature-access.ts
├── features/
│   ├── downloader/
│   │   ├── downloader-ui.ts
│   │   ├── logic/
│   │   │   ├── input-form.ts      ← Xử lý form submit, auto-download
│   │   │   ├── conversion/
│   │   │   ├── multiple-download/
│   │   │   ├── route-init.ts
│   │   │   └── redirect-helper.ts
│   │   ├── state/
│   │   │   ├── format-selector-state.ts   ← Quản lý state format/quality (MP3, MP4, 4K, 320kbps)
│   │   │   ├── types.ts
│   │   │   └── ...
│   │   ├── ui-render/
│   │   └── routing/
│   ├── trustpilot/
│   ├── tip-message/
│   ├── strim-downloader/
│   └── widget-level-manager.ts    ← Orchestrator hiện tại (ĐƠN GIẢN, thiếu nhiều)
├── libs/
├── loaders/
├── styles/
├── ui-components/
│   ├── format-selector/
│   ├── material-popup/    ← Popup component có sẵn
│   └── ...
├── main.ts
├── multi-downloader-main.ts
└── playlist-downloader-main.ts
```

### Những gì ĐÃ CÓ trong ssvid.cc
| Thành phần | File | Trạng thái |
|---|---|---|
| Widget Level Manager (đơn giản) | `src/features/widget-level-manager.ts` | ✅ CÓ — chỉ đếm localStorage, không có License, không có Geo |
| Ko-fi widget | HTML inline (Ko-fi script tag) | ✅ ĐÃ XỬ LÝ — nhúng script overlay trực tiếp vào HTML, không cần file TS riêng |
| API setup | `src/api/index.ts` | ✅ CÓ — đầy đủ với `createVerifiedServices` |
| Material Popup | `src/ui-components/material-popup/` | ✅ CÓ — popup component dùng được |
| Format selector state | `src/features/downloader/state/format-selector-state.ts` | ✅ CÓ — có 4K (2160p) và 320kbps |
| Trustpilot widget | `src/features/trustpilot/` | ✅ CÓ |

### Những gì CHƯA CÓ trong ssvid.cc (cần implement)
| Thành phần | Trạng thái |
|---|---|
| `src/constants/feature-access.ts` | ❌ THIẾU |
| `src/features/download-limit.ts` | ❌ THIẾU |
| `src/api/allowed-features.ts` | ❌ THIẾU |
| `src/features/allowed-features.ts` | ❌ THIẾU |
| `src/features/license/license-selector.ts` | ❌ THIẾU |
| `src/features/license/license-page.ts` | ❌ THIẾU |
| Trang `/license` (HTML) | ❌ THIẾU |
| License button trong header (hiển thị theo level) | ❌ THIẾU |
| Supporter badge trên logo (Level 3) | ❌ THIẾU |
| Limit Popups (Daily / Video Count / Geo) | ❌ THIẾU |
| Quality limit check (4K + 320kbps) tích hợp vào download flow | ❌ THIẾU |

---

> [!IMPORTANT]
> **Lưu ý về Ko-fi**: `src/features/kofi/kofi-widget.ts` đã bị xóa. Ko-fi widget hiện được nhúng trực tiếp vào HTML bằng script tag:
> ```html
> <script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
> <script>kofiWidgetOverlay.draw('metaconvert', { 'type': 'floating-chat', ... });</script>
> ```
> Không cần tạo lại file TS cho Ko-fi.

---

## PHẦN 2 — Nguồn tham chiếu: ytmp3.gg

### Project path
```
F:\downloader\ytmp3.gg\
```

### ⚠️ Quan trọng: Sự khác biệt cấu trúc giữa 2 project

ytmp3.gg và ssvid.cc có cấu trúc **khác nhau hoàn toàn**. Không được copy cấu trúc thư mục của ytmp3.gg vào ssvid.cc. Cần **tham chiếu logic** và **bố trí lại** theo cấu trúc TypeScript/Vite của ssvid.cc.

| Khía cạnh | ytmp3.gg | ssvid.cc |
|---|---|---|
| Language | JavaScript (ES Modules) | **TypeScript** |
| Build tool | Vite (JS) | **Vite (TS)** |
| Cấu trúc API | `createVerifiedService` riêng trong từng feature | **Tập trung tại `src/api/index.ts`** |
| Feature organization | Flat: `src/script/features/*.js` | **Theo domain: `src/features/<domain>/`** |
| Constants | `src/script/constants/` | **`src/constants/`** |
| Libs | `src/script/libs/` | **`src/libs/`** |
| Temp/experimental | `src/temp/` | **Không có — đặt thẳng vào `src/features/`** |

**Nguyên tắc port**:
- Logic từ `src/temp/` của ytmp3.gg → đặt vào `src/features/` của ssvid.cc (không có folder `temp`)
- Logic từ `src/script/libs/` → đặt vào `src/features/` hoặc `src/libs/` tùy loại
- Luôn viết TypeScript với proper types, không giữ nguyên JavaScript
- API calls tuân theo pattern của `src/api/index.ts` (dùng `createHttpClient` từ `@downloader/core`)

### File nguồn cần tham chiếu / copy

| File nguồn (ytmp3.gg) | Mục đích | Ghi chú khi port sang ssvid |
|---|---|---|
| `src/temp/allowed-features.js` | Feature access orchestrator (Geo + Limit) | Port sang TypeScript, đặt tại `src/features/allowed-features.ts` |
| `src/script/constants/feature-access.js` | `FEATURE_KEYS`, `COUNTRY_RESTRICTED_FEATURES`, `FEATURE_KEY_ALIASES` | Port sang TypeScript, thêm `download_4k` |
| `src/script/libs/downloader-lib-standalone/download-limit.js` | Daily limit engine | Port sang TypeScript, đổi storage key thành `ssvid:` |
| `src/script/features/license-selector.js` | License button HTML + dropdown logic | **Copy y hệt HTML/CSS**, port logic sang TS |
| `src/script/features/license-page.js` | Logic trang nhập key | Port sang TypeScript |
| `pages/` (bất kỳ trang nào có license button trong header) | HTML của license button | **Copy y hệt HTML/CSS** vào header ssvid |
| `pages/license/index.html` hoặc tương đương | Trang /license | **Copy y hệt toàn bộ trang** |
| `src/script/features/multiple-download/ui/maintenance-popup.js` | 3 Popup functions — copy nguyên HTML + CSS | Port sang TypeScript, giữ nguyên HTML/CSS |
| `src/script/features/supporter-level-manager.js` | Level manager đầy đủ | Dùng làm tham chiếu để nâng cấp `widget-level-manager.ts` |
| `src/script/features/tag-supporter-user.js` | Badge Supporter trên logo | Port sang TypeScript |

---

## PHẦN 3 — Nhiệm vụ cần thực hiện

### Nhóm 1 — Foundation Layer

#### [NEW] `src/constants/feature-access.ts`
Copy từ `F:\downloader\ytmp3.gg\src\script\constants\feature-access.js`, port sang TypeScript.

```ts
export const FEATURE_KEYS = Object.freeze({
  MULTI_DOWNLOAD: 'download_multi',
  PLAYLIST_DOWNLOAD: 'download_playlist',
  CHANNEL_DOWNLOAD: 'download_channel',
  HIGH_QUALITY_320: 'download_320kbps',
  HIGH_QUALITY_4K: 'download_4k',       // THÊM MỚI — ssvid.cc có giới hạn 4K
});

export const FEATURE_KEY_ALIASES = Object.freeze({
  download_chanel: 'download_channel',  // fix typo
});

export const COUNTRY_RESTRICTED_FEATURES = new Set([
  'download_playlist',
  'download_multi',
  'download_channel',
  // 4K và 320kbps KHÔNG bị geo-restrict, chỉ bị daily limit
]);
```

#### [NEW] `src/features/download-limit.ts`
Port từ `F:\downloader\ytmp3.gg\src\script\libs\downloader-lib-standalone\download-limit.js`.

**Constants điều chỉnh được** (tập trung ở đầu file — đổi 1 chỗ là xong):
```ts
export const MAX_PER_DAY = 1;
export const MAX_MULTI_DOWNLOAD_VIDEOS = 10;
```

**Functions cần export**:
- `hasLicenseKey(): boolean`
- `checkLimit(featureKey: string): { allowed: boolean, reason?: string, usedToday?: number, maxPerDay?: number }`
- `recordUsage(featureKey: string): void`
- `getUsageToday(featureKey: string): number`

**Storage key** cho license: `ssvid:license_key`

**Logic reset**: Dùng `new Date()` (giờ địa phương user, không cần API)

---

### Nhóm 2 — Geo-Restriction / API Layer

#### [NEW] `src/api/allowed-features.ts`
Tạo mới, follow pattern của `src/api/index.ts`.

- **Endpoint**: `GET https://ytmp3-supporter.ytmp3.gg/api/allowed-features`
- **Cache**: 5 phút (TTL = `5 * 60 * 1000` ms)
- **Retry**: 2 lần trước khi throw error
- **Inflight guard**: Promise cache để tránh parallel calls
- **Response shape**: `{ "country": "VN", "allowed_features": ["download_playlist", "download_multi"] }`

#### [NEW] `src/features/allowed-features.ts`
Port từ `F:\downloader\ytmp3.gg\src\temp\allowed-features.js`, TypeScript.

3 lớp kiểm tra theo thứ tự:
1. `hasLicenseKey()` → bypass tất cả
2. `COUNTRY_RESTRICTED_FEATURES.has(feature)` → gọi API geo check
3. `checkLimit(feature)` → daily limit

**Export**:
- `evaluateFeatureAccess(feature: string): Promise<{ allowed: boolean, reason: 'allowed'|'geo_restricted'|'limit_reached'|'api_unavailable', country?: string }>`
- `isFeatureAllowed(feature: string): Promise<boolean>`
- `isAnyFeatureAllowed(features: string[]): Promise<boolean>`

---

### Nhóm 3 — License System

#### [NEW] `src/features/license/license-selector.ts`
Port logic từ `F:\downloader\ytmp3.gg\src\script\features\license-selector.js`.
HTML/CSS của license button: **copy y hệt từ ytmp3.gg** (không thay đổi giao diện).

- License button chỉ render khi `level >= 2`
- Dropdown: "Add license key" + "Join Membership" (chưa có key) / hiện key + "Reset" (đã có key)
- `getSavedLicenseKey(): string | null`
- `resetLicenseKey(): void`

**Ko-fi Membership link**: `https://ko-fi.com/s/fa5c2b2a93`

#### [NEW] `src/features/license/license-page.ts`
Port từ `F:\downloader\ytmp3.gg\src\script\features\license-page.js`.

- Nhận key từ input → `POST https://ytmp3-supporter.ytmp3.gg/api/check-key`
- Valid → lưu `ssvid:license_key` vào localStorage → thông báo thành công
- Invalid → thông báo lỗi

#### [NEW] Trang `/license` (HTML)
**Copy y hệt** từ ytmp3.gg — không thay đổi HTML/CSS/layout.
Load script `license-page.ts`.

---

### Nhóm 4 — Nâng cấp Widget Level Manager

#### [MODIFY] `src/features/widget-level-manager.ts`
Tham chiếu `F:\downloader\ytmp3.gg\src\script\features\supporter-level-manager.js`.

Thêm:
- Import `hasLicenseKey` từ `download-limit.ts`
- `isSupporter` vào `WidgetState` interface
- Level `'supporter'` vào `WIDGET_RULES`
- Badge Supporter trên logo khi `level === 3 || isSupporter`
- Ẩn banner quảng cáo dự án khi `level === 3 || isSupporter`
- `applyInitialVisibility()` để init license button khi page load
- Bỏ comment `isAnyFeatureAllowed()` trong `onAfterSubmit`

---

### Nhóm 5 — Quality Limit Intercepts

#### [MODIFY] Download flow (vị trí trong `src/features/downloader/logic/`)

Trước khi gọi API convert:
- `videoQuality === '2160p'` → `checkLimit('download_4k')` → nếu blocked: `showLimitReachedPopup()` → return
- `audioFormat === 'mp3' && audioBitrate === '320'` → `checkLimit('download_320kbps')` → nếu blocked: `showLimitReachedPopup()` → return
- Sau khi tải **thành công**: gọi `recordUsage(featureKey)`

---

### Nhóm 6 — Popups

#### [NEW] `src/features/limit-popups/limit-popups.ts`
**Copy nguyên HTML và CSS** từ `F:\downloader\ytmp3.gg\src\script\features\multiple-download\ui\maintenance-popup.js`.
Chỉ port sang TypeScript, KHÔNG thay đổi giao diện.

Thay `logEventWithPrefix(...)` bằng `logEvent(...)` từ `src/libs/firebase`.

3 functions cần export:
1. `showLimitReachedPopup(options?: { title?: string, description?: string })` — countdown đến 00:00
2. `showVideoLimitPopup(maxVideos?: number)` — hiện khi nhập > 10 video
3. `showSupporterUpsellPopup(country?: string)` — hiện khi geo-restricted

Ko-fi link trong tất cả popup: `https://ko-fi.com/s/fa5c2b2a93`

---

### Nhóm 7 — Header HTML

#### [MODIFY] Header HTML của tất cả các trang
Copy HTML của license button từ ytmp3.gg vào header ssvid.cc.
Mặc định `display:none`, `license-selector.ts` sẽ show/hide dựa trên level.

---

## PHẦN 4 — Điều kiện "Hoàn thành" (Definition of Done)

### ✅ Checklist

**License System**:
- [ ] Trang `/license` render được, UI giống ytmp3.gg
- [ ] Nhập key hợp lệ → lưu localStorage, thông báo thành công
- [ ] Nhập key sai → thông báo lỗi
- [ ] License button ẩn ở Level 1, hiện ở Level 2+
- [ ] Dropdown đúng 2 trạng thái (chưa/đã có key)
- [ ] Nút "Reset" xóa key thành công

**Level System**:
- [ ] Level 1: 0–1 lần tải | Level 2: 2–6 | Level 3: >6
- [ ] Level 3: Badge Supporter xuất hiện trên logo
- [ ] Level 3: Banner quảng cáo bị ẩn

**Daily Limit**:
- [ ] `MAX_PER_DAY` là hằng số duy nhất để thay đổi free quota
- [ ] Reset đúng 00:00 giờ địa phương (local time, không cần API)
- [ ] Supporter bypass toàn bộ giới hạn

**Quality Limits**:
- [ ] MP4 4K: bị chặn khi hết lượt → popup Daily Limit
- [ ] MP3 320kbps: bị chặn khi hết lượt → popup Daily Limit
- [ ] `recordUsage` chỉ gọi khi tải thành công

**Geo-Restriction**:
- [ ] Playlist/Multi/Channel: gọi API geo check trước khi cho phép
- [ ] Feature không trong whitelist → popup Supporter Upsell
- [ ] API lỗi sau 2 retry → popup Supporter Upsell
- [ ] API result cache 5 phút

**Popups**:
- [ ] Daily Limit Popup: countdown real-time, giống ytmp3.gg
- [ ] Video Count Popup: hiện khi > 10 video
- [ ] Supporter Upsell Popup: hiện khi geo-restricted

---

## PHẦN 5 — Thông tin kỹ thuật tổng hợp

### API Endpoints
| Mục đích | Method | URL |
|---|---|---|
| Check License Key | POST | `https://ytmp3-supporter.ytmp3.gg/api/check-key` |
| Geo/Feature Allowlist | GET | `https://ytmp3-supporter.ytmp3.gg/api/allowed-features` |

### Ko-fi Links
| Mục đích | Link |
|---|---|
| Membership / Upsell (popup, license button) | `https://ko-fi.com/s/fa5c2b2a93` |

### LocalStorage Keys (namespace `ssvid:`)
| Key | Mục đích |
|---|---|
| `ssvid:license_key` | License key của user |
| `ssvid_download_count` | Tổng số lần tải thành công (đã có sẵn) |
| `download_4k_daily` | Usage 4K hôm nay |
| `download_320kbps_daily` | Usage 320kbps hôm nay |
| `download_playlist_daily` | Usage playlist hôm nay |
| `download_multi_daily` | Usage multi-download hôm nay |
| `download_channel_daily` | Usage channel hôm nay |

### Constants điều chỉnh được
```ts
// src/features/download-limit.ts
export const MAX_PER_DAY = 1;                  // ← đổi số này để thay đổi free quota
export const MAX_MULTI_DOWNLOAD_VIDEOS = 10;   // ← max video/lần multi-download

// src/features/allowed-features.ts
const API_CACHE_TTL_MS = 5 * 60 * 1000;
const ALLOWED_FEATURES_MAX_ATTEMPTS = 2;
```

### File mapping ytmp3.gg → ssvid.cc
| Nguồn (ytmp3.gg) | Đích (ssvid.cc) | Cách xử lý |
|---|---|---|
| `src/temp/allowed-features.js` | `src/features/allowed-features.ts` | Port TypeScript |
| `src/script/constants/feature-access.js` | `src/constants/feature-access.ts` | Port TS + thêm `download_4k` |
| `src/script/libs/downloader-lib-standalone/download-limit.js` | `src/features/download-limit.ts` | Port TS, đổi storage key |
| `src/script/features/license-selector.js` | `src/features/license/license-selector.ts` | Port logic TS; HTML/CSS copy y hệt |
| `src/script/features/license-page.js` | `src/features/license/license-page.ts` | Port TypeScript |
| `pages/license/` (hoặc tương đương) | `/license` (trang mới) | Copy y hệt HTML |
| `src/script/features/multiple-download/ui/maintenance-popup.js` | `src/features/limit-popups/limit-popups.ts` | Port TS, giữ nguyên HTML/CSS |
| `src/script/features/tag-supporter-user.js` | `src/features/license/supporter-tag.ts` | Port TypeScript |

---

## PHẦN 6 — Lưu ý quan trọng khi implement

1. **Popup HTML/CSS**: Copy nguyên xi từ ytmp3.gg `maintenance-popup.js`. Không refactor, không thay đổi style.
2. **`logEventWithPrefix`**: ytmp3.gg dùng hàm này. Trong ssvid.cc thay bằng `logEvent` từ `src/libs/firebase`.
3. **API cho allowed-features**: Endpoint không cần auth — dùng `fetch` thẳng hoặc `createHttpClient` từ `@downloader/core`, không cần JWT.
4. **Thứ tự init**: Thêm `applyInitialVisibility()` vào `loadFeatures()` trong `src/main.ts`.
5. **`recordUsage` timing**: Chỉ gọi sau khi download **thực sự thành công**.
6. **4K detection**: `videoQuality === '2160p'` từ `format-selector-state.ts`.
7. **Feature key cho 4K**: Dùng `'download_4k'` (không phải `'download_2160p'`).
