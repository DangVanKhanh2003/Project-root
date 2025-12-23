## Downloader Logic Duplication Report

### 1. URL Handling & Preview Flow

| Scope | Trùng ở đâu | Dẫn chứng | Gợi ý gom |
| --- | --- | --- | --- |
| YouTube helpers (`isYouTubeUrl`, `extractYouTubeVideoId`, `generateFakeYouTubeData`) | 4x `input-form.ts` trong `apps/y2matepro`, `apps/y2mate-new-ux`, `apps/ytmp3-clone-3`, `apps/ytmp3-clone-darkmode-3` (đoạn 40-210) | `apps/y2matepro/src/features/downloader/logic/input-form.ts:40-210`<br>`apps/y2mate-new-ux/.../input-form.ts:40-210`<br>`apps/ytmp3-clone-3/.../input-form.ts:40-210`<br>`apps/ytmp3-clone-darkmode-3/.../input-form.ts:40-210` | Mở rộng `packages/core/src/utils/youtube-url-validator.ts` để export toàn bộ helpers + builder fake data |
| tìm 
### 2. Conversion Layer

| Scope | Trùng ở đâu | Dẫn chứng | Gợi ý gom |
| --- | --- | --- | --- |
| Orchestrator (`convert-logic-v2.ts`, `conversion-controller.ts`) | Cùng thư mục `src/features/downloader/logic/conversion/` ở mọi app | `apps/y2matepro/.../convert-logic-v2.ts:1-210`<br>`apps/ytmp3-clone-3/.../convert-logic-v2.ts:1-210` (nội dung giống) | Tách thành package `packages/downloader-conversion` (bao gồm strategy, retry, polling) |
| Strategy helpers (`application/*`, `retry-helper.ts`, `polling-progress-mapper.ts`) | Được copy nguyên cây thư mục giữa các app | So sánh `apps/y2matepro/.../logic/conversion/` với `apps/y2mate-new-ux/.../logic/conversion/` | Đưa vào base và expose qua API |

### 3. UI Renderer & Components

| Scope | Trùng ở đâu | Dẫn chứng | Gợi ý gom |
| --- | --- | --- | --- |
| Download rendering (`renderDownloadOptions`, `renderFormatItem`, `handleDownloadClick`, `updateVideoTitle`) | `src/features/downloader/ui-render/download-rendering.ts` trong mọi app | `apps/y2matepro/.../download-rendering.ts:360-430`<br>`apps/ytmp3-clone-3/.../download-rendering.ts:350-430` | Đưa vào `packages/downloader-ui` với props/theme để tuỳ biến |
| UI components (modal, progress bar, circular progress, search-result-card, suggestion dropdown) | Thư mục `src/ui-components` trùng nhau | So sánh `apps/y2matepro/src/ui-components/*` với `apps/y2mate-new-ux/src/ui-components/*` | Hợp nhất vào `packages/ui-shared` (hoặc mở rộng package này) |

### 4. Utilities & Constants

| Scope | Trùng ở đâu | Dẫn chứng | Gợi ý gom |
| --- | --- | --- | --- |
| YouTube constants (`YOUTUBE_API_CONSTANTS`, `extractPlaylistId`) | `apps/*/src/constants/youtube-constants.ts` (4 bản) | Ví dụ `apps/y2matepro/.../youtube-constants.ts:1-73` | Sát nhập vào `@downloader/core` constants |
| Format utilities (`mapFormat`, `processFormatArray`, `generateFormatId`) | `apps/y2matepro/src/utils/format-utils.ts` == `apps/ytmp3-clone-3/src/utils/format-utils.ts` == `apps/y2mate-new-ux/src/utils/format-utils.ts` | Kiểm tra các file tương ứng | Tạo module utils chung |
| Link validator & download stream helpers | `apps/*/src/utils/link-validator.ts`, `download-stream.ts` giống nhau | So sánh path tương ứng giữa y2matepro và clones | Đưa vào base utils |

### 5. State & Routing

| Scope | Trùng ở đâu | Dẫn chứng | Gợi ý gom |
| --- | --- | --- | --- |
| Downloader state modules (`conversion-state.ts`, `multifile-state.ts`, `suggestions-state.ts`, v.v.) | `apps/*/src/features/downloader/state/` lặp nguyên thư mục | Đối chiếu y2matepro vs ytmp3-clone-3 | Đóng gói thành state manager chung |
| Routing helpers (`routing/url-manager.ts`, `routing/seo-manager.ts`) | File giống nhau giữa các app | So sánh `apps/y2matepro/src/features/downloader/routing/*` với clones | Tạo base router util |

### 6. Infrastructure & API Layer

| Scope | Trùng ở đâu | Dẫn chứng | Gợi ý gom |
| --- | --- | --- | --- |
| API bootstrap (`src/api/index.ts`) | File giống hệt giữa `apps/y2matepro` và `apps/ytmp3-clone-3` (cùng client factory, captcha handler, verified services) | `diff -q apps/y2matepro/src/api/index.ts apps/ytmp3-clone-3/src/api/index.ts` → identical | Dời vào package chung (ví dụ `packages/downloader-api`) và cấu hình bằng env |
| Downloader UI shell (`features/downloader/downloader-ui.ts`) | Chia sẻ cùng workflow (init state, bind form, dynamic import) giữa các app | So sánh `apps/y2matepro/.../downloader-ui.ts` với `apps/ytmp3-clone-3/.../downloader-ui.ts` (các hàm `initDownloader`, `setupInputEvents`, `setupScroll`) | Chuyển thành component/hook trong base UI |
| Content renderers (`ui-render/content-renderer.ts`, `ui-render/gallery-renderer.ts`) | Đa số logic render skeleton/list/empty-state giống nhau giữa app chính và clones | Các file tương ứng trong từng app có cùng cấu trúc hàm `renderResults`, `renderMessage`, `renderVideoDownloadOptions` | Gom vào base renderer module, cho phép override nhẹ qua config |
| Modal & progress components (`ui-components/modal/conversion-modal.ts`, `ui-components/progress-bar/*`, `ui-components/circular-progress/*`) | Y nguyên giữa mọi app | Đối chiếu đường dẫn trong từng app | Di chuyển vào `packages/ui-shared` để tái sử dụng |

### 6. Ngoài monorepo

- Repo `ytmp3.gg` chứa `src/script/libs/downloader-lib-standalone/utils/youtube-validator.js` với hàm `checkYouTubeVideoExists`, `isYouTubeUrl`, `isYouTubeUrlStrict`. Cần đồng bộ logic này với base để tránh drift.

### Tóm tắt

- Các app đang chia sẻ cùng một bộ downloader logic nhưng copy trực tiếp → khó bảo trì.
- `packages/core` đã có nền tảng validator, cần mở rộng để các app dùng thay vì tự định nghĩa.
- Nên lập kế hoạch refactor incremental: xây base (validators, conversion, renderer, state) → viết test → migrate từng app → xóa bản sao cũ.
