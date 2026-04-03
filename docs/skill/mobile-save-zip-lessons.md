# Kinh nghiệm: Tích hợp Mobile Save ZIP cho ytmp4.gg

Tài liệu này chia sẻ kinh nghiệm thực tế khi implement Mobile Save ZIP Download cho ytmp4.gg. Các agent nên đọc để học hỏi pattern và tránh sai lầm, nhưng KHÔNG nên copy y nguyên vì mỗi site có cấu trúc khác nhau.

## 1. Thêm service vào @downloader/core

### Pattern tuân thủ chặt chẽ

Core package có pattern cố định cho mỗi service mới. Khi thêm Save ZIP service, đã tuân thủ đúng:

- Interface file riêng → Implementation file riêng → Export qua barrel files → Export từ index.ts
- Factory function pattern: `createSaveZipService(httpClient, config)`
- Response normalization inline: `task_id` → `taskId`, `zip_url` → `zipUrl`
- Endpoints constant riêng

### Đừng quên Verified Services layer

Core có `CoreServices` interface và `createVerifiedServices()` wrapper. Khi thêm service mới:

1. Thêm field vào `CoreServices` interface (optional, vì không phải site nào cũng dùng)
2. Thêm methods vào `methodRegistry` trong `createVerifiedServices()`
3. Thêm namespace vào return object

Nếu bỏ sót bước nào, `api.saveZip` sẽ không tồn tại trên type level → TypeScript error.

### Service không cần JWT/CAPTCHA → gọi trực tiếp

Save ZIP API không yêu cầu authentication. Nếu gọi qua `api.saveZip.*` (verified services), response bị wrap trong `VerifiedResult<T>` — phải unwrap qua `.data`. Đơn giản hơn là gọi trực tiếp qua `coreServices.saveZip!.*` để nhận raw response.

Bài học: không phải mọi service đều cần đi qua verified services. Chọn đường ngắn nhất phù hợp.

## 2. Thiết kế Mobile Save ZIP Manager

### Per-group session là bắt buộc

Mỗi playlist group cần session riêng. Nếu dùng 1 session chung, user click ZIP ở group A sẽ ZIP luôn files của group B.

Dùng `Map<string, GroupSession>` với key là `groupId`. Batch items (không có group) dùng key `'__default__'`.

### Count chỉ tính items thành công, dots hiện khi còn items đang xử lý

Ban đầu dùng optimistic count (pending + success), nhưng gây confusing khi API fail — count cao hơn thực tế. Sau nhiều iteration, approach cuối cùng:

- `getAddedCount()` chỉ trả `successItemIds.size` — count chính xác
- Dots `...` hiện khi còn items đang xử lý: scan store cho processing statuses (pending, analyzing, fetching_metadata, queued, downloading, converting) HOẶC có pending API uploads
- Dots biến mất khi **TẤT CẢ items** không còn processing — không chỉ khi pending uploads xong

### Timing: delete pending TRƯỚC update button

Bug khó debug: dots không biến mất dù tất cả items đã upload xong. Nguyên nhân: `pendingItemIds.delete()` nằm trong `finally` block, chạy SAU `updateZipButtonCount()`. Lúc update, item vẫn trong pending set → dots vẫn hiện.

Fix: move `pendingItemIds.delete(itemId)` lên TRƯỚC `updateZipButtonCount()`, đặt ngay sau khi biết success/fail, không dùng `finally`.

### Track failed items để retry khi click ZIP

Nếu `saveAddFile` fail (network error, server error), item biến mất khỏi tracking (không pending, không success) → user thấy count thấp hơn expected → click ZIP → "No files uploaded yet".

Fix: thêm `failedItemIds` set. Khi click ZIP:
1. Retry tất cả failed items trước
2. Đợi pending uploads hoàn thành (max 30s)
3. Rồi mới freeze + tạo ZIP

### Freeze mechanism ngăn race condition

Khi user click ZIP → session freeze → items complete sau đó bị queue vào `skippedWhileFrozen`. Sau khi ZIP xong và reset session → tự động re-add các items bị skip.

Không có freeze, items mới complete sẽ add vào session đang tạo ZIP → server behavior không xác định.

### Batch resetSession phải filter ungrouped items

Bug: `resetSession()` khi batch mode (không có groupId) scan `videoStore.getAllItems()` → trả về items từ TẤT CẢ groups → cố add items của playlist group vào default session → server reject.

Fix: batch mode phải filter `videoStore.getAllItems().filter(i => !i.groupId)`.

## 3. Bài học về DOM và re-render

### innerHTML re-render phá hủy DOM references

Đây là bug nghiêm trọng nhất gặp phải. Flow:

1. User click ZIP → `mobileSaveZipDownload(btn)` nhận reference tới button DOM element
2. Trong lúc polling, store events fire (items complete, progress update)
3. Store subscription → `updateBatchHeader()` → **re-render toàn bộ `headerEl.innerHTML`**
4. Button DOM element cũ bị **detach khỏi DOM**, thay bằng element mới
5. `updateBtn(btn, 'Zipping 3/5...')` update element đã detach → user không thấy gì

**Giải pháp đã dùng**: Thêm `is-loading` class vào button trước khi bắt đầu. Trong `updateBatchHeader()`, check nếu button có `is-loading` → skip toàn bộ re-render. Khi ZIP xong → remove `is-loading` → re-render lại bình thường.

Bài học: khi có function chạy async lâu (polling) và giữ DOM reference, PHẢI bảo vệ element khỏi bị re-render bởi các handler khác.

### is-loading guard: chỉ protect content, không protect visibility

`is-loading` guard ngăn re-render override button text khi đang polling. Nhưng KHÔNG nên ngăn show/hide theo tab:

- Convert tab → luôn hide ZIP button (kể cả khi đang polling)
- Download tab → luôn show ZIP button

Tách `zipBtn.style.display = ''` (show) ra **ngoài** `is-loading` guard. Chỉ đặt update content (innerHTML, disabled state) bên trong guard.

Sai lầm trước đó: đặt cả show lẫn content update bên trong guard → chuyển tab convert rồi quay lại download → button không hiện lại.

### Sau re-render phải sync lại state từ source of truth

`updateBatchHeader()` render ZIP button với count từ `getAddedCount()`. Nhưng `getAddedCount()` có thể trả về giá trị cũ nếu API async chưa xong. Sau khi re-render, gọi `updateHeaderZipButton()` (từ mobile manager) để sync lại count/disabled/dots state từ session manager — source of truth cho mobile count.

### `is-disabled` class vs `disabled` attribute là hai thứ khác nhau

CSS dùng `.is-disabled` class để style. Một số chỗ chỉ set `disabled` attribute mà quên toggle `.is-disabled` class → button trông enabled nhưng thực ra disabled, hoặc ngược lại.

Khi update button state, phải sync CẢ HAI: `classList.toggle('is-disabled')` + `setAttribute('aria-disabled')` + `disabled` property.

## 4. Performance: Đừng re-render trên mọi event

### Vấn đề

Store subscription handler chạy trên MỌI store event. Trong đó `item:progress` fire rất thường xuyên (~1 lần/giây/item đang download). Với playlist 20 items = ~20 events/giây.

Ban đầu, `updateBatchHeader()` (full innerHTML re-render) chạy cho mọi event → 20 lần re-render header/giây → lag rõ rệt.

### Giải pháp

Filter event types: chỉ chạy `updateBatchHeader()` cho events thực sự thay đổi header content:

- `item:added`, `item:removed` — thay đổi item count
- `item:updated` — thay đổi status (pending → completed)
- `items:selection-changed` — thay đổi selected count
- `items:cleared`, `group:updated` — thay đổi structure

Skip cho:

- `item:progress` — chỉ thay đổi progress bar, không ảnh hưởng header
- `items:settings-changed` — chỉ thay đổi format/quality dropdowns

## 5. Global download lock và mobile ZIP

### Vấn đề

Một số site có `isGlobalDownloadLocked` flag — lock TẤT CẢ download/ZIP buttons khi một individual item đang download. Logic này hợp lý cho desktop (tránh concurrent downloads), nhưng trên mobile, ZIP là server-side và không conflict với individual downloads.

### Giải pháp

ZIP button disabled check trên mobile bỏ qua global lock. Nếu site có global lock mechanism, cần tương tự exempt mobile ZIP button.

## 6. Checkbox visibility theo context

### Nguyên tắc

Checkbox phục vụ cho 2 tác vụ **ĐỘC LẬP**:
1. Chọn items để **convert** (manual action)
2. Chọn items để **ZIP download** (desktop only)

Trên mobile, ZIP auto-upload → checkbox cho mục đích (2) không cần. Nhưng checkbox cho mục đích (1) vẫn cần nếu page có batch convert.

### Cách xác định cho mỗi site

- Nếu page có tabs (convert/download) riêng biệt: convert tab giữ checkbox, download tab ẩn checkbox
- Nếu page là flat list và checkbox CHỈ dùng cho ZIP selection: ẩn toàn bộ trên mobile
- Nếu page là flat list và checkbox dùng cho CẢ convert lẫn ZIP: cần phân tích kỹ hơn — có thể ẩn checkbox chỉ cho items ở download status

Đây là phần phụ thuộc nhiều nhất vào cấu trúc cụ thể của từng site. Không có giải pháp one-size-fits-all.

### Cách hide checkbox bằng CSS

Dùng CSS class trên `<html>` element (e.g., `.is-mobile-zip`) thay vì JS per-element hide. Ưu điểm:

- Một class control tất cả
- Dễ target theo DOM structure: items trong group vs items ngoài group
- Không cần chạy JS mỗi khi item mới xuất hiện

## 7. CSS notes

- ZIP button cố định width trên mobile (ví dụ 165px) để tránh nhảy layout khi count/dots thay đổi
- Animated dots (`.automation-dots`) đặt SAU dấu `)` — `Download ZIP (3)...`
- `margin-left: auto` trên button và button container để đẩy sang phải khi checkbox ẩn
- Đảm bảo responsive breakpoint không override `min-width` thành `unset`

## 8. Checklist verify sau khi implement

- [ ] Build thành công
- [ ] Desktop flow không bị ảnh hưởng (ZIP button vẫn hoạt động như cũ)
- [ ] Mobile: listener start khi load page (check console log)
- [ ] Mobile: items complete → count trên ZIP button tăng khi upload thành công
- [ ] Mobile: khi còn items đang xử lý → button hiện animated dots `...` sau count
- [ ] Mobile: khi TẤT CẢ items xong (completed/error/cancelled/ready) → dots biến mất
- [ ] Mobile: click ZIP → retry failed items → wait pending → button text đổi sang progress
- [ ] Mobile: ZIP thành công → download trigger → items bị xóa khỏi list
- [ ] Mobile: ZIP button không bị lock bởi global download lock
- [ ] Mobile: ZIP button ẩn trên convert tab, hiện lại khi quay về download tab (kể cả khi đang polling)
- [ ] Mobile: checkbox ẩn/hiện đúng theo context (tab-based vs flat list)
- [ ] Performance: không lag khi nhiều items đang download
- [ ] Per-group: mỗi group có session riêng, count riêng
- [ ] Batch mode: resetSession chỉ scan ungrouped items
- [ ] Entry points: listener init ở TẤT CẢ download pages có multiple items
