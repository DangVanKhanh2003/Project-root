# So sánh Multi-Download (Bulk) — ytmp4.gg vs ytmp3.gg

## Tổng quan

**Multi-download** (bulk download) = user paste nhiều YouTube URLs riêng lẻ (không phải playlist), mỗi URL là 1 video độc lập. Khác với playlist mode (1 playlist URL → nhiều items), multi-download xử lý N URLs riêng biệt.

---

## Điểm GIỐNG nhau

| Tiêu chí | Mô tả |
|---|---|
| **Strategy Pattern** | Cả hai dùng strategy riêng cho multi-download: `MultiDownloadStrategy` (ytmp4.gg) / `video-item-multi-download.js` (ytmp3.gg) — render badges thay vì dropdowns |
| **Settings hiển thị badge** | Multi-download items hiện settings dạng badge text (vd: `MP4 · 720p`) thay vì dropdown chọn format/quality như playlist mode |
| **Checkbox** | Cả hai có checkbox per-item + master checkbox ("Select all") |
| **Download Queue** | Cả hai dùng semaphore-based `DownloadQueue` class với `MAX_CONCURRENT = 5` |
| **Download Runner** | Cả hai dùng `runSingleDownload()` function riêng (copy từ download-flow chính, dùng callbacks thay vì global state) |
| **Cancel/Retry** | Cả hai hỗ trợ cancel (abort download) và retry (re-queue) trên individual items |
| **Store events** | Cùng event pattern: `item:added`, `item:removed`, `item:updated`, `item:progress`, `items:selection-changed` |
| **Batch header** | Cả hai có header riêng cho multi-download (non-group items), hiện total count + selected count |
| **ZIP download** | Cả hai hỗ trợ download completed items thành ZIP file |

---

## Điểm KHÁC nhau

### 1. Architecture & Language

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Language | **TypeScript** | **JavaScript** |
| Renderer | Class-based `MultipleDownloadRenderer` — 1 class chứa tất cả: render, events, store subscription | Function-based — tách thành nhiều files: `event-bindings.js`, `list-event-handlers.js`, `handle-store-change.js` |
| Init | `renderer.init()` → tạo container dynamically nếu chưa có | HTML container có sẵn trong page |

### 2. Desktop Action Button — Completed Items ⭐

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Completed (desktop) | **Download button** — individual download button per item (spinner + check icon) | **Badge** — chỉ hiện "Ready" / "Downloaded" badge, KHÔNG có download button |
| Downloaded (desktop) | Download button đổi thành "Downloaded" (green) | Badge đổi thành "Downloaded" |
| Download method (desktop) | User click **individual download button** per item | User **chọn checkbox → Download ZIP** (batch) |
| During download | **Cancel button** (✕) hiện thay download button | **Không có** cancel button visual |

> **Hệ quả**: ytmp4.gg trên desktop cho phép download **từng file riêng lẻ**, ytmp3.gg buộc user dùng **ZIP** trên desktop.

### 3. Mobile Action Button — Completed Items

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Completed (mobile) | **Download button** — giống desktop | **Download button** — nhưng khác desktop (desktop chỉ badge) |
| Logic | `getActionButton()` return download button cho cả mobile + desktop | `getActionButton()` check `isMobile` → return download button **chỉ** khi mobile |

> **Kết luận**: Trên mobile, cả hai đều có individual download button. Sự khác biệt chỉ ở **desktop**.

### 4. Global Download Lock

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Lock mechanism | ✅ **Có** — `isGlobalDownloadLocked` flag. Khi 1 file đang download → disable TẤT CẢ download buttons + ZIP buttons | ❌ **Không có** — mỗi item download độc lập |
| Lock duration | 5 giây sau khi trigger download | N/A |
| Active loading | Track `activeLoadingId` — item đang download có spinner animation | Không track; dùng status badge |
| Disabled state | All download/ZIP buttons: `disabled` + `is-disabled` class | Không disable buttons khác |

> **Hệ quả**: ytmp4.gg đảm bảo user download **tuần tự** (1 file tại 1 thời điểm), tránh browser bị block multiple downloads. ytmp3.gg không có cơ chế này.

### 5. Global Settings UI

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Format/Quality chung | ❌ **Không có** — settings cố định theo global config, không editable trên UI multi-download | ✅ **Có** — format toggle (MP3/MP4) + quality dropdown + audio track select |
| Apply settings | Không có | "Apply to All" / "Apply to Selected" |
| Convert button | Submit form → auto convert all | `addUrlsBtn` riêng với URL count: "Convert (3)" |
| Auto-convert on paste | Không (submit form separately) | ✅ Enter/Ctrl+Enter trong textarea |

### 6. URL Input

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Input area | Dùng **chung input** với single-download form | **Textarea riêng** trong multi-download card |
| URL parsing entry | `multiDownloadService.addUrls(rawText)` | `addURLs(inputText)` → separate module |
| URL count preview | ❌ Không hiện | ✅ Button hiện count: "Convert (5)" |
| Paste behavior | Standard | Auto thêm newline cuối, auto update count |

### 7. Batch Header

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Title | "Multiple download" | (tương tự) |
| Item count | `${items.length} items` | `${items.length} items` |
| ZIP button text | "Download select (N)" — N = completed selected count | "Download ZIP (N)" |
| iOS check | ❌ Không ẩn trên iOS | ✅ Ẩn ZIP button trên iOS |

### 8. Group Checkbox Warning (Desktop)

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Select All warning | ✅ **Có** — `MaterialPopup.show()` warning nếu có items đang processing hoặc failed | ❌ **Không có** — select all ngay lập tức |
| Warning content | "There are N videos still processing and M videos failed. Continue?" | N/A |
| Confirm flow | User phải click "OK" để confirm | N/A |

### 9. Status Labels (Multi-download specific)

| Status | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Pending | Badge "Pending" | (không hiện badge) |
| Ready | Badge "Ready" | (không hiện badge) |
| Queued | Badge "Queued" | (không hiện) |
| Downloading | Phase text "Downloading..." | (không hiện badge — chỉ progress bar) |
| Converting | Phase text "Processing..." | Phase text |
| Completed | Badge "Ready" (chưa download) / "Downloaded" | Badge "Ready" / "Downloaded" |
| Error | Badge "Failed" | (retry button) |
| Cancelled | Badge "Cancelled" | (không có — multi-download không cancel riêng) |

### 10. Store Change Handling

| | **ytmp4.gg** | **ytmp3.gg** |
|---|---|---|
| Tab glider update | ❌ Không có | ✅ Update glider position sau mỗi store change |
| Selection count | `updateBatchHeader()` tính lại mỗi lần | `updateSelectedCount()` + `updatePlaylistGroupSelectedCounts()` |
| Group tab filtering | `updateGroupCount()` — shared với playlist mode | `updatePlaylistGroupCount()` — shared với playlist mode |

---

## Tóm tắt điểm nổi bật

### ytmp4.gg có mà ytmp3.gg KHÔNG có:
1. **Individual download button trên DESKTOP** — user có thể download từng file riêng lẻ
2. **Global download lock** — prevent multiple simultaneous downloads
3. **Select All warning popup** — cảnh báo khi có items đang process/failed
4. **Cancel button** — visible cancel icon khi item đang download

### ytmp3.gg có mà ytmp4.gg KHÔNG có:
1. **Global settings UI** — format toggle + quality dropdown cho multi-download
2. **URL count preview** — button hiện số URLs detected
3. **Auto paste behavior** — newline tự thêm, count tự update
4. **iOS ZIP hiding** — ẩn ZIP button trên iOS Safari
5. **Tab glider + Hand guide** — polish features cho tab UX

---

## Files tham khảo

### ytmp4.gg
| File | Chức năng |
|---|---|
| `multiple-download-renderer.ts` | Renderer class — init, events, ZIP, tab switch, global lock |
| `multi-download-strategy.ts` | Strategy — badges, action buttons (desktop vs mobile), status|
| `handle-store-change.ts` | Store events → DOM updates, group count |
| `video-item-renderer.ts` | Create/update individual video item DOM |
| `multi-download-service.ts` | Service — addUrls, startDownload, createZip, queue management |
| `download-queue.ts` | Semaphore-based concurrency (MAX=5) |
| `download-runner.ts` | Single download execution with callbacks |

### ytmp3.gg
| File | Chức năng |
|---|---|
| `event-bindings.js` | Event setup — Convert All, paste, global settings |
| `list-event-handlers.js` | List events — tab click, glider, hand guide, ZIP, checkbox |
| `handle-store-change.js` | Store events → DOM updates |
| `video-item-renderer.js` | Create/update items + group counts + selected counts |
| `video-item-multi-download.js` | Strategy — badges (desktop) / download button (mobile) |
| `download-queue.js` | Semaphore-based concurrency (MAX=5) |
| `download-runner.js` | Single download execution with callbacks |
| `settings.js` | Global format/quality UI controls |
