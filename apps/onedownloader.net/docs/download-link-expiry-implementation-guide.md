# Bộ tài liệu chuẩn: Xử lý Expire Link Download (Single vs Multiple)

> Tài liệu này là bản chuẩn tiếng Việt có dấu, đã tổng hợp từ:
> 1. Tài liệu cũ trong repo (`download-link-expiry-implementation-guide.md`).
> 2. Tài liệu context/prompt mới.
> 3. Research code thực tế trong project `ytmp4.gg`.

## 1) Mục tiêu
Chuẩn hóa toàn bộ logic hết hạn link tải (expire) để AI hoặc dev có thể triển khai đúng trên nhiều project downloader khác nhau.

Trọng tâm:
1. Luồng `single` (tải 1 video).
2. Luồng `multiple` (nếu có): multi/playlist/channel/group/ZIP.
3. Luồng `multifile` dùng `expireTime` từ server (nếu có).

## 2) Nguyên tắc bắt buộc
1. Chỉ dùng **một nguồn TTL** cho link tải local (ví dụ key `downloadLink`).
2. Chỉ dùng **một utility kiểm tra expire** dùng chung toàn dự án.
3. Không hardcode TTL trong UI, handler, service.
4. Luôn re-check expire tại thời điểm user bấm/tick hành động tải.
5. Expire phải là trạng thái riêng (`expired`), không trộn với lỗi chung (`error`).

## 3) Kết luận từ research `ytmp4.gg`

### 3.1 Nguồn TTL và utility
1. TTL local lấy từ `getExpiryTime('downloadLink')` trong `src/environment.ts`.
2. Utility dùng chung ở `src/utils/link-validator.ts`:
   - `isLinkExpired(completedAt)`
   - `getRemainingTime(completedAt)`
   - `getLinkStatus(completedAt)`

Lưu ý quan trọng:
1. Giá trị mặc định hiện tại trong code là `25 * 60 * 1000` (25 phút).
2. Comment đi kèm có thể sai nghĩa. Khi audit phải tin vào **giá trị tính toán thực**, không tin comment.

### 3.2 Luồng Single
File chính:
1. `src/features/downloader/logic/conversion/convert-logic-v3.ts`
2. `src/features/downloader/ui-render/download-rendering.ts`
3. `src/features/downloader/logic/conversion/conversion-controller.ts`

Hành vi chuẩn:
1. Khi convert thành công: lưu `completedAt` vào conversion task.
2. Khi user bấm `Download`: gọi `handleDownloadClick(...)`.
3. Nếu `isLinkExpired(completedAt)` là true: trả `expired`, hiện popup, chặn tải.
4. Nếu còn hạn: tải file bình thường.

### 3.3 Luồng Multiple/Playlist/Channel
File chính:
1. `src/features/downloader/ui-render/multiple-download/multiple-download-renderer.ts`
2. `src/features/downloader/state/video-store.ts`
3. `src/features/downloader/logic/multiple-download/services/multi-download-service.ts`
4. Entry points:
   - `src/multi-downloader-main.ts`
   - `src/playlist-downloader-main.ts`
   - `src/channel-downloader-main.ts`

Hành vi chuẩn:
1. Mỗi item lưu `completedAt` tại `videoStore.setCompleted(...)`.
2. Trước mọi action dùng link completed đều phải check expire:
   - Tick checkbox item.
   - Tick checkbox group/all.
   - Bấm tải từng item.
   - Bấm ZIP theo group.
   - Bấm ZIP theo batch.
3. Item hết hạn phải:
   - chuyển trạng thái `expired`;
   - bỏ chọn nếu đang chọn;
   - hiện popup cảnh báo;
   - chặn action hiện tại.
4. Bộ lọc expire phải bao gồm cả item `completed` và item đã `expired` để không lọt case click lặp.

### 3.4 Luồng Multifile Reuse (tùy project)
File chính:
1. `src/features/downloader/ui-render/gallery-renderer.ts`
2. `src/features/downloader/logic/multifile-ui.ts`
3. `src/features/downloader/state/multifile-reuse-state.ts`

Hành vi chuẩn:
1. Dùng `expireTime` từ server để quyết định còn hạn hay hết hạn.
2. Nếu hết hạn: popup expire + bắt đầu session mới/retry.
3. Không ép luồng này về `completedAt` local nếu kiến trúc đang chuẩn theo server time.

## 4) Ma trận check expire theo hành động
Chỉ áp dụng cho module nào thực sự tồn tại trong project đích.

| Luồng | Hành động | Bắt buộc check expire | Kỳ vọng khi expired |
|---|---|---:|---|
| Single | Bấm Download | Có | Popup + chặn tải |
| Single | Idle (không thao tác) | Không | Không tự bật popup |
| Multiple (nếu có) | Tick item | Có | Bỏ tick + popup |
| Multiple (nếu có) | Tick group/all | Có | Không chọn im lặng item expired |
| Multiple (nếu có) | Bấm tải item | Có | Popup + chặn item |
| Multiple (nếu có) | Bấm ZIP group/batch | Có | Popup + loại expired khỏi selection |
| Multifile reuse (nếu có) | Reuse link cũ | Có (`expireTime`) | Popup + start session mới |

## 5) Quy trình áp dụng cho project bất kỳ
1. Scan module hiện có: single, multiple, playlist, channel, ZIP, multifile reuse.
2. Dựng 1 utility expire dùng chung toàn project.
3. Chuẩn hóa dữ liệu cần có:
   - `downloadUrl`
   - `completedAt` (cho local link)
   - `status` có `expired`
4. Cắm check expire vào toàn bộ action point có tải link.
5. Chuẩn hóa UI expired (badge/message/popup) tách biệt error.
6. Chạy build + test nhanh bằng TTL ngắn.

## 6) Checklist kiểm thử nhanh
1. Giữ TTL mặc định ở `25 phút` cho môi trường chạy thật.
2. Khi test local, có thể tạm giảm TTL để test nhanh, sau đó trả về `25 phút`.
3. Convert xong, chờ quá TTL.
4. Single:
   - không popup khi chưa bấm;
   - bấm Download thì popup xuất hiện.
5. Multiple (nếu có):
   - tick item expired -> popup;
   - tải item expired -> popup;
   - ZIP có item expired -> popup + block đúng.
6. Kiểm tra UI:
   - `expired` hiển thị trạng thái cảnh báo;
   - `error` giữ style lỗi thật.

## 7) Lỗi thường gặp
1. TTL bị copy ra nhiều file khác nhau.
2. Chỉ check expire lúc convert xong, quên check lúc user bấm tải.
3. Chỉ lọc item `completed`, bỏ sót item đã `expired`.
4. Dùng `error` thay cho `expired` làm sai semantics và UX.
5. Áp dụng logic playlist/channel cho project không có các module này.

## 8) Tiêu chí nghiệm thu
1. Link hết hạn luôn bị chặn tại thời điểm user thao tác.
2. Link còn hạn tải bình thường.
3. Single không tự bật popup khi user chưa thao tác.
4. Multiple không giữ item hết hạn trong selection một cách im lặng.
5. Không còn hardcoded TTL rải rác trong code.

## 9) Tài liệu đi kèm trong bộ chuẩn
1. `docs/expire-single-vs-multiple-context.md`: bản đồ research chi tiết theo file thực tế `ytmp4.gg`.
2. `docs/prompt-expire-single-vs-multiple-port.md`: prompt tiếng Việt để giao cho AI khác triển khai trên project đích.
