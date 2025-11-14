### **Tài liệu Prompt: Xây dựng Luồng Giao diện Người dùng cho Ứng dụng  (Phiên bản Cập nhật)**

**Mục tiêu:** Prompt này nhằm mục đích mô tả toàn bộ luồng hoạt động và các thành phần giao diện của ứng dụng . Trí tuệ nhân tạo (AI) được yêu cầu hiểu rõ các trạng thái, hành vi, và sự chuyển đổi giữa các thành phần để có thể phát triển một giao diện người dùng hoàn chỉnh.

#### **1. Nguyên tắc cốt lõi**

*   **Ưu tiên cho di động (Mobile-First):** Giao diện phải được thiết kế và tối ưu hóa cho trải nghiệm trên thiết bị di động trước tiên.
*   **Ô Nhập liệu Hợp nhất (Unified Input):** Chỉ có một ô nhập liệu chính. Ô này phải đủ thông minh để xử lý hai loại đầu vào: **URL** và **Từ khóa**.
*   **Giao diện Điều khiển bằng Trạng thái (State-Driven UI):** Giao diện phải thay đổi một cách linh hoạt dựa trên một đối tượng trạng thái toàn cục.
*   **Kiến trúc Module:** Chức năng được chia thành các module riêng biệt.

#### **2. Lớp Dịch vụ (API Service Layer)**

Giao tiếp với máy chủ được thực hiện độc quyền thông qua một lớp dịch vụ với các phương thức chính sau:
*   `search`, `searchTitle`, `getSuggestions`: Dành cho chức năng tìm kiếm.
*   `decodeUrl`: Dành cho các liên kết có thể lấy link tải trực tiếp.
*   `convert`, `checkTask`: Dành cho các nội dung cần xử lý hoặc chuyển đổi ở phía máy chủ.

#### **3. Các Thành phần Giao diện Chính (Key UI Components)**

**3.1. Form Nhập liệu (`@InputForm`)**
*   **Mô tả:** Thành phần trung tâm trên trang chủ để nhập liên kết hoặc từ khóa.

**3.2. Hộp Gợi ý (`@SuggestionBox`)**
*   **Mô tả:** Xuất hiện khi người dùng gõ **từ khóa**, đề xuất các hành động tìm kiếm.

**3.3. Form Kết quả Media Đơn lẻ (`@SingleMediaResult`)**
*   **Mô tả:** Hiển thị chi tiết cho **một** nội dung media (video/ảnh).

**3.4. Form Kết quả Dạng Bộ sưu tập (`@GalleryResult`)**
*   **Mô tả:** Hiển thị một lưới các nội dung media.
*   **Kích hoạt:** Khi người dùng tìm kiếm bằng **từ khóa** hoặc gửi một **URL trỏ đến bộ sưu tập**.

**3.5. Popup Chuyển đổi & Tải xuống (`@ConversionDownloadPopup`)**
*   **Mô tả:** Một hộp thoại quản lý quá trình tải xuống cuối cùng, đặc biệt cho các tệp cần xử lý.
*   **Hành vi & Trạng thái:**
    *   **Đang chuẩn bị:** Gọi phương thức `convert`.
    *   **Đang chuyển đổi:** Bắt đầu "hỏi vòng" (polling) phương thức `checkTask` và hiển thị tiến trình.
    *   **Yêu cầu Xác thực:** Hiển thị `@CaptchaPopup` nếu cần.
    *   **Hoàn tất:** Khi `checkTask` báo thành công, hiển thị nút tải xuống cuối cùng.

**3.6. Popup Xác thực Người dùng (`@CaptchaPopup`)**
*   **Mô tả:** Một hộp thoại để người dùng giải quyết thử thách xác thực (CAPTCHA).
*   **Kích hoạt:** Được gọi bởi `@ConversionDownloadPopup` khi máy chủ yêu cầu.

#### **4. Luồng Hoạt động của Người dùng (User Workflows)**

**Luồng A: Xử lý Liên kết (URL) đầu vào**

1.  **Bắt đầu:** Người dùng dán URL vào `@InputForm` và gửi đi.
2.  **Phản hồi:** Giao diện hiển thị trạng thái đang tải.
3.  **Phân nhánh kết quả:**
    *   Nếu máy chủ trả về media đơn lẻ: Hiển thị `@SingleMediaResult`.
    *   Nếu máy chủ trả về bộ sưu tập: Hiển thị `@GalleryResult`.
4.  **Hành động:** Từ `@SingleMediaResult`, người dùng nhấp nút tải xuống, kích hoạt **Luồng C**.

**Luồng B: Tìm kiếm bằng Từ khóa**

1.  **Bắt đầu:** Người dùng gõ từ khóa vào `@InputForm`.
2.  **Phản hồi:** `@SuggestionBox` xuất hiện.
3.  **Hành động:** Người dùng chọn một hành động tìm kiếm.
4.  **Kết quả:** Hiển thị `@GalleryResult`.
5.  **Chuyển luồng:** Người dùng chọn một media, hệ thống hiển thị `@SingleMediaResult` cho media đó.

**Luồng C: Quy trình Tải xuống Chi tiết**

1.  **Bắt đầu:** Người dùng nhấp vào một nút tải xuống trong `@SingleMediaResult`.
2.  **Phân nhánh xử lý:**
    *   **Trường hợp 1 (Tải trực tiếp):** Hệ thống gọi `decodeUrl`. Nếu thành công, tệp được tải xuống ngay.
    *   **Trường hợp 2 (Cần chuyển đổi):**
        a. Hệ thống gọi `convert`.
        b. `@ConversionDownloadPopup` xuất hiện.
        c. Hệ thống bắt đầu gọi `checkTask` định kỳ để cập nhật tiến trình.
        d. Nếu cần xác thực, `@CaptchaPopup` sẽ hiện ra.
        e. Khi `checkTask` trả về "hoàn tất", popup hiển thị nút tải xuống cuối cùng.
