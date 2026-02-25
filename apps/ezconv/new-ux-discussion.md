# Tóm Tắt Thảo Luận Triển Khai Trang Tải Đa Chế Độ

> **⚠️ QUAN TRỌNG:** Các trang legacy (`index.html`, `youtube-multi-downloader.html`, `cut-video-youtube.html`, `download-mp3-youtube-playlist.html`) sẽ bị **XÓA** sau khi `new-ux.html` hoàn thiện. Chúng chỉ là reference để hiểu logic cũ. Code trong `src/` có thể refactor tự do — KHÔNG cần giữ backward compatibility với trang cũ.

## 1) Tóm tắt yêu cầu
- `new-ux.html` sẽ là một trang hợp nhất cho 4 chế độ: tải đơn, cắt/trim, tải nhiều URL và tải playlist.
- Giao diện nền lấy từ trang multi downloader, sau đó bổ sung:
  - Panel `Advanced Settings`.
  - Toggle `Playlist Mode` và toggle `Strim/Cut`.
  - Dropdown `Audio Track` đặt trong `Advanced Settings`.
- Quy tắc chế độ:
  - `Playlist Mode` và `Strim` loại trừ lẫn nhau.
  - `Strim` chỉ được bật khi input có đúng 1 URL.
  - Nếu `Strim ON` + `Playlist Mode OFF` và URL là playlist thì trích video ID từ link để trim video đó (không reject).
  - Chỉ dùng 1 nút `Convert` cho toàn bộ flow (không có nút `Start/Cut` riêng).
- Quy tắc grouping:
  - Playlist OFF: xử lý theo `General Group` + merge rules dựa trên top group.
  - Playlist ON: mỗi link tạo một group riêng, không merge.
- Quy tắc submit:
  - Dán URL xong không tự chạy.
  - Chỉ khi bấm `Convert` mới bắt đầu flow download/conversion.
- Toggle chỉ tác động cho lần `Convert` tiếp theo, không ảnh hưởng item/group đã tạo trước đó.
- Kết quả trim sẽ đi vào group list renderer (multi container), không dùng preview/view 2 nữa.

## 2) Module có thể tái sử dụng
- Multi service + store + renderer + strategy:
  - `src/features/downloader/logic/multiple-download/services/multi-download-service.ts`
  - `src/features/downloader/state/video-store.ts`
  - `src/features/downloader/ui-render/multiple-download/multiple-download-renderer.ts`
  - `src/features/downloader/ui-render/multiple-download/multi-download-strategy.ts`
  - `src/features/downloader/ui-render/multiple-download/playlist-strategy.ts`
- Audio dropdown:
  - `src/features/downloader/ui-render/dropdown-logic.ts`
- Logic strim (tái sử dụng phần lớn):
  - `src/features/strim-downloader/strim-downloader.ts`

## 3) Module cần sửa/refactor
- `new-ux.html` hiện vẫn là clone multi page và đang import:
  - `src/multi-downloader-main.ts`
- Cần bổ sung logic trong service cho trường hợp playlist URL khi `Playlist Mode = OFF` (playlist -> flatten items vào `General Group`).
- Cần thêm khái niệm `General Group` (`Batch 1`, `Batch 2`) đúng theo spec.
- Strim hiện phụ thuộc `stream-start-btn` + `stream-convert-btn`, chưa đúng mô hình 1 nút `Convert`.
- Shared init functions đang bị lặp giữa các entry point:
  - `src/main.ts`
  - `src/multi-downloader-main.ts`
  - `src/playlist-downloader-main.ts`
  - `src/strim-downloader-main.ts`
- Build pipeline:
  - `new-ux.html` chưa nằm trong Eleventy output.
  - `vite.config.ts` chưa có `new-ux` trong static pages.

## 4) Phần cần viết mới
- Controller cho `Advanced Settings` + state machine cho toggle.
- Orchestrator submit theo chế độ hiện tại.
- Logic merge của `General Group` theo timeline/rules trong spec.
- Kết nối trim UI vào unified flow (không dùng nút riêng).
- CSS cho `Advanced Settings` và cutting interface trên `new-ux`.

## 5) Các quyết định đã chốt
1. Khi `Strim ON` và `Playlist Mode OFF`, nếu URL là playlist thì trích video ID từ link để trim video đó (không reject).
2. Playlist OFF + dán playlist URL: không auto chạy khi vừa dán; phải bấm `Convert`, sau đó flow download mới auto chạy.
3. Kết quả trim đi vào group list renderer (multi container), bỏ toàn bộ preview/view 2.
4. Bật Strim rồi đổi URL khác: reset trim range/player ngay.
5. Giai đoạn đầu làm EN-only (chưa đưa vào full Eleventy/i18n).

## 6) Đề xuất chia phase triển khai
1. Phase A: Dựng UI `new-ux` theo spec (Advanced panel, toggle, cutting area placeholder).
2. Phase B: Unified submit + chuyển mode + grouping/merge rules.
3. Phase C: Tích hợp trim thật (player/slider/time inputs) vào convert path chung.
4. Phase D: Refactor shared init + cập nhật build pipeline + smoke test regression 4 mode.

## 7) Đề xuất module hóa (dễ triển khai và bảo trì)
- Mục tiêu: `main.ts` là entry point duy nhất, nhưng logic được tách module rõ ràng.

### 7.1 Core khởi tạo
- `src/app/app-runtime.ts`
  - Khởi tạo UI dùng chung: mobile menu, header scroll, language selector, analytics.
  - Nhận diện page context (`new-ux`, `legacy-single`, `legacy-multi`, ...).
- `src/main.ts`
  - Chỉ làm khởi tạo app + điều phối vào module theo page context.

### 7.2 Multi-mode modules (tên dễ hiểu)
- `src/features/multi-mode-downloader/multi-mode-downloader-main.ts`
  - Orchestrator của trang tải đa chế độ.
- `src/features/multi-mode-downloader/state/multi-mode-session-state.ts`
  - State runtime: mode, toggle, current settings, trim state.
- `src/features/multi-mode-downloader/controllers/advanced-settings-controller.ts`
  - Xử lý panel Advanced Settings, ràng buộc Playlist/Strim, validation + warning.
- `src/features/multi-mode-downloader/controllers/convert-submit-controller.ts`
  - Xử lý click Convert, chụp snapshot settings, route flow theo mode.
- `src/features/multi-mode-downloader/controllers/trim-controller.ts`
  - Quản lý player + slider + start/end inputs, reset khi URL thay đổi.
- `src/features/multi-mode-downloader/services/multi-mode-download-service.ts`
  - Gọi `multiDownloadService` theo rules của trang đa chế độ.

### 7.3 Shared reusable modules
- `src/features/shared/init/common-init.ts`
  - Gom code lặp trong các main hiện tại (mobile menu/lang/header/firebase).
- `src/features/shared/form/global-settings.ts`
  - Đọc/ghi format, quality, audio track, localStorage preferences.

## 8) Kế hoạch xóa code thừa/code lặp (an toàn)
0. Giai đoạn 0 - Audit trước khi xóa:
   - Quét import graph, tìm file/hàm không còn được tham chiếu.
   - Lập danh sách code lặp giữa các main cũ.
   - Đánh dấu nhóm `xóa ngay` và `xóa sau cutover`.
1. Giai đoạn 1 - Trích xuất:
   - Trích xuất shared init vào `common-init.ts`.
   - Các file main cũ vẫn tồn tại, chỉ đổi sang gọi module shared.
2. Giai đoạn 2 - Chuyển hướng:
   - `new-ux.html` dùng `main.ts` + `multi-mode-downloader-main.ts`.
   - Đảm bảo flow `new-ux` chạy ổn định.
3. Giai đoạn 3 - Đánh dấu deprecate:
   - Đánh dấu các hàm lặp trong `multi/playlist/strim-main.ts` là deprecated.
4. Giai đoạn 4 - Xóa thật:
   - Xóa code lặp sau khi không còn import/reference.
   - Xóa code path preview/view2 khỏi flow mới.
5. Giai đoạn 5 - Dọn dẹp cuối:
   - Xóa helper/page-state không còn dùng.
   - Chạy build + smoke test trước mỗi đợt xóa.

### 8.1 Checklist xóa code không dùng
- Dùng `rg` quét toàn bộ references trước khi xóa file/hàm.
- Đảm bảo không còn import trong TypeScript và không còn `script` tham chiếu trong HTML/template.
- Xóa theo từng đợt nhỏ; mỗi đợt đều build + smoke test.
- Không xóa code page legacy khi chưa có cutover an toàn.

## 9) Nguyên tắc triển khai
- Không biến `main.ts` thành god-file.
- Mỗi module có contract rõ ràng (input/output/event).
- Service layer không phụ thuộc trực tiếp vào DOM.
- UI controller không chứa business rules phức tạp (đưa vào service/rule module).

## 10) Làm rõ kỹ thuật sau khi research lại source

### 10.1 "preview/view 2" trong code hiện tại là gì
- "View 2" chính là result-view của flow single/cut hiện tại, gồm:
  - `#result-view` + `#content-area` trong HTML (`index.html`, `cut-video-youtube.html`).
  - Module chuyển view: `src/features/downloader/ui-render/view-switcher.ts`.
  - Module render preview card: `renderPreviewCard()` trong `src/features/downloader/ui-render/content-renderer.ts`.
  - Strim flow hiện tại vẫn gọi `showResultView()` trước khi `handleAutoDownload()` trong `src/features/strim-downloader/strim-downloader.ts`.
- Kết luận: không có module tên `view2`, nhưng có đầy đủ "2-view structure" theo đúng nghĩa kỹ thuật.

### 10.2 Hành vi `Convert` khi `Strim ON` (mô tả chi tiết)
- Mục tiêu mới:
  - Không đi vào result-view/preview card.
  - Tạo item trực tiếp trong group list renderer.
- Đề xuất flow chuẩn:
  1. User bấm `Convert`.
  2. Validate Strim:
     - Phải có đúng 1 URL.
     - Không yêu cầu URL phải là video URL thuần; nếu là playlist URL thì trích video ID để xử lý trim.
  3. Tạo 1 item trong `General Group` (Batch) với settings snapshot tại thời điểm bấm Convert, kèm trim params (`trimStart`, `trimEnd`, `trimRangeLabel`).
  4. Item chạy lifecycle chuẩn của multi pipeline:
     - `fetching_metadata` -> `ready` -> `queued` -> `converting/downloading` -> `completed/error/cancelled`.
  5. Không thêm status riêng cho trim; trim là thuộc tính settings của item.
- Badge:
  - Không tạo status mới "trimmed".
  - Có thể hiển thị badge phụ "Trim xx:xx - yy:yy" trong vùng settings/badges của item để user nhận biết.

### 10.3 Rule state khi user thay đổi textarea (bổ sung đầy đủ)
- Khi `Strim ON`:
  - Nếu URL count > 1: tự động OFF Strim + ẩn cutting UI + cảnh báo.
  - Nếu user xóa hết URL: KHÔNG tự động OFF Strim (theo quyết định đã chốt), chỉ ẩn cutting UI và reset player/range.
  - Nếu đổi sang URL khác: reset player/range ngay.
  - Nếu URL là playlist và vẫn thỏa đúng 1 URL + `Playlist Mode OFF`: trích video ID từ link để chạy trim flow.
- Khi `Playlist Mode ON`:
  - Nếu user bật Playlist thì Strim tự OFF.
  - Nếu Strim đang ON mà bật Playlist thì Strim tắt ngay.
