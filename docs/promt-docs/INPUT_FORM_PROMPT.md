### **Prompt Kỹ thuật: Mô tả chi tiết Thành phần `@InputForm` (Phiên bản 2)**

**Mục tiêu:** Prompt này định nghĩa đầy đủ về cấu trúc, hành vi, và các trạng thái của thành phần `@InputForm`. AI được yêu cầu sử dụng thông tin này để tái tạo chính xác component, bao gồm cả logic xử lý khi người dùng gửi yêu cầu.

#### **1. Thành phần Cấu thành (Elements)**
*   **Ô nhập liệu chính (`<input type="text">`)**
*   **Nút hành động chính (`<button type="submit">`)**
*   **Nút Xóa (`<button type="button">`)**
*   **Nút Dán (`<button type="button">`)**

#### **2. Hành động và Sự kiện (Actions & Events)**
*   **Nhập liệu/Dán (`on:input`):**
    *   **Logic:** Phân tích nội dung theo thời gian thực để xác định là `URL` hay `Từ khóa` và chuyển component sang trạng thái tương ứng. Nếu là từ khóa, có thể gọi dịch vụ `getSuggestions(keyword)` để lấy gợi ý cho `@SuggestionBox`.
*   **Xóa nội dung (`on:click` trên Nút Xóa):**
    *   **Logic:** Đặt lại giá trị của ô nhập liệu về rỗng và đưa component về "Trạng thái Ban đầu".
*   **Gửi yêu cầu (`on:submit`):**
    *   **Logic:** Đây là hành động cốt lõi. Nó sẽ ngăn chặn hành vi mặc định của form và kích hoạt logic xử lý tương ứng với trạng thái hiện tại của component. **(Xem chi tiết ở mục 4)**.

#### **3. Các Trạng thái và Hành vi (States & Behaviors)**

**Trạng thái 1: Ban đầu (Initial)**
*   **Điều kiện:** Component vừa được tải hoặc input rỗng.
*   **Giao diện:** Placeholder "Dán link video hoặc nhập từ khóa...", nhãn nút "Bắt đầu".

**Trạng thái 2: Nhập Từ khóa (Keyword Input)**
*   **Điều kiện:** Input không phải là một URL.
*   **Giao diện:** Nhãn nút "Tìm kiếm".
*   **Logic liên quan:** Hiển thị `@SuggestionBox`.

**Trạng thái 3: Nhập Liên kết (URL Input)**
*   **Điều kiện:** Input là một URL.
*   **Giao diện:** Nhãn nút "Tải xuống".
*   **Logic liên quan:** Ẩn `@SuggestionBox`.

**Trạng thái 4: Đang xử lý (Loading)**
*   **Điều kiện:** Đã gửi yêu cầu và đang chờ phản hồi.
*   **Giao diện:** Vô hiệu hóa form, hiển thị biểu tượng chờ.

#### **4. Logic Xử lý khi Gửi Yêu cầu (Submit Logic)**

Đây là phần bổ sung quan trọng, mô tả hành động xảy ra khi sự kiện `on:submit` được kích hoạt ở các trạng thái khác nhau.

*   **Khi ở "Trạng thái Nhập Từ khóa":**
    *   **Hành động:** Hệ thống lấy từ khóa từ ô nhập liệu.
    *   **Gọi Dịch vụ:** Gọi phương thức `searchTitle(keyword)` từ thư viện `downloader-lib-standalone`.
    *   **Kết quả mong đợi:** Một danh sách các video (gồm ID và tiêu đề). Dữ liệu này sẽ được chuyển cho component `@GalleryResult` để hiển thị.

*   **Khi ở "Trạng thái Nhập Liên kết":**
    *   **Hành động:** Hệ thống lấy URL từ ô nhập liệu.
    *   **Gọi Dịch vụ:** Gọi phương thức `extractMedia(url)` từ thư viện `downloader-lib-standalone`.
    *   **Kết quả mong đợi (phân nhánh):**
        *   **Nếu kết quả có chứa `gallery`:** Dữ liệu sẽ được chuyển cho component `@GalleryResult` để hiển thị bộ sưu tập.
        *   **Nếu kết quả không chứa `gallery`:** Dữ liệu sẽ được chuyển cho component `@SingleMediaResult` để hiển thị chi tiết media đơn lẻ.


  Tổng kết Luồng Xử lý và Hiển thị

  Luồng 1: Tìm kiếm bằng TỪ KHÓA

   1. Chức năng chính: Xử lý yêu cầu tìm kiếm từ một từ khóa.
   2. Lệnh gọi thư viện: service.searchTitle(keyword)
   3. Dữ liệu thư viện trả về: Một mảng (Array) các đối tượng video, mỗi đối tượng chứa id và title.
       * Ví dụ: [{ id: 'v1', title: 'Video 1' }, { id: 'v2', title: 'Video 2' }]
   4. Xử lý dữ liệu: Dữ liệu được dùng trực tiếp để tạo danh sách. Các title có thể cần được giải mã Unicode.
   5. Giao diện hiển thị: Search Result Form (sử dụng component @GalleryResult). Giao diện này sẽ hiển thị một danh sách các video tìm được.

  ---

  Luồng 2: Xử lý URL (trả về Media Đơn lẻ)

   1. Chức năng chính: Xử lý một URL trỏ đến một nội dung media duy nhất (ví dụ: 1 video YouTube, 1 video TikTok).
   2. Lệnh gọi thư viện: service.extractMedia(url)
   3. Dữ liệu thư viện trả về: Một đối tượng (Object) media chi tiết. Điều kiện nhận biết: Đối tượng này không có thuộc tính gallery hoặc thuộc tính
      gallery rỗng/null.
       * Ví dụ: { meta: { title: '...' }, formats: { video: [...], audio: [...] }, gallery: null }
   4. Xử lý dữ liệu: Trích xuất thông tin meta (tiêu đề, ảnh đại diện) và formats (danh sách các định dạng có thể tải về).
   5. Giao diện hiển thị: Download-Option Form (sử dụng component @SingleMediaResult). Giao diện này hiển thị chi tiết của media và các nút để tải xuống.

  ---

  Luồng 3: Xử lý URL (trả về Bộ sưu tập từ một Bài đăng)

   1. Chức năng chính: Xử lý một URL trỏ đến một bài đăng chứa nhiều media (ví dụ: 1 post Instagram có nhiều ảnh/video).
   2. Lệnh gọi thư viện: service.extractMedia(url)
   3. Dữ liệu thư viện trả về: Một đối tượng media chi tiết. Điều kiện nhận biết: Đối tượng này có thuộc tính gallery là một mảng chứa danh sách các
      media con.
       * Ví dụ: { meta: { ... }, formats: { ... }, gallery: [{ id: 'img1', ... }, { id: 'vid1', ... }] }
   4. Xử lý dữ liệu: Bỏ qua các thuộc tính formats ở cấp cao nhất, thay vào đó lấy mảng gallery làm nguồn dữ liệu chính để hiển thị.
   5. Giao diện hiển thị: Gallery Form (sử dụng component @GalleryResult). Giao diện này sẽ hiển thị một lưới các media con có trong bài đăng đó.

  ---

  Luồng 4: Xử lý URL (trả về Playlist)

   1. Chức năng chính: Xử lý một URL trỏ đến một danh sách phát (ví dụ: 1 playlist YouTube).
   2. Lệnh gọi thư viện: service.extractPlaylist(url)
   3. Dữ liệu thư viện trả về: Một đối tượng chứa thông tin của playlist và một mảng items là danh sách các video.
       * Ví dụ: { title: 'My Playlist', items: [{ id: 'v1', title: '...' }, { id: 'v2', title: '...' }] }
   4. Xử lý dữ liệu: Lấy mảng items làm nguồn dữ liệu chính để hiển thị.
   5. Giao diện hiển thị: Gallery Form (sử dụng component @GalleryResult). Giao diện này sẽ hiển thị danh sách tất cả các video có trong playlist.   Tổng kết Luồng Xử lý và Hiển thị

  Luồng 1: Tìm kiếm bằng TỪ KHÓA

   1. Chức năng chính: Xử lý yêu cầu tìm kiếm từ một từ khóa.
   2. Lệnh gọi thư viện: service.searchTitle(keyword)
   3. Dữ liệu thư viện trả về: Một mảng (Array) các đối tượng video, mỗi đối tượng chứa id và title.
       * Ví dụ: [{ id: 'v1', title: 'Video 1' }, { id: 'v2', title: 'Video 2' }]
   4. Xử lý dữ liệu: Dữ liệu được dùng trực tiếp để tạo danh sách. Các title có thể cần được giải mã Unicode.
   5. Giao diện hiển thị: Search Result Form (sử dụng component @GalleryResult). Giao diện này sẽ hiển thị một danh sách các video tìm được.

  ---

  Luồng 2: Xử lý URL (trả về Media Đơn lẻ)

   1. Chức năng chính: Xử lý một URL trỏ đến một nội dung media duy nhất (ví dụ: 1 video YouTube, 1 video TikTok).
   2. Lệnh gọi thư viện: service.extractMedia(url)
   3. Dữ liệu thư viện trả về: Một đối tượng (Object) media chi tiết. Điều kiện nhận biết: Đối tượng này không có thuộc tính gallery hoặc thuộc tính
      gallery rỗng/null.
       * Ví dụ: { meta: { title: '...' }, formats: { video: [...], audio: [...] }, gallery: null }
   4. Xử lý dữ liệu: Trích xuất thông tin meta (tiêu đề, ảnh đại diện) và formats (danh sách các định dạng có thể tải về).
   5. Giao diện hiển thị: Download-Option Form (sử dụng component @SingleMediaResult). Giao diện này hiển thị chi tiết của media và các nút để tải xuống.

  ---

  Luồng 3: Xử lý URL (trả về Bộ sưu tập từ một Bài đăng)

   1. Chức năng chính: Xử lý một URL trỏ đến một bài đăng chứa nhiều media (ví dụ: 1 post Instagram có nhiều ảnh/video).
   2. Lệnh gọi thư viện: service.extractMedia(url)
   3. Dữ liệu thư viện trả về: Một đối tượng media chi tiết. Điều kiện nhận biết: Đối tượng này có thuộc tính gallery là một mảng chứa danh sách các
      media con.
       * Ví dụ: { meta: { ... }, formats: { ... }, gallery: [{ id: 'img1', ... }, { id: 'vid1', ... }] }
   4. Xử lý dữ liệu: Bỏ qua các thuộc tính formats ở cấp cao nhất, thay vào đó lấy mảng gallery làm nguồn dữ liệu chính để hiển thị.
   5. Giao diện hiển thị: Gallery Form (sử dụng component @GalleryResult). Giao diện này sẽ hiển thị một lưới các media con có trong bài đăng đó.

  ---

  Luồng 4: Xử lý URL (trả về Playlist)

   1. Chức năng chính: Xử lý một URL trỏ đến một danh sách phát (ví dụ: 1 playlist YouTube).
   2. Lệnh gọi thư viện: service.extractPlaylist(url)
   3. Dữ liệu thư viện trả về: Một đối tượng chứa thông tin của playlist và một mảng items là danh sách các video.
       * Ví dụ: { title: 'My Playlist', items: [{ id: 'v1', title: '...' }, { id: 'v2', title: '...' }] }
   4. Xử lý dữ liệu: Lấy mảng items làm nguồn dữ liệu chính để hiển thị.
   5. Giao diện hiển thị: Gallery Form (sử dụng component @GalleryResult). Giao diện này sẽ hiển thị danh sách tất cả các video có trong playlist.



   * Logic: Sử dụng hàm detectYouTubeContentType(input) của thư viện.
   * Hành động:
       * Nếu hàm trả về `'playlist'`: Hệ thống xác định đây là một Playlist. Luồng kiểm tra dừng lại và hệ thống sẽ gọi service.extractPlaylist(input).
       * Nếu hàm trả về `'video'`: Chuyển sang Bước 2.



  Bước 2: Kiểm tra có phải là URL thông thường không?

   * Logic: Sử dụng hàm isLikelyUrl(input) của thư viện. Hàm này sử dụng một biểu thức chính quy (regex) đã được định nghĩa sẵn để kiểm tra.
   * Hành động:
       * Nếu hàm trả về `true`: Hệ thống xác định đây là một URL Media. Luồng kiểm tra dừng lại và hệ thống sẽ gọi service.extractMedia(input).
       * Nếu hàm trả về `false`: Chuyển sang Bước 3.

  Bước 3: Mặc định là Từ khóa

   * Logic: Nếu input không phải là playlist và cũng không giống một URL, nó sẽ được coi là một từ khóa tìm kiếm.
   * Hành động:
       * Hệ thống xác định đây là một Từ khóa. Nó sẽ gọi service.searchTitle(input).