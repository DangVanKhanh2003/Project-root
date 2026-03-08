# Triển khai List Option (Dropdown Group) + CSS

## 1) Mục tiêu triển khai
- Giữ nguyên cấu trúc HTML gốc (không sửa template HTML thủ công).
- Dùng `select` native làm nguồn dữ liệu thật.
- Render một dropdown custom để hiển thị group `MP4 / WEBM / MKV` và các option chất lượng bên trong.
- Hỗ trợ:
  - mở/đóng menu
  - mở/đóng từng group độc lập
  - có thể đóng hết tất cả group
  - click option thì chọn giá trị, đóng menu, đồng bộ về `select` native.

## 2) Cách triển khai JS

### 2.1 Kiến trúc chung
- `select` native được giữ lại để hệ thống cũ vẫn chạy bình thường.
- `select` native bị ẩn bằng class `quality-select--native-hidden`.
- Dropdown custom được render ngay sau `select` native.

### 2.2 Nguồn chính dùng chung
- File: `src/features/downloader/ui-render/video-group-dropdown.ts`
- Hàm chính: `syncCustomVideoGroupDropdown(select, options)`
  - Render trigger + menu + group + item.
  - Quản lý state bằng `dataset`:
    - `data-menu-open` (trạng thái mở menu)
    - `data-open-groups` (các group đang mở)
  - Xử lý click:
    - trigger: mở/đóng menu
    - group header: toggle group độc lập
    - item: chọn value + dispatch `change` cho select native
  - Đóng menu khi click ngoài hoặc bấm `Escape`.

### 2.3 Các nơi áp dụng
- Main format selector:
  - `src/ui-components/format-selector/format-selector.ts`
- Stream/cut editor:
  - `src/features/strim-downloader/strim-downloader.ts`
- Multiple / Playlist / Channel (form chính):
  - `src/multi-downloader-main.ts`
  - `src/playlist-downloader-main.ts`
  - `src/channel-downloader-main.ts`
- Item trong list Playlist/Channel:
  - `src/features/downloader/ui-render/multiple-download/playlist-strategy.ts`

### 2.4 Lưu ý giá trị quality
- Có 2 kiểu value:
  - `dash`: `mp4-720`, `webm-1080`, `mkv-2160`
  - `p`: `720p`, `webm-1080p`, `mkv-2160p`
- Helper hỗ trợ cả 2 mode để tương thích từng màn hình.

## 3) Cách triển khai CSS

### 3.1 Style dùng chung
- File: `src/styles/components/format-selector.css`
- Class chính:
  - `.video-group-dropdown`
  - `.video-group-trigger`
  - `.video-group-menu`
  - `.video-group-header`
  - `.video-group-item`
- Hiệu ứng:
  - mũi tên group xoay khi mở (`.video-group-section.is-open`)
  - hover highlight cho item
  - selected state cho item

### 3.2 Style cho Multiple/Playlist/Channel
- File: `src/styles/features/multiple-downloader-v2.css`
- Override theo ngữ cảnh:
  - `.multi-video-group-dropdown`
  - `.item-video-group-dropdown`
- Mục đích:
  - chỉnh kích thước trigger/menu cho form chính và item trong list
  - ẩn hiện đúng theo tab MP3/MP4.

### 3.3 Style cho Stream/Cut
- File: `src/styles/features/strim-downloader.css`
- Override theo ngữ cảnh:
  - z-index menu cao hơn
  - chiều cao menu lớn hơn
  - đảm bảo wrapper cho phép hiển thị menu đầy đủ (`overflow: visible`).

## 4) Trạng thái giao diện hiện tại (đã tinh chỉnh)
- Header group: đậm hơn item.
- Item trong group: màu xám hơn, không bold.
- Header và item đã tách màu nền để không bị giống nhau.

## 5) Tóm tắt kỹ thuật
- Không phá logic cũ vì vẫn dựa trên `select` native.
- Dropdown custom chỉ là lớp UI phía trên.
- Dễ mở rộng thêm group/quality sau này vì render theo danh sách group + resolution.
