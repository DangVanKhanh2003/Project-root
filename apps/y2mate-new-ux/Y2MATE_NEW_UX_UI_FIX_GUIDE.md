# Hướng dẫn Sửa lỗi Cập nhật UI cho Project y2mate-new-ux

Tài liệu này phân tích nguyên nhân và cung cấp hướng dẫn chi tiết để khắc phục sự cố giao diện người dùng (UI) không cập nhật trong project `y2mate-new-ux`.

## 1. Bối cảnh và Nguyên nhân

Project `y2mate-new-ux` được tái cấu trúc (refactor) từ `y2matepro` với mục tiêu chính là cải thiện trải nghiệm người dùng (UX). Một thay đổi quan trọng là **loại bỏ cửa sổ modal (pop-up) cho quá trình chuyển đổi video và thay thế bằng việc hiển thị trạng thái trực tiếp trên trang**.

Trong quá trình tái cấu trúc, lập trình viên đã thực hiện được các phần sau:
-   Xóa bỏ UI của modal cũ.
-   Cập nhật logic nghiệp vụ và quản lý trạng thái (state) để xử lý quá trình chuyển đổi ở chế độ nền.

Tuy nhiên, project rơi vào tình trạng lỗi hiện tại vì một bước cuối cùng và quan trọng nhất đã **bị bỏ sót hoặc chưa hoàn thành**:

**Nguyên nhân gốc rễ:** Lập trình viên đã **không triển khai logic để render (vẽ) giao diện người dùng mới** cho các thanh trạng thái chuyển đổi. Mặc dù state của ứng dụng (ví dụ: `status: 'CONVERTING'`, `progress: 50%`) vẫn đang được cập nhật chính xác ở phía sau, không có đoạn code nào lắng nghe những thay đổi này để hiển thị chúng ra cho người dùng thấy dưới dạng thanh tiến trình, nút tải xuống, hoặc thông báo lỗi.

Bằng chứng rõ ràng nhất là một ghi chú `TODO` được để lại trong file `apps/y2mate-new-ux/src/features/downloader/ui-render/download-rendering.ts`, xác nhận rằng phần công việc này vẫn còn dang dở.

## 2. Hướng dẫn Sửa lỗi

Để khắc phục sự cố, AI thực thi cần hoàn thành phần việc còn dang dở: kết nối logic trạng thái (state) với giao diện người dùng (view).

### Bước 1: Implement Logic Render cho Thanh Trạng thái

**File cần sửa:** `apps/y2mate-new-ux/src/features/downloader/ui-render/download-rendering.ts`

**Nhiệm vụ:**
File này hiện tại gần như trống. Bạn cần phải implement logic để render các thanh trạng thái.

1.  **Tạo một hàm chính, public:** Đặt tên là `renderAllConversionStatuses`, nhận vào `state` của ứng dụng.
2.  **Logic của hàm:**
    *   Hàm này sẽ lặp qua đối tượng `state.conversionTasks`.
    *   Với mỗi tác vụ (task) trong đó, nó sẽ gọi một hàm con (ví dụ: `renderStatusBar`) để xử lý việc render cho một định dạng cụ thể.
3.  **Logic của hàm `renderStatusBar`:**
    *   Tìm đến đúng container trong DOM dựa vào ID của định dạng (ví dụ: `document.getElementById('status-bar-' + formatId)`).
    *   Dựa vào `task.status` (`PENDING`, `CONVERTING`, `READY`, `ERROR`), tạo ra đoạn mã HTML tương ứng (thanh tiến trình, nút "Download", nút "Retry" kèm thông báo lỗi).
    *   **Quan trọng:** Gắn các trình lắng nghe sự kiện (`addEventListener`) vào các nút "Download" và "Retry" vừa tạo. Khi người dùng nhấn vào, các sự kiện này phải `dispatchEvent` các `CustomEvent` trên `window` với tên tương ứng là `conversion:download` và `conversion:retry`. Điều này cho phép tái sử dụng lại logic đã có trong `conversion-controller.ts` mà không cần sửa đổi file đó.

### Bước 2: Kết nối Logic Render với Vòng lặp Render chính

**File cần sửa:** `apps/y2mate-new-ux/src/features/downloader/ui-render/ui-renderer.ts`

**Nhiệm vụ:**
Gọi hàm `renderAllConversionStatuses` vừa tạo ở Bước 1 mỗi khi có sự thay đổi liên quan đến các tác vụ chuyển đổi.

1.  **Import hàm mới:** Ở đầu file, import hàm `renderAllConversionStatuses` từ file `./download-rendering.ts`.
2.  **Tìm hàm `render`:** Xác định vị trí của hàm `render(state, prevState)`.
3.  **Thêm lệnh gọi có điều kiện:** Bên trong hàm `render`, thêm một khối `if` để kiểm tra xem `conversionTasks` có thực sự thay đổi hay không trước khi gọi hàm render. Điều này giúp tối ưu hóa hiệu suất, tránh việc render lại không cần thiết.

    **Logic gợi ý:**
    ```
    if (state.conversionTasks !== prevState.conversionTasks) {
        renderAllConversionStatuses(state);
    }
    ```

Sau khi hoàn thành hai bước trên, luồng dữ liệu sẽ được khép kín: State thay đổi -> Hàm render chính được gọi -> Hàm render thanh trạng thái được gọi -> Giao diện người dùng được cập nhật. Lỗi sẽ được khắc phục.
