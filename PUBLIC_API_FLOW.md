# Tài Liệu Luồng Xử Lý API Công Khai (oEmbed)

Tài liệu này mô tả chi tiết luồng dữ liệu và xử lý khi ứng dụng lấy thông tin metadata của video (tiêu đề, thumbnail, tác giả) từ API công khai của YouTube.

## Tổng Quan

Để tránh sự phức tạp và yêu cầu xác thực của YouTube Data API v3, ứng dụng sử dụng endpoint `oEmbed` công khai, không cần API key. Luồng xử lý được chia thành 3 tầng rõ rệt: **Remote Library**, **Service (thông qua Verifier)**, và **Verifier**, nhằm đảm bảo dữ liệu sạch, nhất quán và được kiểm tra trước khi hiển thị cho người dùng.

Luồng dữ liệu cơ bản:
`UI` → `VerifiedService.getYouTubeMetadata(url)` → `YouTubePublicApi.getMetadata(url)` → `YouTube oEmbed Endpoint` → `Normalizer` → `Policy` → `UI`

---

## Phân Tích Từng Tầng

### Tầng 1: Remote Library (`youtube-public-api.js`)

Lớp này chịu trách nhiệm duy nhất cho việc giao tiếp trực tiếp với endpoint của YouTube.

- **Tên file**: `src/script/libs/downloader-lib-standalone/remote/youtube-public-api.js`
- **Hàm chính**: `createYouTubePublicApiService()` trả về một object có phương thức `getMetadata(url)`.
- **Cơ chế hoạt động**:
    1.  **Trích xuất Video ID**: Nhận một URL YouTube và dùng regex để lấy ra video ID (chuỗi 11 ký tự). Nó có khả năng xử lý nhiều định dạng link (`watch`, `youtu.be`, `shorts`, `embed`).
    2.  **Gọi oEmbed**: Gửi một yêu cầu `GET` tới `https://www.youtube.com/oembed` với tham số là URL của video.
    3.  **Tự động thử lại**: Nếu gặp lỗi mạng hoặc lỗi máy chủ (5xx), nó sẽ tự động thử lại yêu cầu một lần nữa để tăng độ tin cậy.
    4.  **Kết quả**: Trả về dữ liệu JSON thô do YouTube cung cấp hoặc ném ra lỗi (throw error) nếu thất bại.

### Tầng 2: Service & Normalizer (Được gọi bởi Verifier)

Tầng này không được gọi trực tiếp từ UI cho tác vụ này. Thay vào đó, tầng Verifier sẽ gọi nó để chuẩn hóa dữ liệu.

- **Tên file liên quan**: `src/script/libs/downloader-lib-standalone/remote/normalizers.js`
- **Hàm liên quan**: `normalizeYouTubeOembed()`
- **Cơ chế hoạt động**:
    1.  **Nhận dữ liệu thô**: Hàm `normalizeYouTubeOembed` nhận dữ liệu JSON thô từ tầng Remote Library.
    2.  **Chuẩn hóa**: Nó trích xuất các trường quan trọng (`title`, `author_name`, `thumbnail_url`, v.v.) và cấu trúc lại chúng thành một object `meta` đồng nhất mà toàn bộ ứng dụng có thể sử dụng. Điều này giúp tách biệt logic của ứng dụng khỏi cấu trúc dữ liệu có thể thay đổi của API bên ngoài.

### Tầng 3: Verifier Service (`verifier.js`)

Đây là lớp "cổng giao tiếp" (gateway) mà UI tương tác. Nó đóng vai trò điều phối, xác thực và đảm bảo tính toàn vẹn của dữ liệu.

- **Tên file**: `src/script/libs/downloader-lib-standalone/remote/verifier.js`
- **Hàm chính**: `createVerifiedService()` tạo ra một service đã được "xác thực".
- **Phương thức liên quan**: `getYouTubeMetadata(url)`
- **Cơ chế hoạt động**:
    1.  **Điều phối**: Khi UI gọi `verifiedService.getYouTubeMetadata(url)`, phương thức này trong `verifier.js` sẽ được thực thi.
    2.  **Gọi Tầng Remote**: Nó gọi `youtubePublicApi.getMetadata(url)` (Tầng 1) để lấy dữ liệu thô.
    3.  **Xử lý lỗi tập trung**: Toàn bộ quá trình được bọc trong một khối `try...catch`. Bất kỳ lỗi nào từ tầng dưới (lỗi mạng, video không tìm thấy) đều được bắt lại tại đây.
    4.  **Gọi Tầng Normalizer**: Nếu thành công, nó chuyển dữ liệu thô cho hàm `normalizeYouTubeOembed()` (Tầng 2) để có được dữ liệu đã được chuẩn hóa.
    5.  **Áp dụng Chính sách (Policy)**: Dữ liệu đã chuẩn hóa được kiểm tra dựa trên một "chính sách" (`DefaultPolicies.getYouTubeMetadata`). Chính sách này đảm bảo dữ liệu hợp lệ (ví dụ: phải có `title`). Nếu dữ liệu không đầy đủ, nó sẽ tạo ra một kết quả "cảnh báo" (warning).
    6.  **Đóng gói kết quả (Result Envelope)**: Cuối cùng, nó đóng gói kết quả vào một object `VerifiedResult` tiêu chuẩn, có cấu trúc `{ ok, status, code, message, data, raw }`.
        - `ok: true`: Nếu mọi thứ thành công.
        - `ok: false`: Nếu có lỗi hoặc cảnh báo.
        - `message`: Chứa thông báo lỗi thân thiện với người dùng.
        - `data`: Chứa dữ liệu đã được chuẩn hóa.

---

## Luồng Dữ Liệu Chi Tiết (End-to-End)

1.  **UI Layer**: Người dùng nhập URL. `input-form.js` gọi `verifiedService.getYouTubeMetadata(url)`.
2.  **Verifier Layer**:
    - `getYouTubeMetadata` được kích hoạt.
    - Nó gọi `youtubePublicApi.getMetadata(url)`.
3.  **Remote Lib Layer**:
    - `getMetadata` lấy video ID, gọi API `oEmbed` của YouTube.
    - YouTube trả về JSON thô.
4.  **Verifier Layer (tiếp tục)**:
    - `verifier` nhận JSON thô.
    - Nó gọi `normalizeYouTubeOembed` để làm sạch và cấu trúc lại dữ liệu.
    - Nó kiểm tra dữ liệu đã chuẩn hóa bằng `Policy` (ví dụ: tiêu đề có tồn tại không?).
    - Nó tạo một object `VerifiedResult` (ví dụ: `{ok: true, data: {meta: {...}}}`).
5.  **UI Layer (kết thúc)**:
    - UI nhận object `VerifiedResult`.
    - Nếu `result.ok` là `true`, UI sẽ dùng `result.data` để gọi `renderPreview()` và hiển thị thông tin video.
    - Nếu `result.ok` là `false`, UI sẽ hiển thị `result.message` cho người dùng.

---

## Ví dụ Thực Tế

Lấy video "Never Gonna Give You Up" (`dQw4w9WgXcQ`) làm ví dụ.

### 1. Lệnh `cURL` Mẫu

Đây là cách gọi API oEmbed trực tiếp bằng cURL.

```bash
curl "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json"
```

### 2. Input (Dữ liệu JSON thô từ YouTube)

Lệnh cURL trên sẽ trả về một object JSON thô như sau. Đây là `Input` cho tầng `Normalizer`.

```json
{
  "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
  "author_name": "Rick Astley",
  "author_url": "https://www.youtube.com/@RickAstleyVEVO",
  "type": "video",
  "height": 113,
  "width": 200,
  "version": "1.0",
  "provider_name": "YouTube",
  "provider_url": "https://www.youtube.com/",
  "thumbnail_height": 360,
  "thumbnail_width": 480,
  "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "html": "<iframe width=\"200\" height=\"113\" src=\"https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen title=\"Rick Astley - Never Gonna Give You Up (Official Music Video)\"></iframe>"
}
```

### 3. Output (Object `VerifiedResult` cuối cùng)

Sau khi đi qua `Normalizer` và `Verifier`, UI sẽ nhận được một object `VerifiedResult` đã được chuẩn hóa và đóng gói như sau. Đây là `Output` của toàn bộ luồng.

```json
{
  "ok": true,
  "status": "success",
  "code": "OK",
  "message": "Success",
  "data": {
    "meta": {
      "id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
      "author": "Rick Astley",
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    },
    "formats": {
      "video": [],
      "audio": []
    },
    "gallery": null
  },
  "raw": null
}
```
