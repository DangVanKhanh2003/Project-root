# Tài Liệu Kỹ Thuật: Cơ Chế Hoạt Động Của Tùy Chọn Tải Xuống (Download Options)

## 1. Tổng Quan

Tài liệu này mô tả chi tiết về cách thành phần "Tùy chọn Tải xuống" (Download Options) hoạt động, từ khi người dùng yêu cầu tải một video cho đến khi các tùy chọn định dạng (MP4, MP3, v.v.) được hiển thị. Mục tiêu là cung cấp một cái nhìn rõ ràng về luồng dữ liệu, cách bố trí giao diện, và các cơ chế liên quan.

---

## 2. Luồng Hoạt Động (Workflow)

Quy trình hiển thị các tùy chọn tải xuống diễn ra theo 3 bước chính:

1.  **Trạng Thái Chờ (Loading):**
    *   Ngay sau khi người dùng gửi yêu cầu (ví dụ: nhấn nút "Download" sau khi dán URL), toàn bộ khu vực chứa các tùy chọn tải xuống sẽ được ẩn đi.
    *   hiệu ứng skeleton được kích hoạt

2.  **Lấy Dữ Liệu (Data Fetching):**
    *   Hệ thống gửi một yêu cầu đến API backend để lấy thông tin chi tiết về media được yêu cầu.
    *   API trả về một cấu trúc dữ liệu chứa:
        *   Thông tin chung (meta): Tiêu đề, URL ảnh thumbnail.
        *   Danh sách các định dạng (formats): Một mảng chứa các đối tượng, mỗi đối tượng đại diện cho một tùy chọn tải xuống (ví dụ: một video 1080p, một audio 128kbps).

3.  **Hiển Thị Dữ Liệu (Rendering):**
    *   Khi nhận được dữ liệu từ API, biểu tượng tải sẽ biến mất.
    *   Khu vực chứa các tùy chọn tải xuống được hiển thị trở lại.
    *   Dữ liệu từ API được "vẽ" lên giao diện: tiêu đề, thumbnail và một danh sách các tùy chọn tải xuống được tạo ra một cách linh động.

---

## 3. Bố Cục Giao Diện (Layout)

### Bố Cục Chung

*   Danh sách các tùy chọn tải xuống **luôn luôn được hiển thị dưới dạng một cột duy nhất**, xếp chồng lên nhau theo chiều dọc.
*   Bố cục này được giữ nguyên trên mọi kích thước màn hình, từ mobile đến desktop, để đảm bảo tính nhất quán và dễ đọc.

### Cấu Trúc Của Một Tùy Chọn (Item)

Mỗi tùy chọn trong danh sách được chia làm 3 phần chính trên một hàng:

1.  **Cột Trái:** Hiển thị **loại định dạng** của tệp (ví dụ: "MP4", "WEBM", "MP3").
con3.  **Cột Phải:** Chứa nút **"Download"**.

---

## 4. Hướng Dẫn Mapping Dữ Liệu

Đây là cách dữ liệu từ API được ánh xạ tới các thành phần trên giao diện người dùng.

| Dữ liệu từ API (Trong đối tượng `videoDetail`) | Thành phần Giao diện Tương ứng                               | Ghi chú                                                                                             |
| :-------------------------------------------- | :------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| `meta.title`                                  | **Tiêu đề của video**                                          | Hiển thị ở phía trên khu vực tải xuống.                                                              |
| `meta.thumbnail`                              | **Ảnh thumbnail của video**                                    | URL của ảnh được dùng để hiển thị.                                                                  |
| `formats` (Mảng các đối tượng `format`)       | **Toàn bộ danh sách các tùy chọn tải xuống**                   | Mỗi đối tượng `format` trong mảng này sẽ tạo ra một hàng (một item) trong danh sách.                |
| `format.type`                                 | **Nhãn Loại Định Dạng** (Cột trái)                             | Ví dụ: "MP4", "MP3".                                                                                |
| `format.quality`                              | **Nhãn Chất Lượng/Độ phân giải** (Cột giữa)                    | Ví dụ: "1080p", "128kbps".                                                                          |
| `format.quality`                              | **Huy Hiệu Chất Lượng (Badge)** (Cột giữa)                     | Dữ liệu này được xử lý logic để tạo huy hiệu. Ví dụ: "1080p" -> "Full-HD", "2160p" -> "4K".         |
| `format.id`                                   | **Nút "Download"** (thuộc tính nội bộ `data-format-id`)        | ID này không hiển thị nhưng được gắn vào nút để hệ thống biết cần xử lý định dạng nào khi người dùng nhấn. |

---

## 5. Cơ Chế Hiển Thị Thumbnail

Cơ chế hiển thị ảnh thumbnail được thiết kế để tối ưu trải nghiệm người dùng và đảm bảo luôn có hình ảnh hiển thị.

1.  **Nguồn Tải Ảnh (Ưu tiên API):**
    *   Hệ thống ưu tiên sử dụng URL thumbnail đầy đủ được cung cấp trực tiếp từ API (`meta.thumbnail`). Đây là nguồn chính và đáng tin cậy nhất.

2.  **Cơ Chế Dự Phòng cho YouTube (Fallback):**
    *   Trong trường hợp API không cung cấp URL thumbnail (thường xảy ra ở danh sách kết quả tìm kiếm), hệ thống sẽ tự tạo một URL dự phòng.
    *   Nó sử dụng **Video ID** của YouTube (`item.id`) và ghép vào một cấu trúc URL chuẩn: `https://i.ytimg.com/vi/[VIDEO_ID]/0.jpg`.
    *   Cơ chế này đảm bảo các video YouTube luôn có thumbnail ngay cả khi API không trả về đầy đủ thông tin.
    * Cơ chế này hình như đã tồn tại trong utils rồi hãy check đi nhé nếu tồn tại rồi thì chỉ cần call lại utils

3.  **Hiệu Ứng Skeleton Loading:**
    *   Trong lúc ảnh thumbnail đang được tải về (từ một trong hai nguồn trên), một "bộ xương" (placeholder) với hiệu ứng ánh sáng lấp lánh sẽ được hiển thị.
    *   Khi ảnh tải xong, nó sẽ thay thế cho hiệu ứng skeleton này.

4.  **Tỷ Lệ Khung Hình Cố Định (16:9):**
    *   Hệ thống **luôn buộc** ảnh thumbnail phải hiển thị trong một khung hình có tỷ lệ **16:9** (màn hình rộng/landscape).
    *   Nếu ảnh gốc có tỷ lệ khác, nó sẽ tự động được căn giữa trong khung hình này.

5.  **Xử Lý Lỗi:**
    *   Nếu có lỗi xảy ra và ảnh thumbnail không thể tải về được từ cả hai cơ chế trên, toàn bộ khu vực hiển thị thumbnail sẽ bị ẩn đi.

---

## 6. Cơ Chế Skeleton (Tổng Thể)

*   **Đối với Thumbnail:** Sử dụng hiệu ứng skeleton lấp lánh chi tiết như mô tả ở trên.
*   **Đối với Danh sách Tùy chọn Tải xuống:** Hệ thống không hiển thị skeleton cho từng mục. Thay vào đó, toàn bộ vùng chứa danh sách sẽ **bị ẩn hoàn toàn** trong khi tải dữ liệu và chỉ **hiện ra một lượt** khi dữ liệu đã sẵn sàng.

---

## 7. Xử Lý Tương Tác (Interaction)

*   Khi người dùng nhấn vào nút **"Download"** của một tùy chọn bất kỳ:
    *   Hệ thống sẽ không thực hiện việc tải ngay lập tức.
    *   Thay vào đó, một đoạn mã JavaScript sẽ đọc giá trị của thuộc tính `data-format-id` (ID định danh) được gắn ẩn trên nút đó.
    *   ID này sau đó được sử dụng để gọi đến một service hoặc chức năng xử lý download chuyên biệt, bắt đầu quá trình chuẩn bị và tải tệp về cho người dùng.
