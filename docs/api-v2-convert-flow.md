# YouTube Download API V2 - Convert Flow Documentation

## Tổng Quan

Tài liệu này mô tả chi tiết luồng convert/download YouTube sử dụng API V2 trong project ytmp3-clone-darkmode-3.

---

## API Endpoints

### Base URL

https://hub.y2mp3.co

### Danh sách Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | / | Bắt đầu download, trả về stream URL hoặc static URL |
| GET | /api/download/progress/{cacheId} | Lấy tiến trình convert real-time |

---

## Luồng Xử Lý Chi Tiết

### Bước 1: User Input

Người dùng thực hiện:
- Nhập YouTube URL vào ô input
- Chọn định dạng: MP4 (video) hoặc MP3 (audio)
- Chọn chất lượng: 1080p, 720p, 480p cho video hoặc 320kbps, 256kbps, 128kbps cho audio
- Nhấn nút Download

### Bước 2: Build Request

Hệ thống xây dựng request gửi đến API với các thông tin:

**Thông tin bắt buộc:**
- URL của video YouTube
- Chế độ download: video hoặc audio
- Tên thương hiệu: y2matepro

**Thông tin tùy chọn cho Video:**
- Chất lượng video: 1080, 720, 480, 360, 240, 144
- Container: mp4 hoặc webm
- Codec: h264, av1, vp9

**Thông tin tùy chọn cho Audio:**
- Bitrate: 64, 128, 192, 256, 320
- Định dạng: mp3, m4a, ogg, wav, opus

### Bước 3: Gọi API Download

Hệ thống gửi POST request đến API endpoint chính. Timeout cho request này là 20 giây.

API sẽ trả về một trong hai loại response:

**Response loại Static:**
- Status: static
- Đây là file đã được cache sẵn trên server
- Có thể download ngay lập tức
- Chứa: URL download trực tiếp, tên file, kích thước file

**Response loại Stream:**
- Status: stream
- File cần được xử lý trên server
- Cần polling để theo dõi tiến trình
- Chứa: URL stream, tên file, URL để poll progress

### Bước 4: Xác Định Route

Sau khi nhận response, hệ thống xác định strategy xử lý dựa trên:
- Loại response (static hay stream)
- Platform của người dùng (iOS, Windows, Android, Mac, Linux)
- Định dạng file (video hay audio)
- Kích thước file

**Các loại Route:**

| Route | Điều kiện | Cách xử lý |
|-------|-----------|------------|
| STATIC_DIRECT | Response là static | Download ngay, không cần đợi |
| IOS_RAM | iOS + audio + kích thước ≤ 150MB | Download vào bộ nhớ RAM dưới dạng Blob |
| IOS_POLLING | iOS + video hoặc audio > 150MB | Polling tiến trình, đợi server xử lý xong |
| WINDOWS_MP4_POLLING | Windows + định dạng MP4 | Polling tiến trình, đợi server xử lý xong |
| OTHER_STREAM | Android, Mac, Linux hoặc file > 500MB | Download stream trực tiếp hoặc polling |

### Bước 5: Thực Thi Strategy

**Với STATIC_DIRECT:**
- Hiển thị nút download ngay
- Khi user click, trigger download từ URL có sẵn

**Với IOS_RAM:**
- Download toàn bộ file vào RAM của trình duyệt
- Hiển thị tiến trình download
- Khi hoàn tất, lưu thành Blob
- User click download sẽ tạo file từ Blob

**Với các Polling Routes (IOS_POLLING, WINDOWS_MP4_POLLING):**
- Bắt đầu polling API progress
- Cập nhật UI theo tiến trình
- Đợi đến khi nhận được mergedUrl
- Hiển thị nút download

**Với OTHER_STREAM:**
- Trigger download trực tiếp từ stream URL
- Trình duyệt tự xử lý việc download

### Bước 6: Polling Progress (cho các Polling Routes)

**Cấu hình polling:**
- Interval: mỗi 1 giây
- Jitter: thêm 0-500ms ngẫu nhiên để tránh tập trung request
- Thời gian tối đa: 10 phút
- Số lượng polling đồng thời tối đa: 5

**Response từ Progress API chứa:**
- cacheId: ID để định danh request
- videoProgress: tiến trình xử lý video (0-100)
- audioProgress: tiến trình xử lý audio (0-100)
- status: trạng thái hiện tại (processing, merging, completed, error)
- mergedUrl: URL download cuối cùng (chỉ có khi completed)

**Cách tính tiến trình hiển thị:**

Với định dạng Video:
- Tiến trình = videoProgress × 60% + audioProgress × 40%

Với định dạng Audio:
- Tiến trình = audioProgress

Tiến trình sau đó được map vào khoảng 10% đến 95% để dành chỗ cho:
- 0-10%: Giai đoạn extraction ban đầu
- 95-100%: Giai đoạn merging cuối cùng

**Các quy tắc hiển thị tiến trình:**
1. Không bao giờ đi lùi: thanh progress chỉ tăng, không giảm
2. Fake progress khi bị stuck: nếu API không cập nhật, thêm 1% mỗi 2.7-4.5 giây, nhưng không vượt quá 90%
3. Xoay vòng status text: khi stuck ở ≥90%, thay đổi text mỗi 2 giây (Merging..., Almost there..., Finalizing...)

### Bước 7: Hoàn Thành

Khi nhận được mergedUrl từ API:
1. Dừng polling
2. Cập nhật state thành SUCCESS
3. Cache URL download (cho YouTube: 25 phút)
4. Hiển thị nút Download
5. Khi user click, trigger download với URL cuối cùng

---

## Timeout và Retry

### Cấu hình Timeout

| Operation | Timeout |
|-----------|---------|
| API download ban đầu | 20 giây |
| Search API | 20 giây |
| Mỗi request polling | 950ms |
| Download vào RAM | 30 phút |
| Queue API | 5 giây |

### Cấu hình Retry

**Giai đoạn Extraction:**
- Số lần retry tối đa: 3
- Delay ban đầu: 1 giây
- Delay tối đa: 5 giây
- Sử dụng exponential backoff (delay nhân đôi mỗi lần retry)

**Giai đoạn Polling:**
- Số lần retry tối đa: 5
- Lỗi timeout không tính vào số lần retry
- Lỗi network sẽ retry

---

## Quản Lý State

### Các trạng thái của Task

| State | Mô tả |
|-------|-------|
| IDLE | Trạng thái ban đầu, chưa làm gì |
| EXTRACTING | Đang gọi API download |
| PROCESSING | Server đang xử lý |
| POLLING | Đang poll tiến trình |
| DOWNLOADING | Đang download vào RAM (iOS) |
| SUCCESS | Hoàn thành, sẵn sàng download |
| FAILED | Có lỗi xảy ra |
| CANCELED | User hủy bỏ |

### Luồng chuyển đổi State

IDLE → EXTRACTING → PROCESSING → POLLING → SUCCESS

Từ bất kỳ state nào có thể chuyển sang FAILED hoặc CANCELED

---

## Caching

### YouTube Link Expiry

- Link download hết hạn sau 25 phút
- Được cache trong videoDetail.formats
- Kiểm tra trước khi download, nếu hết hạn sẽ hiển thị thông báo

### Chiến lược Cache

**YouTube:**
- Cache URL trong 25 phút
- Có thể tái sử dụng nếu chưa hết hạn

**Social Media (Facebook, TikTok, Instagram, X):**
- Xóa cache khi đóng modal
- Không tái sử dụng

---

## Xử Lý Lỗi

### Các mã lỗi phổ biến

| Mã lỗi | Mô tả |
|--------|-------|
| error.api.invalid_body | Tham số request không hợp lệ |
| error.api.fetch.critical.core | Không thể lấy video |
| error.api.rate_limit | Vượt quá giới hạn request |
| error.api.video_unavailable | Video không khả dụng |

### Xử lý khi có lỗi

1. Cập nhật state thành FAILED
2. Hiển thị thông báo lỗi cho user
3. Cho phép user thử lại

---

## Các File Liên Quan

| File | Mô tả |
|------|-------|
| src/api/index.ts | Cấu hình API, HTTP clients |
| src/environment.ts | URLs API, cấu hình timeout |
| src/features/downloader/logic/input-form.ts | Xử lý form, trigger auto-download |
| src/features/downloader/logic/conversion/convert-logic-v2.ts | Điều phối quá trình conversion |
| src/features/downloader/logic/conversion/types.ts | Định nghĩa types, logic routing |
| src/features/downloader/logic/conversion/polling-progress-mapper.ts | Tính toán progress |
| src/features/downloader/logic/conversion/retry-helper.ts | Logic retry |
| src/features/downloader/logic/conversion/application/strategies/ | Các strategy implementations |
| packages/core/src/services/v2/implementations/youtube-download.service.ts | Service gọi API V2 |

---

## Tóm Tắt Luồng

1. User chọn format và quality
2. Hệ thống build request và gửi đến API V2
3. Nếu nhận static response: download ngay
4. Nếu nhận stream response: xác định route dựa trên platform/format/size
5. Với polling routes: poll progress mỗi giây, cập nhật UI
6. Khi có mergedUrl: hiển thị nút download
7. User click: trigger download với URL cuối cùng
