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
2. Item đầu tiên hoàn thành → gọi `POST /save/init` → nhận `taskId` (tạo session trên server)
3. Mỗi item tiếp theo hoàn thành → gọi `POST /save/add` với `{task_id, url}` → server tải file về session
4. ZIP button chỉ cộng count khi `saveAddFile` thành công. Khi đang upload (pending), button hiện animated dots `...` sau count

**Giai đoạn 2 — User trigger ZIP (click button):**

5. User click "Download ZIP (N)"
6. Nếu có items failed → tự động retry trước
7. Nếu có items pending (đang upload) → đợi chúng hoàn thành (max 30s)
8. Freeze session — ngăn thêm file mới vào session hiện tại (items complete sau đó bị queue vào `skippedWhileFrozen`)
9. Gọi `POST /save/zip` với `{task_id, zip_name}` → server bắt đầu tạo ZIP
10. Poll status mỗi 2 giây: `GET /save/status/{taskId}`
    - `downloading` → button hiện "Downloading X/Y..."
    - `zipping` → button hiện "Zipping X/Y..."
    - `done` → nhận `zipUrl`
    - `failed` → hiển thị error
11. Khi `done` → `window.location.href = zipUrl` → browser download trực tiếp

**Giai đoạn 3 — Reset:**

12. Xóa items đã ZIP khỏi danh sách
13. Reset session (clear taskId, successItemIds, failedItemIds)
14. Giữ `lastZippedItemIds` để biết items nào đã ZIP
15. Re-add items bị skip khi frozen + scan store cho items completed chưa được add
16. Khi scan batch items: chỉ lấy ungrouped items (filter `!item.groupId`), tránh lẫn items của playlist groups

### Per-group session

Mỗi playlist/channel group có session riêng (taskId riêng). ZIP button trong group chỉ ZIP files của group đó. Header ZIP button tính tổng count across all groups. Batch items (không có group) dùng key `'__default__'`.

### Khác biệt Desktop vs Mobile

| Aspect | Desktop (giữ nguyên) | Mobile (mới) |
|--------|----------------------|---------------|
| Upload timing | Không upload trước, gửi URLs khi click ZIP | Auto-upload từng file khi complete |
| Tạo ZIP | 1 request `POST /create` | Session-based: init → add → zip → poll |
| Download trigger | `<a download>` attribute | `window.location.href` (direct URL) |
| Progress | "Creating ZIP..." (không chi tiết) | "Downloading X/Y..." → "Zipping X/Y..." |
| Sau khi ZIP | Đánh dấu downloaded | Xóa items khỏi list |
| Button count | Đếm selected completed items | Đếm items đã upload thành công lên server |

### Quy tắc về Checkbox

Checkbox phục vụ cho việc **chọn items để convert** (tác vụ riêng, không liên quan đến ZIP). Trên mobile:

- **Page có tabs (playlist, channel)**: Convert tab giữ checkbox (user cần chọn items để convert). Download tab ẩn checkbox (ZIP auto-upload all, không cần chọn).
- **Page không có tabs (multiple/batch download)**: Ẩn toàn bộ checkbox trên mobile (ZIP auto-upload, convert dùng nút riêng per item).

Mỗi site cần tự xác định page nào có tabs, page nào không, và áp dụng logic checkbox phù hợp.

### ZIP button behavior trên mobile

- **Disabled state**: Chỉ disable khi count = 0 VÀ không có pending uploads. **KHÔNG bị ảnh hưởng bởi global download lock** (mobile ZIP là server-side, không conflict với individual downloads).
- **Count**: Chỉ đếm items đã `saveAddFile` thành công (`successItemIds.size`). Không dùng optimistic count.
- **Processing indicator**: Khi còn items đang xử lý (bất kỳ status: pending, analyzing, fetching_metadata, queued, downloading, converting, hoặc đang upload lên server) → hiện `Download ZIP (3)...` với animated dots SAU dấu `)`. Dots chỉ biến mất khi **TẤT CẢ items** không còn ở processing status (tất cả đã completed/error/cancelled/ready) VÀ không còn pending uploads.
- **Width**: Button cố định width trên mobile (ví dụ 165px) để tránh nhảy layout khi count/dots thay đổi.
- **is-loading guard**: Khi đang polling (tạo ZIP), button có `is-loading` class. Các re-render khác (store events) PHẢI skip update nếu button có class này, bao gồm cả việc hide button khi chuyển tab.
- **Vị trí**: `margin-left: auto` để đẩy sang phải khi checkbox ẩn.

## Những gì đã có sẵn trong @downloader/core

Package `@downloader/core` đã được update với:

- **Interface**: `ISaveZipService` — 4 methods: `saveInit()`, `saveAddFile()`, `saveZip()`, `saveStatus()`
- **Service**: `createSaveZipService()` — factory tạo service
- **Endpoints**: `SAVE_ZIP_ENDPOINTS` — `/save/init`, `/save/add`, `/save/zip`, `/save/status`
- **Config**: `ApiConfig.saveZip` — optional config block (baseUrl, timeout)
- **Verified Services**: `CoreServices.saveZip` đã registered
- **Timeouts**: `saveZipInit: 15000`, `saveZipAdd: 15000`, `saveZip: 15000`, `saveZipStatus: 10000`

Tất cả đã export từ `@downloader/core`. Agent chỉ cần import và sử dụng.

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
- **Mobile detection**: Site có hàm `isMobileDevice()` hoặc tương đương không? Nó detect bằng cách nào?
- **Download pages**: Site có những page download nào? (single, multiple/batch, playlist, channel)
- **Tab system**: Page nào có tabs (convert/download)? Page nào là flat list?
- **Checkbox usage**: Checkbox dùng cho mục đích gì? Convert? ZIP selection? Cả hai?
- **ZIP flow hiện tại**: Desktop ZIP đã implement chưa? Dùng API nào? Button selector là gì?
- **Store/State**: Dùng reactive store (subscribe pattern) hay direct DOM? Event types nào fire khi item complete?
- **API layer**: File nào setup HTTP clients và services? Cách wire service vào app?
- **Global lock**: Có cơ chế lock buttons khi item đang download không? ZIP button có bị lock không?
- **Entry points**: Các file main cho từng page (nơi cần init mobile listener)

### Bước 2: Wire Save ZIP Service vào API layer

- Import `createSaveZipService` từ `@downloader/core`
- Tạo HTTP client cho base URL `muti-download.ytconvert.org` (hoặc reuse client có sẵn nếu cùng base URL với ZIP download)
- Tạo service instance và đưa vào app's service collection
- Thêm timeout config cho save zip operations

### Bước 3: Tạo Mobile Save ZIP Manager

Tạo module quản lý server-side ZIP session. Module cần:

**State management (per-group):**
- `taskId` — session ID từ server
- `pendingItemIds` — items đang upload (hiện animated dots trên button)
- `successItemIds` — items đã upload thành công (đếm count trên button)
- `failedItemIds` — items upload fail (để retry khi user click ZIP)
- `lastZippedItemIds` — items đã ZIP (giữ sau reset để tránh re-upload)
- `frozen` — flag ngăn thêm file khi đang tạo ZIP
- `skippedWhileFrozen` — queue items bị skip khi frozen

**Functions cần export:**
- `initMobileSaveZipListener()` — subscribe store, lắng nghe item completion
- `mobileSaveZipDownload(urls, btn, skipError, groupId)` — retry failed → wait pending → freeze → saveZip → poll → download
- `getAddedCount(groupId?)` — trả `successItemIds.size` (chỉ items thành công, không optimistic)
- `hasItemsProcessing(groupId?)` — check còn items đang xử lý không (bao gồm store processing statuses + pending API uploads, để hiện animated dots)
- `updateHeaderZipButton()` — sync ZIP button state (export để renderer gọi sau re-render)
- `wasItemAdded(itemId, groupId?)` — check item đã add vào session chưa
- `isZipping()` — check có session nào đang ZIP không

**Timing quan trọng khi update button:**
- `pendingItemIds.delete()` phải chạy TRƯỚC `updateZipButtonCount()`, không phải trong `finally` block. Nếu delete sau update → lúc check pending vẫn thấy item → dots không biến mất.

**Lưu ý về service access:**
- Save ZIP API KHÔNG cần JWT/CAPTCHA → nên gọi trực tiếp qua core service, không qua verified services wrapper
- Nếu site dùng `@downloader/core`: `coreServices.saveZip!.saveInit()`
- Nếu site dùng standalone lib: tạo service methods tương tự ytmp3.gg

### Bước 4: Tích hợp vào UI/Renderer

**Điều cần thay đổi:**

1. **ZIP button click handler**: Trên mobile, route tới `mobileSaveZipDownload()` thay vì desktop flow
2. **ZIP button count**: Trên mobile, dùng `getAddedCount()` (chỉ success) thay vì đếm selected completed items
3. **ZIP button processing dots**: Khi `hasItemsProcessing()` = true, hiện `Download ZIP (N)...` với animated dots sau dấu `)`. Dots biến mất khi tất cả items xong.
4. **ZIP button disabled**: Trên mobile, disable khi count = 0 VÀ không có items processing. Bỏ qua global download lock
5. **Checkbox visibility**: Ẩn/hiện theo quy tắc ở trên (phụ thuộc page type và tab)
6. **is-loading guard**: Thêm `is-loading` class trước khi gọi `mobileSaveZipDownload()`. Các re-render phải check `is-loading` trước khi modify button **content** (text/count). Nhưng show/hide visibility (chuyển tab) KHÔNG bị guard — ZIP button luôn ẩn trên convert tab, luôn hiện trên download tab, bất kể is-loading
7. **Sau khi ZIP thành công**: Xóa items đã ZIP khỏi store
8. **Batch resetSession**: Khi scan store cho items chưa add, batch mode phải filter `!item.groupId` để chỉ lấy ungrouped items

### Bước 5: Init listener ở entry points

- Tìm TẤT CẢ entry point files cho các download pages (batch, playlist, channel)
- Thêm `initMobileSaveZipListener()` sau khi renderer initialized
- Listener tự skip nếu không phải mobile device

### Bước 6: CSS cho mobile

- Animated dots cho progress button (`.automation-dots`) — dots nằm SAU dấu `)` của count
- Hide checkbox theo quy tắc (phụ thuộc cấu trúc DOM của site)
- ZIP button cố định width trên mobile (ví dụ 165px) để tránh nhảy layout
- ZIP button `margin-left: auto` để đẩy sang phải khi checkbox ẩn

## Lưu ý cho Agent

- KHÔNG giả định cấu trúc project giống ytmp4.gg. Mỗi site có thể khác nhau hoàn toàn.
- KHÔNG giả định site có multiple download, playlist, hay channel. Một số site chỉ có single download (single download KHÔNG cần mobile ZIP).
- KHÔNG giả định DOM selector giống nhau. Mỗi site có thể dùng class/id khác cho ZIP button, group container, checkbox.
- KHÔNG giả định store event names giống nhau. Mỗi site có thể dùng event system khác.
- Luôn research project trước, hiểu rõ cấu trúc rồi mới bắt đầu code.
- Build test sau khi hoàn thành.
