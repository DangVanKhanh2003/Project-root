# Ezconv: Nghiên cứu cơ chế Search vs Suggest (đối chiếu ssvid.cc)

## 1) Kết luận nhanh

Trong `apps/ezconv`, phần **state + config + api** cho `search/suggest` vẫn còn, nhưng **tầng tích hợp runtime (controller + renderer + entry init)** đã bị rơi trong quá trình refactor sang multi-mode.

- `suggest` và `search` hiện **không được kích hoạt** từ entry chính.
- Flow hiện tại tập trung vào `textarea` nhiều URL + convert theo mode (batch/playlist/trim).

## 2) Những gì còn sẵn trong ezconv

### 2.1 API / environment còn đầy đủ

- `searchV2` service vẫn tạo trong API:
  - `src/api/index.ts`
- timeout/config cho suggest/search vẫn còn:
  - `src/environment.ts`

### 2.2 State cho suggest/search vẫn còn

- Suggest state:
  - `src/features/downloader/state/suggestions-state.ts`
- Search result + pagination state:
  - `src/features/downloader/state/search-results-state.ts`
- Root state còn các field:
  - `suggestions`, `showSuggestions`, `isLoadingSuggestions`, `query`, `originalQuery`, `results`, `searchPagination`
  - `src/features/downloader/state/state-manager.ts`

### 2.3 CSS/UI package vẫn còn import

- `SuggestionDropdown` và `SearchResultCard` CSS vẫn import:
  - `src/styles/index.css`

## 3) Những gì đang mất tích hợp trong ezconv

### 3.1 Entry chính không init flow search/suggest

- Entry hiện tại:
  - `src/multi-mode-main.ts`
- Chỉ init:
  - menu/lang/header
  - format toggle
  - audio dropdown cho multi-mode
  - multiple renderer
  - trim controller
  - advanced settings
  - convert submit controller

Không có các bước kiểu:
- `initInputForm()`
- `SuggestionDropdown.init()`
- `initContentRenderer()`
- `initViewSwitcher()`

### 3.2 UI hiện tại không dùng form/input của flow cũ

- HTML runtime hiện dùng:
  - `#urlsInput`
  - `#addUrlsBtn`
  - `index.html`
- Không có active structure của flow keyword cũ:
  - `#downloadForm`, `#videoUrl`, `#suggestion-container`, `#search-results-container`, `#search-results-section`

### 3.3 Controller hiện tại chỉ xử lý URL list

- `src/features/multi-mode-downloader/convert-submit-controller.ts`
  - parse URL
  - route batch/playlist/trim
  - không có nhánh keyword -> search API

## 4) Cơ chế chuẩn ở ssvid.cc (để copy/refactor)

## 4.1 Orchestrator

- `src/features/downloader/downloader-ui.ts`
  - init renderer/content/view switcher
  - init `SuggestionDropdown`
  - init input form controller

## 4.2 Suggest flow

- `src/features/downloader/logic/input-form.ts`
  - `handleInput()` phân loại `url` vs `keyword`
  - throttle (`throttledFetchSuggestions`)
  - gọi `api.getSuggestions({ q })`
  - cập nhật state + render dropdown
  - keyboard nav (up/down/enter/esc)
  - click outside để hide

## 4.3 Search flow

- `src/features/downloader/logic/input-form.ts`
  - submit keyword -> `handleSearch()`
  - gọi `api.searchV2(keyword, { limit })`
  - transform data -> set results/pagination
- `src/features/downloader/ui-render/content-renderer.ts`
  - render result cards
  - load more / infinite scroll theo `nextPageToken`

## 4.4 View switching

- `src/features/downloader/ui-render/view-switcher.ts`
  - `search-view` <-> `result-view`

## 5) Vì sao “có sẵn mà không chạy”

Refactor ở `ezconv` chuyển hướng sang kiến trúc multi-mode downloader (textarea nhiều URL), nên runtime không còn gọi lớp controller/render cho keyword search.

Nói ngắn gọn:
- **Core logic cũ còn một phần (state/api/css)**
- **Wiring bị bỏ (entry + init + DOM hooks)**

## 6) Tài liệu/điểm tham chiếu trong repo ezconv

- Kiến trúc hiện tại:
  - `ARCHITECTURE.md`
- Entry chính:
  - `src/multi-mode-main.ts`
- Multi convert controller:
  - `src/features/multi-mode-downloader/convert-submit-controller.ts`
- State còn lại:
  - `src/features/downloader/state/*.ts`

## 7) Hướng tích hợp lại (đề xuất ngắn)

1. Giữ nguyên flow `urlsInput` hiện tại cho multi-mode.
2. Tách một flow keyword riêng (form/input kiểu cũ hoặc panel riêng).
3. Mang lại các module từ `ssvid.cc`:
   - `downloader-ui.ts`
   - `logic/input-form.ts`
   - `ui-render/content-renderer.ts`
   - `ui-render/ui-renderer.ts`
   - `ui-render/view-switcher.ts`
4. Refactor selector/ID để không đụng conflict với `urlsInput`.
5. Re-wire entry để init song song 2 flow.

