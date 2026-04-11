# Nhiệm Vụ Bạn Đã Giao (Chi Tiết)

## 1. Mục tiêu chính
- Nâng cấp dropdown chọn format từ 1 cấp thành 2 cấp, nhưng vẫn chỉ dùng **1 dropdown duy nhất**.
- Không thay đổi cấu trúc HTML sẵn có (giữ đúng toggle button, quality dropdown và CSS cũ), chỉ sửa phần template/JS/TS để đổi dữ liệu và hành vi danh sách.

## 2. Quy tắc dropdown video
- Có các nhóm định dạng video: `MP4`, `WEBM`, `MKV`.
- Mỗi nhóm có đủ quality: `144p`, `360p`, `480p`, `720p`, `1080p`, `2K`, `4K`.
- Khi hiển thị option phải rõ ràng theo dạng có khoảng trắng quanh dấu gạch ngang:
  - `mp4 - 720p`
  - `webm - 4K`
  - `mkv - 144p`
- Theo yêu cầu mới, nhóm `WEBM` và `MKV` mặc định đóng khi mở danh sách.

## 3. Quy tắc dropdown audio
- `MP3` có các mức: `320kbps`, `192kbps`, `128kbps`, `64kbps`.
- Non-mp3 chỉ gồm: `wav`, `m4a`, `ogg`, `opus`, `flac`.
- Non-mp3 không cho chọn quality riêng, bitrate cố định là `128kbps`.

## 4. Quy tắc limit 2K/4K không có license key
- Giới hạn phải tính theo **độ phân giải** (2K/4K), không phụ thuộc container.
- Nghĩa là nếu đã hết lượt `4K` với `mp4`, thì `webm - 4K` và `mkv - 4K` cũng bị chặn tương tự khi chưa nhập license key.

## 5. Phạm vi áp dụng
- Form chính (single downloader).
- Form stream/cutter.
- Trang multi downloader.
- Trang playlist downloader.
- Trang channel downloader.
- Danh sách item trong playlist/channel/multi.

## 6. Đồng bộ trạng thái
- Đồng bộ đúng giữa UI, state, localStorage và URL/deep-link cho format + quality mới.

---

# Tóm Tắt Ngắn Gọn Những Gì Mình Đã Làm

- Cập nhật toàn bộ option video theo dạng nhóm `MP4/WEBM/MKV` và đủ mức `144p -> 4K`.
- Chuẩn hóa label option/video hiển thị theo format mới: `format - quality`.
- Cập nhật logic audio:
  - `MP3`: giữ lựa chọn bitrate.
  - `wav/m4a/ogg/opus/flac`: cố định `128kbps`, không cho chọn quality riêng.
- Sửa parser và mapping giá trị quality/format ở các luồng single, stream, multi, playlist, channel.
- Sửa hiển thị settings trong list item về dạng `FORMAT - QUALITY` (có khoảng trắng quanh `-`).
- Sửa logic check limit 2K/4K theo resolution dùng chung cho `mp4/webm/mkv`.
- Sửa logic record usage sau khi tải thành công để 4K/2K được cộng đúng theo độ phân giải.
- Build kiểm tra thành công bằng `npm run build`.
