# Context Research: Expire Single vs Multiple (ytmp4.gg)

## 1) Mục đích
Tài liệu này ghi lại kết quả research code thực tế trong `ytmp4.gg`, dùng làm nguồn tham chiếu kỹ thuật khi port sang project khác.

Tài liệu chuẩn để triển khai tổng quát nằm ở:
- `docs/download-link-expiry-implementation-guide.md`

## 2) Bản đồ module đã xác nhận
1. Single downloader: có.
2. Multiple downloader (batch): có.
3. Playlist downloader: có.
4. Channel downloader: có.
5. Group/Batch ZIP download: có.
6. Gallery multifile reuse theo `expireTime` server: có.

## 3) Nguồn TTL và utility dùng chung

### 3.1 TTL config
- File: `src/environment.ts`
- API: `getExpiryTime('downloadLink')`

### 3.2 Validator
- File: `src/utils/link-validator.ts`
- Hàm chính:
  1. `isLinkExpired(completedAt)`
  2. `getRemainingTime(completedAt)`
  3. `getLinkStatus(completedAt)`

Ghi chú:
- `isLinkExpired` trả `true` nếu `completedAt` thiếu/invalid.
- TTL mặc định hiện tại từ config là `25 * 60 * 1000` (25 phút).

## 4) Map luồng Single

### 4.1 Điểm ghi `completedAt`
- File: `src/features/downloader/logic/conversion/convert-logic-v3.ts`
- Khi conversion thành công (`TaskState.SUCCESS`), task lưu:
  - `downloadUrl`
  - `filename`
  - `completedAt: Date.now()`

### 4.2 Điểm chặn khi expired
- File: `src/features/downloader/logic/conversion/convert-logic-v3.ts`
- Hàm: `handleDownloadClick(formatId)`
- Logic:
  1. Nếu thiếu `downloadUrl` => `error`.
  2. Nếu `isLinkExpired(task.completedAt)` => `expired`.
  3. Nếu hợp lệ => `triggerDownload(...)`.

### 4.3 Điểm hiển thị popup
- File: `src/features/downloader/ui-render/download-rendering.ts`
  - `handleDownloadButtonClick(...)` gọi `handleDownloadClick(...)`.
  - Nếu result = `expired` thì gọi popup `showSingleExpirePopup(...)`.
- File: `src/features/downloader/logic/conversion/conversion-controller.ts`
  - Có nhánh popup expired qua event `conversion:download`.

## 5) Map luồng Multiple / Playlist / Channel

### 5.1 Điểm khởi tạo mode
- `src/multi-downloader-main.ts`: `multipleDownloadRenderer.useBatchStrategy()`
- `src/playlist-downloader-main.ts`: `multipleDownloadRenderer.usePlaylistStrategy()`
- `src/channel-downloader-main.ts`: `multipleDownloadRenderer.usePlaylistStrategy()`

### 5.2 Điểm ghi `completedAt` per item
- File: `src/features/downloader/state/video-store.ts`
- Hàm: `setCompleted(id, downloadUrl, filename?)`
- Set:
  1. `status = 'completed'`
  2. `downloadUrl`
  3. `completedAt = Date.now()`

### 5.3 Điểm check expired và chuyển trạng thái
- File: `src/features/downloader/ui-render/multiple-download/multiple-download-renderer.ts`
- Hàm lõi:
  1. `getExpiredCompletedItems(items)`
  2. `handleExpiredItems(items, options)`

Điểm quan trọng:
1. Bộ lọc xét cả `completed` và `expired` + `completedAt` + `isLinkExpired(...)`.
2. Khi expired:
   - bỏ chọn item expired nếu đang selected;
   - `videoStore.setExpired(...)` với message hướng dẫn convert lại;
   - hiện popup `Link Expired` hoặc `Some Links Expired`.

### 5.4 Action points đã gắn check expire
Trong `multiple-download-renderer.ts`:
1. Tick checkbox item.
2. Tick checkbox group.
3. Tick checkbox master (batch).
4. Bấm download từng item (`save`).
5. Bấm download ZIP batch.
6. Bấm download ZIP group.

## 6) Map luồng Multifile Reuse (gallery)

### 6.1 Lưu expireTime từ server
- `src/features/downloader/logic/multifile-ui.ts`
- `src/features/downloader/state/multifile-state.ts`
- `src/features/downloader/state/multifile-reuse-state.ts`

### 6.2 Check expired khi reuse
- `multifile-reuse-state.ts` so sánh `Date.now()` với `recentDownload.expireTime`.
- Nếu expired, UI hiển thị expire modal và không reuse link cũ.

## 7) UI semantics đã xác nhận
- File style: `src/styles/features/multiple-downloader-v2.css`
- `status-badge.expired` dùng màu warning.
- `.multi-video-item.expired .multi-video-error` dùng màu cảnh báo, tách biệt lỗi đỏ (`error`).

## 8) Kết luận để port sang project khác
1. Đây là kiến trúc đầy đủ (single + multi + playlist + channel + multifile).
2. Khi port, bắt buộc phát hiện module tồn tại trước khi sửa.
3. Nếu project đích không có playlist/channel/multiple thì bỏ qua phần đó, không dựng logic giả.
4. Ưu tiên giữ đúng nguyên tắc: 1 TTL source, 1 validator, check tại action time.
