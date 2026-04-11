# Prompt Chuẩn: Port/Fix Expire Link (Single vs Multiple)

Sử dụng prompt này khi giao cho AI khác. Đính kèm 2 tài liệu:
1. `docs/download-link-expiry-implementation-guide.md`
2. `docs/expire-single-vs-multiple-context.md`

---

Bạn là một Senior TypeScript Engineer.

Nhiệm vụ: implement hoặc sửa logic hết hạn link tải (expire) cho project downloader đích.

## Yêu cầu bắt buộc trước khi code
1. Đọc toàn bộ 2 tài liệu đính kèm.
2. Scan codebase để phát hiện module thực sự tồn tại.
3. Chỉ sửa các module có thật, không tự tạo module không tồn tại.

## Mục tiêu kỹ thuật
Triển khai đúng expire cho các luồng đang có trong project đích, với phân tách rõ:
1. Single download flow.
2. Multi-item flow (nếu có): multiple, playlist, channel, group, ZIP.
3. Multifile reuse theo `expireTime` server (nếu có).

Lưu ý quan trọng: không phải project nào cũng có multiple/playlist/channel.

## Quy trình làm việc bắt buộc
1. Báo cáo module detection trước khi sửa:
   - single conversion/download
   - multiple list
   - playlist
   - channel
   - ZIP group/batch
   - multifile reuse (server expireTime)
2. Lập kế hoạch sửa ngắn, theo đúng module đã phát hiện.
3. Implement code.
4. Chạy build/test khả dụng.
5. Báo cáo file đã sửa + lý do từng file.

## Rule triển khai
1. Dùng 1 nguồn TTL config cho local download link (ví dụ `downloadLink`).
2. Dùng 1 utility validator dùng chung (ví dụ `isLinkExpired(completedAt)`).
3. Không hardcode TTL trong handler/UI.
4. Phải lưu `completedAt` khi conversion thành công.
5. Phải re-check expire tại thời điểm user thao tác tải/chọn.
6. Expire là trạng thái riêng `expired`, không dùng chung với `error`.
7. Trong multi flow, item expired phải:
   - bị chặn action;
   - bị bỏ chọn nếu đang chọn;
   - hiện cảnh báo cho user.
8. Nếu project có `expireTime` từ server cho multifile reuse, giữ nguyên logic server-time.
9. Không implement playlist/channel nếu project không có các module đó.

## Action points bắt buộc check expire (chỉ áp dụng nếu module tồn tại)
1. Click Download (single).
2. Click Download từng item (multi).
3. Click Download ZIP group/batch.
4. Tick item/group/master checkbox (khi liên quan đến downloadable state).

## Đầu ra bắt buộc của bạn
1. Module detection summary: có gì/không có gì.
2. Danh sách file thay đổi + before/after behavior.
3. Kết quả verify:
   - output build/test
   - test tay với TTL ngắn tạm thời ở local, rồi trả về mặc định `25 phút`
4. Risk còn lại hoặc giả định đang dùng.

## Tiêu chí chấp nhận
1. Link hết hạn luôn bị chặn tại action time.
2. Link còn hạn tải bình thường.
3. Single không tự bật popup khi user chưa bấm.
4. Multi không giữ item expired trong selection một cách im lặng.
5. Không còn TTL hardcode rải rác.
