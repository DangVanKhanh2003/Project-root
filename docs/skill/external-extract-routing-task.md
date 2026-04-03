# Task: Tích hợp External Extract API + Priority Routing

## Mục tiêu

Thêm External Extract API (cc.ytconvert.org) làm đường download thay thế cho V3 API, với cơ chế routing theo quốc gia và silent fallback khi API primary fail.

## Bối cảnh nghiệp vụ

Hệ thống hiện có 2 API backend cho download:

- **V3 API** (hub.ytconvert.org) — 2 bước: tạo job → poll status → lấy download URL. Hỗ trợ tất cả format.
- **External Extract API** (cc.ytconvert.org) — 1 request trả download URL trực tiếp, không cần polling. Chỉ hỗ trợ mp3 và mp4.

Routing dựa trên 3 yếu tố:
1. **Supporter** (có license key) → luôn dùng V3 trước
2. **Format** — nếu không phải mp3/mp4 → chỉ dùng V3 (external API không hỗ trợ)
3. **Quốc gia** — India (IN), Indonesia (ID) → dùng External trước; các nước khác → V3 trước

Cả 2 chiều đều có **silent fallback**: nếu API primary fail → tự động thử API còn lại mà user không biết.

## Những gì đã có sẵn trong @downloader/core

Package `@downloader/core` (tại `packages/core/`) đã được update với:

- **Models**: `ExternalExtractRequest`, `ExternalExtractResponse` (trong `models/remote/v3/`)
- **Service**: `createExternalExtractService()` — factory tạo service, POST `/api/v2/download`
- **Interface**: `IExternalExtractService` — interface cho service
- **Mapper**: `mapToExternalExtractRequest(url, options)` và `mapExternalExtractResponse(response, url, options)`
- **Endpoint**: `EXTERNAL_EXTRACT_ENDPOINTS.DOWNLOAD = '/api/v2/download'`
- **Verified Services**: `CoreServices.externalExtract` đã registered, public API `externalExtract.extract()`

Tất cả đã export từ `@downloader/core`. Agent chỉ cần import và sử dụng.

## Công việc cần làm cho mỗi site

### Bước 1: Research cấu trúc project

Trước khi code, agent PHẢI tìm hiểu kỹ project được phân công:

- **Xác định tech stack**: TypeScript hay JavaScript? Dùng `@downloader/core` hay standalone lib?
- **Tìm file API setup**: File nào tạo HTTP client và service? (thường trong `src/api/` hoặc `src/script/libs/`)
- **Tìm file environment/config**: File nào chứa API URLs và timeouts?
- **Tìm luồng single download**: File nào thực hiện download đơn? Nó gọi API như thế nào?
- **Tìm luồng multiple download** (nếu có): File nào thực hiện download hàng loạt? Có reuse logic download đơn không?
- **Tìm luồng playlist/channel** (nếu có): Thường reuse download runner của multiple download
- **Kiểm tra page init**: Các file entry point (main.ts, multi-downloader-main.ts...) đã gọi `initAllowedFeatures()` chưa?
- **Kiểm tra cơ chế country cache**: Site đã có allowed-features/country cache trong localStorage chưa?

### Bước 2: Thêm config External Extract API

- Thêm base URL `https://cc.ytconvert.org` vào environment/config
- Thêm timeout: 5 phút (300.000ms)
- Tạo HTTP client riêng cho External Extract API
- Tạo service instance bằng `createExternalExtractService()`

### Bước 3: Tạo Priority Extract Router

Tạo module routing với các thành phần:

**Country cache reader:**
- Đọc country từ localStorage cache đã có (từ allowed-features)
- Nếu chưa có cache → trả null (KHÔNG block, KHÔNG gọi API)

**Strategy resolver:**
- Input: quality options (downloadMode, format, bitrate...)
- Output: `'external-first'` hoặc `'v3-first'`
- Logic: supporter → v3-first; format != mp3/mp4 → v3-first; country IN/ID → external-first; default → v3-first

**External extract caller (shared):**
- Gọi External Extract API với retry (tối đa 3 lần tổng cộng)
- Dùng `mapToExternalExtractRequest()` để tạo request
- Dùng `mapExternalExtractResponse()` để normalize response
- Trả `{ ok, data?, error? }`

### Bước 4: Tích hợp vào luồng download

**Nguyên tắc chung cho MỌI luồng download:**

1. Resolve strategy TRƯỚC khi bắt đầu download
2. Nếu `external-first`:
   - Gọi External Extract → nếu OK → hoàn tất (không cần polling)
   - Nếu fail → silent fallback sang V3 flow
3. Nếu `v3-first`:
   - Chạy V3 flow → nếu OK → hoàn tất
   - Nếu fail → fallback sang External Extract (chỉ nếu format là mp3/mp4)
4. Nếu cả 2 fail → báo lỗi

**Lưu ý quan trọng:**
- External Extract trả download URL trực tiếp → KHÔNG cần polling, state chuyển thẳng sang completed
- V3 flow vẫn giữ nguyên logic cũ (create job → poll → download)
- Fallback phải SILENT — không thay đổi UI, không hiện thông báo chuyển API
- V3 extract retry tối đa 3 lần (1 lần đầu + 2 retry)

### Bước 5: Đảm bảo country cache được warm

- Kiểm tra TẤT CẢ file entry point (main page, multi download page, playlist page, channel page...)
- Mỗi page PHẢI gọi `initAllowedFeatures()` khi load để pre-warm country cache
- Nếu chưa có → thêm vào phần init của page
- `initAllowedFeatures()` tự xử lý: có cache hợp lệ → skip; cache hết hạn hoặc chưa có → fetch API background

## Lưu ý cho Agent

- KHÔNG giả định cấu trúc project giống ytmp4.gg. Mỗi site có thể khác nhau hoàn toàn về file structure, naming convention, và cách tổ chức code.
- KHÔNG giả định site có multiple download, playlist, hay channel. Một số site chỉ có single download.
- Luôn research project trước, hiểu rõ cấu trúc rồi mới bắt đầu code.
- Kiểm tra xem site dùng `@downloader/core` hay standalone lib — cách tích hợp sẽ khác nhau đáng kể.
- Build test sau khi hoàn thành để đảm bảo không có lỗi TypeScript/JavaScript.
