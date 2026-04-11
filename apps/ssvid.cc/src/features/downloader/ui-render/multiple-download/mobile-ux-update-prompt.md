# Prompt: Update ssvid.cc Playlist Mobile UX to match ytmp3.gg

## Bối cảnh

Project **ssvid.cc** (`f:\downloader\Project-root\apps\ssvid.cc`) và **ytmp3.gg** (`F:\downloader\ytmp3.gg`) cùng có tính năng multiple-download/playlist. Hiện tại trải nghiệm **mobile** của ssvid.cc đang khác biệt lớn so với ytmp3.gg. Cần update ssvid.cc cho đồng bộ.

**Hãy đọc reference project ytmp3.gg trước** để hiểu rõ cách cài đặt mẫu, rồi áp dụng tương ứng vào ssvid.cc (TypeScript).

---


## Phân tích so sánh 2 project (Playlist)

### Điểm GIỐNG nhau

| Tiêu chí | Mô tả |
|---|---|
| **Architecture** | Cả hai đều dùng **Strategy Pattern** — tách logic render giữa Playlist mode (dropdown settings) và Multi-Download mode (badge settings) |
| **Store pattern** | Cả hai dùng `VideoStore` class với Map + Event pattern, emit events khi state thay đổi |
| **Tab concept** | Cả hai đều có **2 tabs**: Convert (pending/ready items) và Download (downloading/completed items) |
| **Group structure** | Playlist items được gom thành groups, mỗi group có header riêng với checkbox, tabs, action buttons |
| **Video item layout** | 5 phần: Checkbox → Thumbnail → Info (title/author/settings/progress) → Action button → Delete (desktop) |
| **Settings toggle** | Pending/ready → hiện settings editable; Downloading → hiện progress bar (ẩn settings) |
| **Checkbox + Select all** | Cả hai có group checkbox với indeterminate state, "N selected" counter |
| **Download ZIP** | Cả hai hỗ trợ download nhiều completed items thành ZIP |
| **Status flow** | `pending → fetching_metadata → ready → queued → downloading → ... → completed/error` |

### Điểm KHÁC nhau (Focus: Mobile UX)

#### 1. Tab System trên Mobile ⭐ KHÁC BIỆT LỚN NHẤT

| | **ssvid.cc** | **ytmp3.gg** |
|---|---|---|
| Mobile tabs | **Ẩn tabs** → `activeTab = 'all'` | **Giữ tabs** → hoạt động giống desktop |
| Item visibility | **TẤT CẢ items** hiện cùng lúc | **Filter theo tab** (Convert/Download riêng) |
| Group buttons | Cả "Convert selected" + "Download ZIP" hiện **đồng thời** | Chỉ hiện **1 button** theo tab đang active |
| UX impact | Đơn giản nhưng **rối** với playlist lớn | Tách biệt rõ ràng, thêm 1 bước thao tác |

#### 2. Download ZIP trên iOS

| | **ssvid.cc** | **ytmp3.gg** |
|---|---|---|
| iOS detection | **Không có** — ZIP button hiện cho mọi platform | **Có** — `detectBrowser().isIOS` |
| iOS behavior | ZIP button hiện nhưng **không hoạt động** trên iOS Safari | ZIP button bị **ẩn hoàn toàn** trên iOS |
| Fallback | Không có fallback rõ ràng | User download **từng file** qua nút Download trên mỗi item |

#### 3. Tab Glider Animation

| | **ssvid.cc** | **ytmp3.gg** |
|---|---|---|
| Glider | ❌ Không có | ✅ Có `.tab-glider` div — highlight tab active |
| CSS | Chỉ đổi text color khi active | `background: #60a5fa`, `cubic-bezier` transition |
| Resize handling | N/A | `updatePlaylistTabGlider()` recalculate khi resize |

#### 4. Hand Guide (Onboarding)

| | **ssvid.cc** | **ytmp3.gg** |
|---|---|---|
| Hand guide | ❌ Không có | ✅ Hand-click GIF animation |
| Trigger | N/A | Xuất hiện khi item đầu tiên bắt đầu download |
| Dismiss | N/A | Auto hide 5s hoặc khi user click Download tab |
| Persistence | N/A | `localStorage('hasClickedPlaylistTab')` — chỉ hiện 1 lần |

#### 5. Checkbox & Selection — Quản lý khác nhau trên Mobile ⭐

Đây là điểm khác biệt quan trọng về **cách quản lý checkbox trên mobile**:

- **ssvid.cc mobile**: Quản lý checkbox theo **FULL ITEMS** — vì tabs bị ẩn trên mobile (`activeTab = 'all'`), nên group checkbox và "N selected" counter đếm trên **toàn bộ items** trong group, bất kể status là gì (pending, ready, downloading, completed... đều nằm chung). Khi tick group checkbox = chọn **tất cả** items thuộc mọi trạng thái.

- **ytmp3.gg mobile**: Quản lý checkbox theo **TAB** — vì tabs hoạt động trên cả mobile, nên group checkbox và "N selected" counter chỉ đếm **items trong tab hiện tại**. Ở Convert tab → checkbox scope chỉ items pending/ready. Ở Download tab → checkbox scope chỉ items downloading/completed. Khi tick group checkbox = chỉ chọn items **trong tab đang active**.

| | **ssvid.cc (mobile)** | **ytmp3.gg (mobile)** |
|---|---|---|
| Checkbox scope | **Tất cả items** (full list, mọi status) | **Chỉ items trong tab hiện tại** |
| "N selected" | Đếm toàn bộ items đã chọn trong group | Đếm chỉ items đã chọn **trong tab active** |
| Group checkbox indeterminate | Dựa trên **tất cả** items selectable trong group | Dựa trên items selectable **trong tab** |
| Select All action | Chọn **toàn bộ** items (mọi status) | Chỉ chọn items **thuộc tab hiện tại** |
| Hệ quả | User có thể vô tình chọn items đang downloading → gây confusing | Rõ ràng, chỉ thao tác trên items user đang thấy |

#### 6. Tab Suffix Text

| | **ssvid.cc** | **ytmp3.gg** |
|---|---|---|
| Desktop | `Convert Tab (5)` | `Convert Tab (5)` |
| Mobile | Giữ nguyên `Convert Tab (5)` | Ẩn từ "Tab" → `Convert (5)` via `.tab-suffix { display: none }` |

---

## Các Task cần thực hiện

## Hướng dẫn tham khảo ytmp3.gg

Trước khi implement, hãy đọc các file sau trong ytmp3.gg để có cái nhìn tổng quan:

| Mục đích | File ytmp3.gg |
|---|---|
| Entry point, flow tổng quát | `F:\downloader\ytmp3.gg\src\script\features\multiple-download\index.js` |
| Video item renderer + group logic + iOS detection | `F:\downloader\ytmp3.gg\src\script\features\multiple-download\video-item-renderer.js` |
| Tab click, tab glider, hand guide, ZIP download | `F:\downloader\ytmp3.gg\src\script\features\multiple-download\ui\list-event-handlers.js` |
| Store change handler + group HTML structure | `F:\downloader\ytmp3.gg\src\script\features\multiple-download\store\handle-store-change.js` |
| Playlist strategy (dropdown mode) | `F:\downloader\ytmp3.gg\src\script\features\multiple-download\video-item-playlist.js` |
| Multi-download strategy (badge mode) | `F:\downloader\ytmp3.gg\src\script\features\multiple-download\video-item-multi-download.js` |
| CSS toàn bộ (tabs, glider, mobile responsive) | `F:\downloader\ytmp3.gg\src\styles\multiple-download.css` |

Và các file tương ứng trong ssvid.cc:

| Mục đích | File ssvid.cc |
|---|---|
| Store change handler + group HTML | `f:\downloader\Project-root\apps\ssvid.cc\src\features\downloader\ui-render\multiple-download\handle-store-change.ts` |
| Main renderer + tab/ZIP logic | `f:\downloader\Project-root\apps\ssvid.cc\src\features\downloader\ui-render\multiple-download\multiple-download-renderer.ts` |
| Playlist strategy | `f:\downloader\Project-root\apps\ssvid.cc\src\features\downloader\ui-render\multiple-download\playlist-strategy.ts` |
| Multi-download strategy | `f:\downloader\Project-root\apps\ssvid.cc\src\features\downloader\ui-render\multiple-download\multi-download-strategy.ts` |
| Video item renderer | `f:\downloader\Project-root\apps\ssvid.cc\src\features\downloader\ui-render\multiple-download\video-item-renderer.ts` |
| CSS | `f:\downloader\Project-root\apps\ssvid.cc\src\styles\features\multiple-downloader-v2.css` |
| iOS utility | `f:\downloader\Project-root\apps\ssvid.cc\src\utils\index.ts` (function `isIOS()` line 262) |

---
> Task 1 + 5 **PHẢI** làm trước vì chúng là foundation. Task 2-4-6 là polish features có thể làm sau hoặc song song.

### Task 1: Enable Tab System trên Mobile

Trong `handle-store-change.ts`, function `updateGroupCount()` hiện đang check `isMobileDevice()` rồi set `activeTab = 'all'` → hiện tất cả items, không filter theo tab. Cần xóa logic này để tabs hoạt động trên mobile giống desktop (giống ytmp3.gg). Tham khảo `updatePlaylistGroupCount()` trong ytmp3.gg `video-item-renderer.js` (line 712-758) — không phân biệt mobile/desktop khi filter items theo tab. Đồng thời đảm bảo trong `multiple-download-renderer.ts`, các function `switchToTab` và `handleTabClick` không bị skip trên mobile.

**Kết quả mong muốn:** Mobile user thấy 2 tabs "Convert (N)" và "Download (N)", click tab → filter items, mỗi tab chỉ hiện button tương ứng (Convert selected hoặc Download ZIP).

---

### Task 2: Thêm Tab Glider Animation

Group header HTML trong `handle-store-change.ts`, function `createGroupElement()` hiện **không có** `.tab-glider` div. Cần thêm vào HTML template và CSS. Tham khảo ytmp3.gg: HTML trong `store/handle-store-change.js` (line 162-165), CSS trong `multiple-download.css` (line 3095-3133), JS logic trong `list-event-handlers.js` functions `handlePlaylistTabClick()` (line 400-410) và `updatePlaylistTabGlider()` (line 488-507).

**Cần làm:** Thêm `<div class="tab-glider">` vào HTML, thêm CSS styles (position absolute, transition), thêm JS logic tính width + translateX khi chuyển tab và khi resize.

---

### Task 3: Ẩn Download ZIP trên iOS

ssvid.cc **không detect iOS** trong multiple-download module. Download ZIP button hiện cho tất cả platform kể cả iOS Safari (mà iOS không hỗ trợ download ZIP programmatically). Tham khảo ytmp3.gg detect iOS ở 3 nơi: `list-event-handlers.js` (line 422-428), `video-item-renderer.js` (line 680-682 và line 830-832). ssvid.cc đã có sẵn function `isIOS()` trong `src/utils/index.ts` (line 262) — chỉ cần import và sử dụng.

**Cần làm:** Check `isIOS()` trong `handle-store-change.ts` (function `updateGroupCount`) và `multiple-download-renderer.ts` để ẩn tất cả ZIP buttons trên iOS. Android vẫn hiện bình thường.

---

### Task 4: Thêm Hand Guide (Tab Discovery)

Không có hand guide / onboarding nào hướng dẫn user chuyển tab trong ssvid.cc. Tham khảo ytmp3.gg: asset GIF tại `F:\downloader\ytmp3.gg\src\assest\img\hand-click.gif`, HTML structure trong `store/handle-store-change.js` (line 166-168), CSS trong `multiple-download.css` (line 3112-3117), trigger logic `showDownloadTabGuide()` trong `list-event-handlers.js` (line 451-486).

**Cần làm:** Copy asset GIF hoặc tạo mới, thêm `<div class="tab-hand-guide">` vào group template, CSS positioning, JS trigger khi item đầu tiên bắt đầu download + localStorage tracking `'hasClickedPlaylistTab'`.

---

### Task 5: Chuyển Checkbox Scope từ Full Items sang Per-Tab (Mobile)

Hiện tại trên mobile, ssvid.cc quản lý checkbox theo **toàn bộ items** vì không có tab filtering. Sau khi hoàn thành Task 1 (enable tabs trên mobile), cần chuyển checkbox scope sang **per-tab** giống ytmp3.gg. Trong `handle-store-change.ts` function `updateGroupCount()`, tất cả nhánh `isMobile` liên quan đến checkbox/selection/count cần được xóa. Tham khảo `updatePlaylistGroupSelectedCounts()` trong ytmp3.gg `video-item-renderer.js` (line 768-874) — luôn scope theo active tab, cả mobile lẫn desktop.

**Cần làm:** Xóa tất cả nhánh `isMobile` trong `updateGroupCount()` liên quan đến checkbox/selection count. Group checkbox, "N selected" counter, và Select All action phải chỉ áp dụng cho items trong tab hiện tại.

---

### Task 6: Mobile CSS - Tab suffix ẩn từ "Tab"

Tab text hiện `Convert Tab (5)` trên cả desktop lẫn mobile. Tham khảo ytmp3.gg `multiple-download.css` (line 2960-2962) — wrap từ "Tab" trong `<span class="tab-suffix">` rồi ẩn trên mobile via media query.

**Cần làm:** Cập nhật HTML template trong `handle-store-change.ts` để wrap từ "Tab" và thêm CSS media query vào `multiple-downloader-v2.css`.
