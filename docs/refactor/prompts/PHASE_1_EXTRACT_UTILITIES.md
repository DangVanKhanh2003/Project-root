# GIAI ĐOẠN 1: TRÍCH XUẤT UTILITIES - HƯỚNG DẪN CHO AI THỰC THI

> Giai đoạn: Trích xuất Utilities (Tuần 1-2)
> Mục tiêu: Trích xuất các hàm tiện ích sang package @downloader/core
> Mức độ rủi ro: 🟢 Thấp
> Tiền đề: Không (giai đoạn đầu tiên)

---

## ⚠️ QUAN TRỌNG: KHÔNG CÓ MÃ TRONG TÀI LIỆU NÀY

Tài liệu này bao gồm:
- ✅ Đường dẫn file cần đọc
- ✅ Hướng dẫn LÀM GÌ
- ✅ Yêu cầu và ràng buộc
- ❌ KHÔNG có ví dụ mã nguồn

Bạn PHẢI:
- Đọc mã thật trong các file của dự án
- Tự phân tích và hiểu mã
- Đề xuất cách tiếp cận của riêng bạn
- Trao đổi trước khi triển khai

---

## 📚 TÀI LIỆU BẮT BUỘC (ĐỌC TRƯỚC KHI THẢO LUẬN)

Tài liệu quan trọng:
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Bối cảnh đầy đủ của dự án
2. `/docs/refactor/README.md` - Cách sử dụng hệ thống này
3. `/CLAUDE.md` - Nguyên tắc dự án

Các file mã cần đọc và phân tích:

Nguồn chuẩn (ytmp3-clone-3):
- `/apps/ytmp3-clone-3/src/utils/format-utils.ts`
- `/apps/ytmp3-clone-3/src/utils/link-validator.ts`
- `/apps/ytmp3-clone-3/src/utils/download-stream.ts`
- `/apps/ytmp3-clone-3/src/constants/youtube-constants.ts`

So sánh với các app khác:
- `/apps/y2matepro/src/utils/` (các file tương tự)
- `/apps/ytmp3-clone-4/src/utils/` (các file tương tự)
- `/apps/ytmp3-clone-darkmode-3/src/utils/` (các file tương tự)
- `/apps/y2mate-new-ux/src/utils/` (các file tương tự)

Mục đích: Xác nhận các file thực sự giống hệt nhau giữa các app.

Trợ giúp YouTube (nhúng trong input-form.ts):
- `/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`
  - Tìm: hàm `isYouTubeUrl`
  - Tìm: hàm `extractYouTubeVideoId`
  - Tìm: hàm `generateFakeYouTubeData`
  - Tìm: hàm `extractPlaylistId`

---

## 🎯 MỤC TIÊU GIAI ĐOẠN

Mục tiêu chính:

1. Trích xuất utilities sang `packages/core/utils`:
   - format-utils.ts → packages/core/src/utils/format-utils.ts
   - link-validator.ts → packages/core/src/utils/link-validator.ts
   - download-stream.ts → packages/core/src/utils/download-stream.ts
   - các helper YouTube → packages/core/src/utils/youtube/

2. Viết bộ kiểm thử đầy đủ:
   - Mục tiêu: độ bao phủ 80%+
   - Unit test cho từng utility
   - Mock API trình duyệt khi cần

3. Di trú một app:
   - Mục tiêu: ytmp3-clone-4
   - Cập nhật import để dùng @downloader/core
   - Xoá file trùng lặp
   - Xác minh hành vi không đổi

Tiêu chí hoàn thành:
- [ ] Trích xuất đủ 4 module utility
- [ ] Đạt độ bao phủ 80%+
- [ ] Tất cả unit test pass
- [ ] Di trú ytmp3-clone-4 thành công
- [ ] Hành vi của ytmp3-clone-4 giống hệt trước đây
- [ ] Đã xoá các file trùng trong clone-4

---

## 🚫 CÁC RÀNG BUỘC QUAN TRỌNG

KHÔNG ĐƯỢC:
- ❌ Thay đổi logic utilities trong lúc trích xuất
- ❌ Thêm tính năng mới cho utilities
- ❌ Làm hỏng các app hiện có
- ❌ Thay đổi chữ ký hàm
- ❌ Sao chép mã từ tài liệu này (tài liệu không có mã)

PHẢI:
- ✅ Sao chép nguyên vẹn mã từ file nguồn
- ✅ Viết test trước khi di trú
- ✅ Xác minh test pass trên mã gốc trước
- ✅ So sánh hành vi trước/sau khi di trú
- ✅ Trao đổi cách làm trước khi code

---

## 📋 NHIỆM VỤ CHI TIẾT

Nhiệm vụ 1: Phân tích và so sánh file

Việc cần làm:
1. Đọc cả 4 file utility từ ytmp3-clone-3
2. So sánh với các file tương ứng ở 4 app khác
3. Ghi lại mọi khác biệt tìm thấy
4. Xác định phiên bản đầy đủ nhất

Các file cần so sánh:
- `format-utils.ts` trên 5 app
- `link-validator.ts` trên 5 app
- `download-stream.ts` trên 5 app
- `youtube-constants.ts` trên 5 app

Kết quả kỳ vọng:
- Các file giống hệt hoặc gần như giống hệt
- Nếu có khác biệt, hãy ghi lại
- Chọn phiên bản chuẩn (thường là ytmp3-clone-3)

Đầu ra:
- Báo cáo so sánh
- Danh sách khác biệt (nếu có)
- Quyết định chọn phiên bản nào

---

Nhiệm vụ 2: Trích xuất format-utils.ts

Đầu vào: `/apps/ytmp3-clone-3/src/utils/format-utils.ts`

Vị trí đầu ra: `/packages/core/src/utils/format-utils.ts`

Các hàm trong file (tự đọc file để xác định):
- Kiểm tra tất cả các hàm export
- Hiểu chức năng của từng hàm
- Ghi chú mọi phụ thuộc

File test: `/packages/core/src/utils/format-utils.test.ts`

Yêu cầu test:
- Test tất cả hàm export
- Test các biên (null, undefined, chuỗi rỗng)
- Test các loại input khác nhau
- Đạt độ bao phủ 80%+

Xác minh:
- Chạy: `pnpm test format-utils.test.ts`
- Kiểm tra coverage: `pnpm test:coverage`
- Tất cả test phải pass

---

Nhiệm vụ 3: Trích xuất link-validator.ts

Đầu vào: `/apps/ytmp3-clone-3/src/utils/link-validator.ts`

Vị trí đầu ra: `/packages/core/src/utils/link-validator.ts`

Nội dung cần trích:
- Đọc file để tìm tất cả export
- Các hằng số (TTL)
- Các hàm kiểm tra hợp lệ
- Hàm định dạng thời gian

File test: `/packages/core/src/utils/link-validator.test.ts`

Trường hợp test đặc biệt:
- Test với mốc thời gian gần (chưa hết hạn)
- Test với mốc thời gian đã hết hạn
- Test ngay tại ngưỡng TTL
- Test định dạng thời gian cho nhiều khoảng

Xác minh:
- Test pass
- Coverage ≥ 80%

---

Nhiệm vụ 4: Trích xuất download-stream.ts

Đầu vào: `/apps/ytmp3-clone-3/src/utils/download-stream.ts`

Vị trí đầu ra: `/packages/core/src/utils/download-stream.ts`

Lưu ý đặc biệt:
- File này dùng API trình duyệt (fetch, Blob, URL.createObjectURL)
- Test cần mock các API này
- Dùng `vi.mock()` của Vitest để mock

File test: `/packages/core/src/utils/download-stream.test.ts`

Yêu cầu mock:
- Mock `global.fetch`
- Mock `global.URL.createObjectURL`
- Mock `global.URL.revokeObjectURL`
- Test cả tình huống thành công và lỗi

Xác minh:
- Test pass với mocks
- Coverage ≥ 80%

---

Nhiệm vụ 5: Trích xuất các helper YouTube

Đầu vào:
- Hằng số: `/apps/ytmp3-clone-3/src/constants/youtube-constants.ts`
- Hàm: `/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`

Cấu trúc đầu ra:
```
packages/core/src/utils/youtube/
├── constants.ts           # Hằng số cho YouTube API
├── url-parser.ts          # Tách video ID, playlist ID
├── validator.ts           # Hàm isYouTubeUrl
├── fake-data-generator.ts # generateFakeYouTubeData
├── index.ts               # Barrel export
└── [các file test tương ứng]
```

Nội dung cần trích từ input-form.ts:
- Tìm hàm `isYouTubeUrl` (đọc mã để hiểu logic)
- Tìm hàm `extractYouTubeVideoId`
- Tìm hàm `generateFakeYouTubeData`
- Tìm hàm `extractPlaylistId`
- CHỈ trích các hàm này, không lấy cả file

Yêu cầu test:
- Test parse URL với nhiều định dạng YouTube:
  - Chuẩn: youtube.com/watch?v=...
  - Ngắn: youtu.be/...
  - Nhúng: youtube.com/embed/...
  - Mobile: m.youtube.com/...
  - Có timestamp
  - URL không hợp lệ
- Test trích playlist ID
- Test sinh dữ liệu giả

Xác minh:
- Tất cả định dạng URL được xử lý đúng
- Test bao quát
- Coverage ≥ 80%

---

Nhiệm vụ 6: Cập nhật export của package

File cần tạo/cập nhật:

1. `/packages/core/src/utils/index.ts`
   - Export tất cả utilities
   - Theo mẫu barrel export

2. `/packages/core/src/utils/youtube/index.ts`
   - Export toàn bộ helper YouTube
   - Theo mẫu barrel export

3. `/packages/core/package.json`
   - Cập nhật trường exports
   - Thêm entry points mới

Xác minh export hoạt động:
- Thử import từ package
- Kiểm tra TypeScript types được xuất ra

---

Nhiệm vụ 7: Di trú ytmp3-clone-4

Vì sao chọn ytmp3-clone-4:
- Không phải production (an toàn để thử nghiệm)
- Có đầy đủ kiến trúc
- Tương tự clone-3 (dễ đối chiếu)

Các bước:

1. Thêm phụ thuộc:
   - Cập nhật `apps/ytmp3-clone-4/package.json`
   - Thêm `"@downloader/core": "workspace:*"`
   - Chạy `pnpm install`

2. Cập nhật import:
   - Tìm tất cả file đang import từ utils cục bộ
   - Chuyển sang import từ `@downloader/core/utils`
   - Chuyển constants YouTube sang `@downloader/core/utils/youtube`

3. Xoá file cũ:
   - Xoá `apps/ytmp3-clone-4/src/utils/format-utils.ts`
   - Xoá `apps/ytmp3-clone-4/src/utils/link-validator.ts`
   - Xoá `apps/ytmp3-clone-4/src/utils/download-stream.ts`
   - Xoá `apps/ytmp3-clone-4/src/constants/youtube-constants.ts`

4. Kiểm tra:
   - Build: `cd apps/ytmp3-clone-4 && pnpm run build`
   - Chạy dev: `pnpm run dev`
   - Test thủ công: Nhập URL, convert, download
   - So sánh với clone-3 (hành vi phải giống hệt)

Xác minh:
- [ ] App build không lỗi
- [ ] App chạy không có lỗi console
- [ ] Mọi tính năng hoạt động
- [ ] Hành vi giống hệt trước khi di trú

---

## 🔄 QUY TRÌNH LÀM VIỆC CHO GIAI ĐOẠN NÀY

Bước 1: GIAI ĐOẠN THẢO LUẬN (BẮT BUỘC)

Trước khi viết BẤT KỲ mã nào, cần thảo luận:

Gửi tin nhắn cho người phụ trách:

```
Tôi bắt đầu Giai đoạn 1: Trích xuất Utilities

Tài liệu đã đọc:
- ✅ MASTER_REFACTOR_DOC.md
- ✅ README.md
- ✅ PHASE_1_EXTRACT_UTILITIES.md

Các file mã đã phân tích:
- ✅ apps/ytmp3-clone-3/src/utils/format-utils.ts ([X] dòng)
- ✅ apps/ytmp3-clone-3/src/utils/link-validator.ts ([X] dòng)
- ✅ apps/ytmp3-clone-3/src/utils/download-stream.ts ([X] dòng)
- ✅ apps/ytmp3-clone-3/src/constants/youtube-constants.ts ([X] dòng)
- ✅ apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts (các helper YouTube)

Kết quả so sánh:
- format-utils.ts: [Giống hệt/Khác] giữa các app
- link-validator.ts: [Giống hệt/Khác] giữa các app
- download-stream.ts: [Có khác biệt - chi tiết bên dưới]
- youtube-constants.ts: [Giống hệt/Khác] giữa các app

[Nếu có khác biệt, liệt kê tại đây]

Câu hỏi trước khi triển khai:
1. [Câu hỏi của bạn]
2. [Câu hỏi của bạn]

Đề xuất cách làm:
1. Dùng ytmp3-clone-3 làm nguồn chuẩn
2. Trích xuất theo thứ tự: [thứ tự bạn đề xuất]
3. Viết test với [chiến lược]
4. Di trú clone-4 theo [cách tiếp cận]

Rủi ro đã nhận diện:
- [Rủi ro 1]
- [Rủi ro 2]

Chờ bạn phê duyệt để tiếp tục.
```

⚠️ CHỜ PHÊ DUYỆT TRƯỚC KHI CODE

---

Bước 2: GIAI ĐOẠN TRIỂN KHAI

Chỉ sau khi được duyệt:

1. Tạo nhánh: `refactor/phase-1-extract-utilities`

2. Thực hiện theo thứ tự:
   - Nhiệm vụ 1: Phân tích ✓
   - Nhiệm vụ 2: format-utils
   - Nhiệm vụ 3: link-validator
   - Nhiệm vụ 4: download-stream
   - Nhiệm vụ 5: helper YouTube
   - Nhiệm vụ 6: Export package
   - Nhiệm vụ 7: Di trú app

3. Với mỗi nhiệm vụ:
   - Trích mã
   - Viết test
   - Xác minh test pass
   - Kiểm tra coverage

---

Bước 3: GIAI ĐOẠN XÁC MINH

Chạy toàn bộ test:
- `pnpm test` - Unit test
- `pnpm test:coverage` - Kiểm tra 80%+ coverage

Kiểm thử thủ công:
- Chạy ytmp3-clone-4: `cd apps/ytmp3-clone-4 && pnpm run dev`
- Test flow chuyển đổi
- So sánh hành vi với clone-3

Danh sách đối chiếu:
- [ ] Tuỳ chọn định dạng giống nhau
- [ ] Hành vi chuyển đổi giống nhau
- [ ] Xử lý lỗi giống nhau
- [ ] Quy trình tải xuống giống nhau
- [ ] Không có lỗi console
- [ ] Không có lỗi TypeScript

---

Bước 4: GIAI ĐOẠN REVIEW

Tạo PR với:

Tiêu đề: `[Phase 1] Extract utilities to @downloader/core`

Mô tả:
```markdown
## Phase 1: Extract Utilities

### Tóm tắt
Trích xuất 4 module utility sang packages/core/src/utils/

### Thay đổi
- ✅ Tạo packages/core/src/utils/format-utils.ts
- ✅ Tạo packages/core/src/utils/link-validator.ts
- ✅ Tạo packages/core/src/utils/download-stream.ts
- ✅ Tạo packages/core/src/utils/youtube/
- ✅ Viết [X] unit test
- ✅ Đạt [X]% coverage
- ✅ Di trú ytmp3-clone-4
- ✅ Xoá file trùng lặp khỏi clone-4

### Kết quả kiểm thử
- Unit test: [X] test pass
- Coverage: [X]%
- Kiểm thử thủ công: ✅ Tất cả luồng hoạt động tốt

### Xác minh
- clone-3 (gốc): ✅ Hoạt động
- clone-4 (đã di trú): ✅ Hoạt động giống hệt

### File thay đổi
**Thêm:**
- packages/core/src/utils/format-utils.ts ([X] dòng)
- packages/core/src/utils/format-utils.test.ts ([X] dòng)
- [liệt kê các file mới]

**Xoá:**
- apps/ytmp3-clone-4/src/utils/format-utils.ts
- [liệt kê các file đã xoá]

**Sửa:**
- apps/ytmp3-clone-4/package.json (thêm dependency)
- [liệt kê các file sửa phần import]

### Bước tiếp theo
Sẵn sàng cho Giai đoạn 2: Hệ thống I18n
```

Gửi để review (AI Reviewer + Human)

---

## ✅ ĐỊNH NGHĨA HOÀN THÀNH

Giai đoạn 1 hoàn tất khi:

- [ ] Đã trích xuất đủ 4 module utility vào packages/core/src/utils/
- [ ] Đạt độ bao phủ 80%+
- [ ] Tất cả unit test pass
- [ ] Di trú ytmp3-clone-4 thành công
- [ ] Xác minh hành vi ytmp3-clone-4 giống hệt
- [ ] Xoá file trùng lặp khỏi clone-4
- [ ] PR có mô tả đầy đủ
- [ ] PR được duyệt
- [ ] Code được merge vào main
- [ ] Cập nhật tiến độ trong MASTER_REFACTOR_DOC.md

---

## 🆘 XỬ LÝ SỰ CỐ

Nếu file không giống hệt giữa các app:

KHÔNG được tiếp tục một cách mù quáng.

1. Ghi lại toàn bộ khác biệt
2. Phân tích xem phiên bản nào đúng
3. Hỏi ý kiến người phụ trách
4. Đợi phê duyệt

Nếu test fail sau khi trích xuất:

1. Xác minh sao chép mã chính xác
2. Kiểm tra import đúng đắn
3. Đảm bảo không vô tình đổi logic
4. So sánh với file gốc

Nếu app không build được sau khi di trú:

1. Kiểm tra package.json đã có dependency
2. Chạy `pnpm install`
3. Xác minh đường dẫn import chính xác
4. Kiểm tra TypeScript resolve import

Nếu hành vi thay đổi sau khi di trú:

ĐIỀU NÀY RẤT QUAN TRỌNG - KHÔNG ĐƯỢC BỎ QUA

1. So sánh chính xác lời gọi hàm
2. Xác minh cùng input cho cùng output
3. Kiểm tra xem có chỉnh sửa logic nào không
4. Hoàn tác và phân tích nguyên nhân

---

## 📞 MẪU GIAO TIẾP

Khi bắt đầu:
Dùng mẫu ở Bước 1 phía trên.

Cập nhật tiến độ:
```
Cập nhật tiến độ Giai đoạn 1:

Đã hoàn thành:
- ✅ Nhiệm vụ 1: Phân tích xong
- ✅ Nhiệm vụ 2: Trích xuất format-utils ([X] test, [Y]% coverage)
- ✅ Nhiệm vụ 3: Trích xuất link-validator ([X] test, [Y]% coverage)

Đang thực hiện:
- 🟡 Nhiệm vụ 4: download-stream (đang viết test)

Chờ xử lý:
- ⏳ Nhiệm vụ 5: Helper YouTube
- ⏳ Nhiệm vụ 6: Export package
- ⏳ Nhiệm vụ 7: Di trú

Vướng mắc: [Không / Liệt kê vướng mắc]
Thời gian dự kiến hoàn thành: [Ngày]
```

Khi hoàn tất:
```
Giai đoạn 1 Hoàn Thành! 🎉

Tóm tắt:
- Trích xuất 4 module utility
- Viết [X] test
- Đạt [Y]% coverage
- Di trú ytmp3-clone-4
- Tất cả test pass

PR: [link]
Sẵn sàng review.
```

---

## 🎓 MẸO THÀNH CÔNG

Trước khi trích xuất:
- Đọc mã kỹ để hiểu chức năng
- Kiểm tra phụ thuộc
- Tìm logic đặc thù app (hiếm gặp trong utils)

Khi viết test:
- Test happy path trước
- Sau đó test biên
- Rồi test trường hợp lỗi
- Đặt tên test mô tả rõ

Khi di trú app:
- Test build trước
- Rồi test runtime
- So sánh hành vi cẩn thận
- Không giả định là đúng — phải xác minh!

---

## 📊 CHỈ SỐ KỲ VỌNG

Sau Giai đoạn 1:
- Dòng mã trích xuất: ~500 dòng core utils
- Số test: ~40-50 test
- Coverage: 80-90%
- Số app di trú: 1 (ytmp3-clone-4)
- Giảm mã trùng lặp: ~2.000 dòng (trên 5 app)

---

Sẵn sàng bắt đầu Giai đoạn 1! Nhớ: ĐỌC → PHÂN TÍCH → THẢO LUẬN → DUYỆT → CODE 🚀

