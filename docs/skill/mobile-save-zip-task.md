# Task: Tích hợp Mobile Save ZIP Download

## Mục tiêu

Thêm cơ chế download ZIP server-side cho thiết bị mobile (Android + iOS). Desktop giữ nguyên flow hiện tại.

## Bối cảnh nghiệp vụ

### Vấn đề

Desktop ZIP download dùng cơ chế: gửi danh sách URLs → server tạo ZIP → trả `download_url` → client trigger download qua `<a download>`. Cơ chế này **không hoạt động đáng tin cậy trên mobile browser** (đặc biệt iOS Safari) vì `<a download>` attribute bị giới hạn hoặc bị bỏ qua.

### Giải pháp: Server-side ZIP Session

Trên mobile, dùng cơ chế server-side session — server tải file và tạo ZIP, client chỉ trigger download qua `window.location.href` (hoạt động trên mọi browser).

### Flow chi tiết

**Giai đoạn 1 — Auto-upload (background, tự động khi item hoàn thành):**

1. Khi page load trên mobile → khởi tạo listener lắng nghe item completion
2. Item đầu tiên hoàn thành → gọi `POST /save/init` → nhận `taskId` (tạo session trên server). Init có retry 3 lần với backoff (iOS Safari hay drop request đầu)
3. Mỗi item tiếp theo hoàn thành → gọi `POST /save/add` với `{task_id, url}` → server tải file về session
4. ZIP button count chỉ cộng khi `saveAddFile` **thành công**. Khi còn items đang xử lý (convert/download/upload), button hiện animated dots `...` sau dấu `)`

**Giai đoạn 2 — User trigger ZIP (click button):**

5. User click "Download ZIP (N)"
6. Nếu có items failed → re-init session nếu cần + retry tất cả failed items
7. Nếu không có items nào được track (tất cả fail ngay từ đầu) → scan store tìm completed items → upload lại từ đầu
8. Nếu có items pending → đợi hoàn thành (max 30s)
9. Freeze session — items complete sau đó bị queue vào `skippedWhileFrozen`
10. Gọi `POST /save/zip` → poll status mỗi 2 giây
    - `downloading` → "Downloading X/Y..."
    - `zipping` → "Zipping X/Y..."
    - `done` → nhận `zipUrl`
    - `failed` → hiển thị error
11. Khi `done` → `window.location.href = zipUrl` → browser download

**Giai đoạn 3 — Reset:**

12. Xóa items đã ZIP khỏi danh sách (nhưng KHÔNG xóa group container)
13. Reset session (clear taskId, successItemIds, failedItemIds)
14. Giữ `lastZippedItemIds` để biết items nào đã ZIP
15. Re-add items bị skip khi frozen + scan store cho items completed chưa được add
16. Khi scan batch items: chỉ lấy ungrouped items (filter `!item.groupId`)

### Per-group session

Mỗi playlist/channel group có session riêng (taskId riêng). ZIP button trong group chỉ ZIP files của group đó. Header ZIP button tính tổng count across all groups. Batch items (không có group) dùng key `'__default__'`.

### Khác biệt Desktop vs Mobile

| Aspect | Desktop (giữ nguyên) | Mobile (mới) |
|--------|----------------------|---------------|
| Upload timing | Không upload trước, gửi URLs khi click ZIP | Auto-upload từng file khi complete |
| Tạo ZIP | 1 request `POST /create` | Session-based: init → add → zip → poll |
| Download trigger | `<a download>` attribute | `window.location.href` (direct URL) |
| Progress | "Creating ZIP..." | "Downloading X/Y..." → "Zipping X/Y..." |
| Sau khi ZIP | Đánh dấu downloaded | Xóa items khỏi list |
| Button count | Đếm selected completed items | Đếm items đã upload thành công lên server |
| Error recovery | Không có | Retry failed + re-init session + scan store fallback |

### Quy tắc về Checkbox

Checkbox phục vụ cho việc **chọn items để convert** (tác vụ riêng, không liên quan đến ZIP). Trên mobile:

- **Page có tabs (playlist, channel)**: Convert tab giữ checkbox. Download tab ẩn checkbox.
- **Page không có tabs (multiple/batch download)**: Ẩn toàn bộ checkbox trên mobile.

Mỗi site cần tự xác định page nào có tabs, page nào không.

### ZIP button behavior trên mobile

- **Disabled state**: Disable khi count = 0 VÀ không có items đang xử lý. **KHÔNG bị ảnh hưởng bởi global download lock**.
- **Count**: Chỉ đếm items đã `saveAddFile` thành công. Không dùng optimistic count.
- **Processing indicator**: Khi còn items ở processing status (pending, analyzing, fetching_metadata, queued, downloading, converting) HOẶC đang upload lên server → hiện `Download ZIP (3)...` với animated dots SAU dấu `)`. Dots biến mất khi **TẤT CẢ items** không còn processing.
- **Width**: Cố định width trên mobile để tránh nhảy layout.
- **Font size**: 12px.
- **is-loading guard**: Khi đang polling, button có `is-loading` class. Guard chỉ protect **content** (text/count/disabled). Show/hide theo tab KHÔNG bị guard — ZIP button luôn ẩn trên convert tab, luôn hiện trên download tab.
- **Vị trí**: `margin-left: auto` để đẩy sang phải khi checkbox ẩn.

### Group container behavior

Group (playlist/channel) **KHÔNG bị xóa** khi tất cả items đã download xong hoặc bị remove. User có thể muốn load more items hoặc xem lại.

## Những gì đã có sẵn trong @downloader/core

Package `@downloader/core` đã được update với:

- **Interface**: `ISaveZipService` — 4 methods: `saveInit()`, `saveAddFile()`, `saveZip()`, `saveStatus()`
- **Service**: `createSaveZipService()` — factory tạo service
- **Endpoints**: `SAVE_ZIP_ENDPOINTS` — `/save/init`, `/save/add`, `/save/zip`, `/save/status`
- **Config**: `ApiConfig.saveZip` — optional config block (baseUrl, timeout)
- **Verified Services**: `CoreServices.saveZip` đã registered
- **Timeouts**: `saveZipInit: 15000`, `saveZipAdd: 15000`, `saveZip: 15000`, `saveZipStatus: 10000`

### API Endpoints (server: muti-download.ytconvert.org)

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/save/init` | POST | `{}` | `{ task_id }` |
| `/save/add` | POST | `{ task_id, url }` | `{}` hoặc `{ error }` |
| `/save/zip` | POST | `{ task_id, zip_name }` | `{}` hoặc `{ error }` |
| `/save/status/{taskId}` | GET | — | `{ status, zip_url, zip_size, downloaded, total, failed }` |

Service trong core đã normalize response (snake_case → camelCase).

## Công việc cần làm cho mỗi site

### Bước 1: Research cấu trúc project

Trước khi code, agent PHẢI tìm hiểu kỹ project được phân công:

- **Tech stack**: TypeScript hay JavaScript? Dùng `@downloader/core` hay standalone lib?
- **Mobile detection**: Site có hàm `isMobileDevice()` hoặc tương đương không?
- **Download pages**: Site có những page download nào? (single, multiple/batch, playlist, channel)
- **Tab system**: Page nào có tabs (convert/download)? Page nào là flat list?
- **Checkbox usage**: Checkbox dùng cho mục đích gì?
- **ZIP flow hiện tại**: Desktop ZIP đã implement chưa? Button selector là gì?
- **Store/State**: Dùng reactive store hay direct DOM? Event types nào fire khi item complete?
- **API layer**: File nào setup HTTP clients và services?
- **Global lock**: Có cơ chế lock buttons khi item đang download không?
- **Entry points**: Các file main cho từng page
- **Group removal**: Site có auto-remove group khi hết items không? Nếu có → bỏ logic đó

### Bước 2: Wire Save ZIP Service vào API layer

- Import `createSaveZipService` từ `@downloader/core`
- Tạo/reuse HTTP client cho base URL `muti-download.ytconvert.org`
- Tạo service instance và đưa vào app's service collection
- Thêm timeout config cho save zip operations

### Bước 3: Tạo Mobile Save ZIP Manager

Tạo module quản lý server-side ZIP session:

**State management (per-group):**
- `taskId` — session ID từ server
- `pendingItemIds` — items đang upload
- `successItemIds` — items đã upload thành công (count trên button)
- `failedItemIds` — items upload fail (retry khi click ZIP)
- `lastZippedItemIds` — items đã ZIP (giữ sau reset)
- `frozen` — flag ngăn thêm file khi đang tạo ZIP
- `skippedWhileFrozen` — queue items bị skip khi frozen

**Functions cần export:**
- `initMobileSaveZipListener()` — subscribe store, lắng nghe item completion
- `mobileSaveZipDownload(urls, btn, skipError, groupId)` — full recovery flow: retry failed → re-init if needed → scan store fallback → wait pending → freeze → saveZip → poll → download
- `getAddedCount(groupId?)` — trả `successItemIds.size` (chỉ items thành công)
- `hasItemsProcessing(groupId?)` — check store processing statuses + pending API uploads
- `updateHeaderZipButton()` — sync ZIP button state (export để renderer gọi sau re-render)

**iOS resilience:**
- `saveInit` retry 3 lần với backoff (1s, 2s). iOS Safari drop requests khi app backgrounded.
- Khi `taskId = null` sau init fail → add item vào `failedItemIds` (KHÔNG drop item)
- Khi click ZIP và không có items nào tracked → scan store, upload lại từ đầu

**Timing quan trọng:**
- `pendingItemIds.delete()` phải chạy TRƯỚC `updateZipButtonCount()`. Nếu delete sau → dots không biến mất.

**Service access:**
- Save ZIP API KHÔNG cần JWT/CAPTCHA → gọi trực tiếp qua core service
- `coreServices.saveZip!.saveInit()` (không qua verified services wrapper)

### Bước 4: Tích hợp vào UI/Renderer

1. **ZIP button click handler**: Trên mobile → route tới `mobileSaveZipDownload()`
2. **ZIP button count**: Trên mobile → `getAddedCount()` (chỉ success)
3. **Processing dots**: `hasItemsProcessing()` = true → `Download ZIP (N)...` với animated dots sau `)`. Biến mất khi tất cả items xong.
4. **Disabled**: Trên mobile → disable khi count = 0 VÀ không processing. Bỏ qua global lock
5. **Checkbox**: Ẩn/hiện theo quy tắc (tab-based vs flat list)
6. **is-loading guard**: Protect content, KHÔNG protect visibility. ZIP button luôn ẩn trên convert tab, luôn hiện trên download tab (tách `style.display` ra ngoài guard)
7. **Sau ZIP thành công**: Xóa items khỏi store. KHÔNG xóa group container.
8. **Batch resetSession**: Filter `!item.groupId` khi scan store
9. **Group removal**: Bỏ logic auto-remove group khi hết items

### Bước 5: Init listener ở entry points

- Tìm TẤT CẢ entry points cho download pages (batch, playlist, channel)
- Thêm `initMobileSaveZipListener()` sau khi renderer initialized
- Listener tự skip nếu không phải mobile device

### Bước 6: CSS cho mobile

- Animated dots (`.automation-dots`) đặt SAU dấu `)` — `Download ZIP (3)...`
- Hide checkbox theo quy tắc (CSS class `.is-mobile-zip` trên `<html>`)
- ZIP button cố định width, font-size 12px
- `margin-left: auto` đẩy button sang phải
- Đảm bảo responsive breakpoint không override width/min-width

### Bước 7: Performance

- KHÔNG chạy `updateBatchHeader()` (full innerHTML re-render) cho `item:progress` và `items:settings-changed`
- Chỉ re-render header khi item counts/status/selection thực sự thay đổi

## Lưu ý cho Agent

- KHÔNG giả định cấu trúc project giống ytmp4.gg. Mỗi site có thể khác nhau hoàn toàn.
- KHÔNG giả định site có multiple download, playlist, hay channel. Single download KHÔNG cần mobile ZIP.
- KHÔNG giả định DOM selector giống nhau.
- KHÔNG giả định store event names giống nhau.
- Luôn research project trước, hiểu rõ cấu trúc rồi mới bắt đầu code.
- Build test sau khi hoàn thành.
