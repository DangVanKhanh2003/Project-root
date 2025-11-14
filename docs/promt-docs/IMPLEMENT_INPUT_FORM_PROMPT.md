### **Tài liệu Prompt: Triển khai Thành phần `@InputForm` (Phiên bản không mã nguồn)**

**Mục tiêu:** Hướng dẫn AI CLI xây dựng hoàn chỉnh phần HTML và logic JavaScript cho thành phần nhập liệu chính (`@InputForm`) của ứng dụng ytmp3.

---

#### **1. Tổng quan về Luồng Nghiệp vụ**

Ứng dụng Snackloader là một công cụ cho phép người dùng tải xuống media từ các URL hoặc tìm kiếm media bằng từ khóa. `@InputForm` là điểm tương tác trung tâm và duy nhất, có nhiệm vụ khởi tạo mọi luồng xử lý dựa trên đầu vào của người dùng.

---

#### **2. Yêu cầu Chi tiết cho `@InputForm`**

**2.1. Cấu trúc HTML (Mục tiêu: `index.html`)**

Bạn cần sửa đổi file `index.html` để tạo ra cấu trúc cho form. Hãy đảm bảo các element có `id` được đặt đúng như mô tả để JavaScript có thể tham chiếu tới.

*   Tạo một element `form` với `id` là `input-form`.
*   Bên trong form, tạo một `input` với `id` là `url-input`. Gán cho nó một placeholder bằng tiếng Anh phù hợp.
*   Tạo ba `button`:
    *   Nút "Dán" với `id` là `paste-button`.
    *   Nút "Xóa" với `id` là `clear-button`.
    *   Nút "Submit" chính với `id` là `submit-button`.
*   Bên trong nút submit, cần có một `span` với `class` là `button-text` để chứa văn bản, và một `div` với `class`.
*   Ngoài ra, tạo một `p` element với `id` là `error-message` để hiển thị thông báo lỗi.

**2.2. Logic JavaScript (Mục tiêu: `src/script/features/downloader/downloader-ui.js`)**

Logic phải được xây dựng dựa trên nguyên tắc "Giao diện Điều khiển bằng Trạng thái".

*   **Đối tượng Trạng thái (State Object):**
    *   Bạn phải quản lý trạng thái của component thông qua một đối tượng JavaScript.
    *   Đối tượng này cần các thuộc tính để theo dõi: loại đầu vào hiện tại (đặt tên là `inputType`), trạng thái đang tải (đặt tên là `isLoading`), và thông báo lỗi (đặt tên là `error`).
*   **Hàm Render:**
    *   Tạo một hàm (ví dụ, đặt tên là `render`) chịu trách nhiệm cập nhật toàn bộ giao diện dựa trên các giá trị trong đối tượng trạng thái.
    *   Ví dụ: Nếu thuộc tính `inputType` là `'keyword'`, hàm `render` phải thay đổi nội dung của `span.button-text` thành 'Search'. Nếu `isLoading` là `true`, hàm `render` phải vô hiệu hóa form . Nếu thuộc tính `error` có giá trị, hàm `render` phải hiển thị nó trong `p#error-message`.

---

#### **3. Hướng dẫn Sử dụng Thư viện Lõi**

Việc tương tác với thư viện `downloader-lib-standalone` là bắt buộc.

*   **Phân tích:**
    *   Bắt đầu bằng cách phân tích file `index.js` trong thư mục thư viện. Bạn sẽ thấy nó export hai thành phần quan trọng: một factory function tên là `createService` và một đối tượng tiện ích tên là `DownloaderUtils`.
*   **Khởi tạo và Sử dụng:**
    *   Trong logic của bạn, trước tiên hãy import `createService` và `DownloaderUtils`.
    *   Sau đó, gọi hàm `createService` để nhận về một đối tượng `service`. Đối tượng này chứa tất cả các phương thức để gọi API.
    *   Để dùng các hàm tiện ích, hãy truy cập chúng thông qua đối tượng `DownloaderUtils`. Ví dụ: phương thức `isLikelyUrl`.
    *   Để gọi API, hãy dùng các phương thức trên đối tượng `service` bạn đã tạo. Ví dụ: phương thức `searchTitle`.

---

#### **4. Các Trường hợp cần Triển khai (`handleSubmit`)**

Hàm xử lý sự kiện submit của form là nơi thực thi logic nghiệp vụ chính.

*   **Mục tiêu:** Nhiệm vụ của bạn ở bước này là phát hiện đúng trường hợp, gọi service tương ứng, và ghi log kết quả ra console.
*   **Logic Phát hiện (3 bước):**
    1.  Sử dụng phương thức `detectYouTubeContentType` từ `DownloaderUtils`. Nếu nó xác định input là một playlist, đó là **Case 1**.
    2.  Nếu không, sử dụng phương thức `isLikelyUrl` từ `DownloaderUtils`. Nếu nó xác định input là một URL, đó là **Case 2**.
    3.  Nếu cả hai đều không đúng, đó là **Case 3**.
*   **Ánh xạ Case -> Service:**
    *   **Case 1 (Playlist):** Gọi phương thức `extractPlaylist` trên đối tượng `service`.
    *   **Case 2 (Media URL):** Gọi phương thức `extractMedia` trên đối tượng `service`.
    *   **Case 3 (Keyword):** Gọi phương thức `searchTitle` trên đối tượng `service`.
*   **Output yêu cầu:**
    *   Khi một lệnh gọi service thành công, hãy `console.log` một đối tượng chứa thông tin về trạng thái (thành công), trường hợp vừa được phát hiện, và dữ liệu trả về.
*   **Xử lý Lỗi:**
    *   Bắt buộc phải bao bọc logic gọi service trong một cấu trúc xử lý lỗi, ví dụ như `try...catch`.
    *   Trong trường hợp xảy ra lỗi, hãy `console.error` lỗi đó và cập nhật thuộc tính `error` trong đối tượng trạng thái để thông báo cho người dùng.
    *   Phải có một khối `finally` để đảm bảo trạng thái `isLoading` luôn được trả về `false`, giúp người dùng có thể thử lại.

---

#### **5. Kế hoạch Thực hiện (Action Plan)**

1.  **Bước 1: Cập nhật `index.html`**: Thêm cấu trúc HTML cho `@InputForm` như đã mô tả ở mục 2.1.
2.  **Bước 2: Triển khai `downloader-ui.js`**:
    *   a. Import các thành phần cần thiết từ thư viện và khởi tạo `service`.
    *   b. Tham chiếu đến các DOM element đã tạo ở Bước 1.
    *   c. Định nghĩa đối tượng `state` và viết hàm `render`.
    *   d. Viết các hàm xử lý sự kiện cho việc nhập liệu, dán, và xóa (ví dụ: `handleInput`, `handlePaste`, `handleClear`).
    *   e. Viết hàm xử lý sự kiện submit chính (ví dụ: `handleSubmit`) với logic phát hiện 3 bước, gọi service, và xử lý lỗi như đã mô tả ở mục 4.
    *   f. Gắn tất cả các hàm xử lý sự kiện vào đúng DOM element, nên thực hiện sau khi DOM đã tải xong.
