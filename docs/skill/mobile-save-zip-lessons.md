# Kinh nghiệm: Tích hợp Mobile Save ZIP cho ytmp4.gg

Tài liệu này chia sẻ kinh nghiệm thực tế khi implement Mobile Save ZIP Download cho ytmp4.gg. Các agent nên đọc để học hỏi pattern và tránh sai lầm, nhưng KHÔNG nên copy y nguyên vì mỗi site có cấu trúc khác nhau.

## 1. Thêm service vào @downloader/core

### Pattern tuân thủ chặt chẽ

Core package có pattern cố định cho mỗi service mới:

- Interface file riêng → Implementation file riêng → Export qua barrel files → Export từ index.ts
- Factory function pattern: `createSaveZipService(httpClient, config)`
- Response normalization inline: `task_id` → `taskId`, `zip_url` → `zipUrl`
- Endpoints constant riêng

### Đừng quên Verified Services layer

Core có `CoreServices` interface và `createVerifiedServices()` wrapper. Khi thêm service mới:

1. Thêm field vào `CoreServices` interface (optional)
2. Thêm methods vào `methodRegistry` trong `createVerifiedServices()`
3. Thêm namespace vào return object

Bỏ sót bước nào → TypeScript error.

### Service không cần JWT/CAPTCHA → gọi trực tiếp

Save ZIP API không cần authentication. Gọi qua verified services wrapper bị wrap trong `VerifiedResult<T>` — phải unwrap. Đơn giản hơn là gọi trực tiếp `coreServices.saveZip!.*`.

## 2. Thiết kế Mobile Save ZIP Manager

### Per-group session là bắt buộc

Mỗi playlist group cần session riêng. Dùng `Map<string, GroupSession>` với key là `groupId`. Batch items dùng key `'__default__'`.

### Count chỉ tính items thành công, dots hiện khi còn items đang xử lý

- `getAddedCount()` chỉ trả `successItemIds.size` — count chính xác, không optimistic
- Dots `...` hiện khi còn items ở processing status trong store (pending, analyzing, fetching_metadata, queued, downloading, converting) HOẶC có pending API uploads
- Dots biến mất khi **TẤT CẢ items** không còn processing

### Timing: delete pending TRƯỚC update button

`pendingItemIds.delete()` PHẢI chạy TRƯỚC `updateZipButtonCount()`. Nếu nằm trong `finally` block (chạy sau) → lúc update, item vẫn trong pending → dots không biến mất.

### Track failed items để retry

Thêm `failedItemIds` set. Mọi failure path phải add vào set này (bao gồm cả khi `taskId = null` sau init fail). Khi click ZIP:
1. Re-init session nếu `taskId` null
2. Retry tất cả failed items
3. Nếu không có items nào tracked → scan store tìm completed items → upload lại
4. Đợi pending hoàn thành
5. Rồi mới freeze + tạo ZIP

### Freeze mechanism

Khi user click ZIP → freeze → items complete sau đó bị queue. ZIP xong → reset → re-add skipped items.

### Batch resetSession phải filter ungrouped items

Batch mode scan store PHẢI filter `!item.groupId`. Không filter → lẫn items của playlist groups vào default session.

## 3. iOS Resilience

### iOS Safari drop requests khi backgrounded

Đây là nguyên nhân chính gây "items not uploaded" trên iPhone. iOS Safari kill/suspend network requests khi user chuyển tab, lock screen, hoặc nhận notification.

### saveInit retry 3 lần với backoff

`ensureSession()` retry 3 lần: attempt 1, đợi 1s, attempt 2, đợi 2s, attempt 3. Đủ cho iOS re-establish network sau khi focus lại.

### KHÔNG DROP items khi init fail

Khi `taskId = null` sau init → item PHẢI vào `failedItemIds`. Trước đó chỉ xóa khỏi `pendingItemIds` → item biến mất hoàn toàn → "No files uploaded yet" dù items hiện completed trong UI.

### Full recovery khi click ZIP

Khi user click ZIP mà không có items nào tracked:
1. Re-init session
2. Scan store tìm tất cả completed items chưa ZIP
3. Upload lại từ đầu
4. Đợi uploads xong → tạo ZIP

Kết quả: kể cả khi iOS drop mọi request, user click ZIP → hệ thống tự recover.

## 4. DOM và re-render

### innerHTML re-render phá hủy DOM references

Flow nguy hiểm:
1. `mobileSaveZipDownload(btn)` giữ reference tới button element
2. Store events fire → `updateBatchHeader()` re-render toàn bộ `headerEl.innerHTML`
3. Button cũ bị detach → `updateBtn(btn, 'Zipping...')` update node không trong DOM

Fix: `is-loading` class trên button. `updateBatchHeader()` check → skip re-render nếu `is-loading`.

### is-loading guard: protect content, KHÔNG protect visibility

Guard chỉ ngăn re-render override text/count. Show/hide theo tab KHÔNG bị guard:

- Convert tab → luôn hide ZIP button (`zipBtn.style.display = 'none'`)
- Download tab → luôn show ZIP button (`zipBtn.style.display = ''`) — đặt NGOÀI guard
- Guard chỉ bọc phần update innerHTML/disabled bên trong

Sai lầm: đặt cả show lẫn content update bên trong guard → chuyển tab convert rồi quay lại download → button không hiện lại.

### Sau re-render phải sync state

`updateBatchHeader()` render button với `getAddedCount()` có thể stale (API async chưa xong). Sau re-render → gọi `updateHeaderZipButton()` từ mobile manager để sync lại.

### `is-disabled` class vs `disabled` attribute

Phải sync CẢ HAI: `classList.toggle('is-disabled')` + `setAttribute('aria-disabled')` + `disabled` property.

## 5. Performance

### Đừng re-render trên mọi event

`item:progress` fire ~1 lần/giây/item. Với 20 items = 20 events/giây. Skip `updateBatchHeader()` cho `item:progress` và `items:settings-changed`.

## 6. Global download lock

Mobile ZIP button bỏ qua global lock (server-side, không conflict với individual downloads).

## 7. Checkbox visibility

- Page có tabs: convert tab giữ checkbox, download tab ẩn
- Page flat list: ẩn toàn bộ trên mobile
- Dùng CSS class `.is-mobile-zip` trên `<html>` element

## 8. Group container

KHÔNG xóa group khi hết items. User có thể muốn load more hoặc xem lại. Bỏ logic auto-remove group.

## 9. CSS notes

- ZIP button cố định width trên mobile, font-size 12px
- Animated dots (`.automation-dots`) đặt SAU dấu `)` — `Download ZIP (3)...`
- `margin-left: auto` đẩy button sang phải
- Responsive breakpoint không override width

## 10. Checklist verify

- [ ] Build thành công
- [ ] Desktop flow không bị ảnh hưởng
- [ ] Mobile: listener start khi load page
- [ ] Mobile: count tăng khi upload thành công (không optimistic)
- [ ] Mobile: dots `...` hiện khi còn items đang xử lý
- [ ] Mobile: dots biến mất khi TẤT CẢ items xong
- [ ] Mobile: click ZIP → retry failed → re-init if needed → scan store fallback
- [ ] Mobile: ZIP thành công → items xóa khỏi list, group giữ lại
- [ ] Mobile: ZIP button không bị lock bởi global download lock
- [ ] Mobile: ZIP button ẩn trên convert tab, hiện lại trên download tab (kể cả khi polling)
- [ ] Mobile: checkbox ẩn/hiện đúng theo context
- [ ] iOS: saveInit retry 3x, failed items tracked, full recovery on ZIP click
- [ ] Performance: item:progress không trigger heavy re-render
- [ ] Per-group: session riêng, count riêng
- [ ] Batch: resetSession chỉ scan ungrouped items
- [ ] Group: không bị xóa khi hết items
- [ ] Entry points: listener init ở TẤT CẢ download pages
