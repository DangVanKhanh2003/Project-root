# Kế hoạch tích hợp Suggest + Search Result List vào Ezconv

## 1. Mục tiêu
- Giữ nguyên flow hiện tại của `urlsInput` (multi-mode convert).
- Bổ sung flow mới cho:
  - gợi ý từ khóa (`suggest`)
  - danh sách kết quả tìm kiếm (`list item result`)
- Mỗi item kết quả có checkbox:
  - tick: thêm URL video vào `urlsInput`
  - untick: loại URL video khỏi `urlsInput`

## 2. Phạm vi
- Không thay đổi logic convert lõi trong `multi-download-service`.
- Không thay đổi mode logic hiện có: `batch`, `playlist`, `trim`.
- Chỉ thêm tầng UI + controller + wiring cho keyword search/suggest.

## 3. Thiết kế tích hợp

### 3.1 Kiến trúc song song
- Flow A (đang có): `urlsInput` -> `addUrlsBtn` -> convert.
- Flow B (thêm mới): `videoUrl` (keyword) -> `suggest` + `searchV2` -> click item -> append vào `urlsInput`.

### 3.2 Reuse thành phần sẵn có
- API:
  - `api.getSuggestions({ q })`
  - `api.searchV2(keyword, { limit, pageToken })`
- State:
  - `suggestions-state.ts`
  - `search-results-state.ts`
  - `state-manager.ts` (các field query/suggestions/results/pagination đã có)
- UI package:
  - `SuggestionDropdown` từ `@downloader/ui-components`
  - CSS search/suggestion đã có import trong `src/styles/index.css`

## 4. Kế hoạch triển khai theo bước

### Bước 1: Bổ sung DOM trong `index.html`
- Thêm cụm input keyword:
  - `#downloadForm`
  - `#videoUrl`
  - `#suggestion-container`
- Thêm vùng render kết quả:
  - `#search-results-section`
  - `#search-results-container`
- Đặt vị trí DOM để không xung đột với `#multi-download-form`.

### Bước 2: Tạo controller mới
- Tạo file: `src/features/multi-mode-downloader/search-suggest-controller.ts`.
- Chức năng:
  - Lắng nghe input của `#videoUrl`.
  - Detect URL vs keyword.
  - Keyword: gọi suggest có throttle (250-300ms).
  - Submit keyword: gọi `searchV2`.
  - Render cards kết quả vào `#search-results-container`.
  - Click item: lấy `videoId` -> tạo URL YouTube -> append vào `#urlsInput`.

### Bước 3: Gắn SuggestionDropdown
- Khởi tạo `SuggestionDropdown({ containerId: 'suggestion-container', inputId: 'videoUrl' })`.
- Đồng bộ state highlight, enter/esc, click ngoài để ẩn dropdown.

### Bước 4: Render list item result
- Dùng `createSearchResultCard` từ `@downloader/ui-components` hoặc renderer nội bộ tương đương.
- Có xử lý:
  - empty state
  - loading skeleton
  - pagination cơ bản (`nextPageToken`, `hasNextPage`)
- Bổ sung checkbox cho từng card:
  - bind theo `videoId` (hoặc canonical URL) để tránh trùng lặp
  - trạng thái check phản ánh đúng danh sách URL hiện có trong `urlsInput`

### Bước 5: Bridge sang flow convert hiện tại
- Khi tick checkbox item:
  - append URL vào `#urlsInput` theo format mỗi dòng 1 URL (nếu chưa có).
- Khi untick checkbox item:
  - remove đúng URL khỏi `#urlsInput`.
- Sau mỗi thay đổi:
  - chuẩn hóa textarea (mỗi URL một dòng, bỏ dòng trống, chống trùng URL).
  - trigger cập nhật label `Convert (n)`.
  - tùy chọn scroll nhẹ tới form `#multi-download-form` trên mobile.

### Bước 6: Wiring entrypoint
- Cập nhật `src/multi-mode-main.ts`:
  - import + gọi `initSearchSuggestController()` sau `initConvertForm(...)`.
- Đảm bảo init fail-safe: nếu thiếu DOM mới thì không làm hỏng app.

### Bước 7: Kiểm thử
- Case 1: Gõ keyword -> có suggest.
- Case 2: Enter search -> hiển thị list item.
- Case 3: Tick item -> URL được thêm vào `urlsInput`.
- Case 4: Untick item -> URL bị loại khỏi `urlsInput`.
- Case 5: Tick/untick nhiều item liên tiếp không bị trùng URL.
- Case 6: Convert chạy đúng cả 3 mode (`batch/playlist/trim`).
- Case 7: Không hồi quy các chức năng cũ (advanced settings, trim editor, dropdown).

## 5. Rủi ro và cách giảm thiểu
- Xung đột DOM id với flow cũ:
  - dùng namespace rõ ràng, chỉ map đúng selector mới.
- Đua trạng thái giữa suggest/search:
  - dùng `isSubmitting`, cancel timer throttle, reset state khi submit.
- UX rối khi có hai vùng nhập:
  - copy rõ microcopy: ô keyword để tìm video, ô textarea để convert hàng loạt.

## 6. Tiêu chí hoàn thành (Definition of Done)
- Có thể tìm video bằng keyword trong cùng trang ezconv.
- Có suggest realtime khi gõ keyword.
- Có danh sách kết quả với checkbox theo từng item.
- Tick thêm URL vào `urlsInput`, untick gỡ URL ra đúng item.
- Convert hoạt động ngay sau khi chọn item bằng checkbox.
- Build pass và không lỗi TypeScript.
