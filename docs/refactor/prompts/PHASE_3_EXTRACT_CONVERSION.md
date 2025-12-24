# GIAI ĐOẠN 3: TRÍCH XUẤT LOGIC CHUYỂN ĐỔI - HƯỚNG DẪN CHO AI

> Giai đoạn: Extract Conversion Logic (Tuần 5-8)
> Mục tiêu: Trích xuất chiến lược chuyển đổi YouTube sang @downloader/core
> Mức độ rủi ro: 🔴 RẤT CAO (logic cốt lõi)
> Tiền đề: Hoàn tất Giai đoạn 1 (utilities) và Giai đoạn 2 (i18n)

---

## ⚠️ QUAN TRỌNG: TÀI LIỆU NÀY KHÔNG CHỨA CODE

- ✅ Đường dẫn files để đọc
- ✅ Việc cần làm, yêu cầu, ràng buộc
- ❌ KHÔNG có ví dụ mã

Bạn PHẢI: đọc mã thật, phân tích sâu chiến lược chuyển đổi, hiểu rõ Dependency Injection, thảo luận KỸ trước khi code.

---

## 🚨 CẢNH BÁO QUAN TRỌNG

Phase 3 là QUAN TRỌNG NHẤT:
- Logic kinh doanh cốt lõi (chuyển đổi YouTube)
- Mã phức tạp (~5.000–8.000 dòng)
- Nguy cơ phá vỡ functionality cao
- Phụ thuộc quản lý state
- BẮT BUỘC dùng Dependency Injection (DI)

KHÔNG được vội vàng. KHÔNG bỏ qua giai đoạn thảo luận.

---

## 📚 PHẢI ĐỌC

Tài liệu:
- `/docs/refactor/MASTER_REFACTOR_DOC.md` (đọc KỸ phần Dependency Injection)
- `/docs/refactor/README.md`
- `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md`
- `/docs/refactor/prompts/PHASE_2_I18N_SYSTEM.md`
- `/CLAUDE.md`

Mã nguồn cần đọc:
- Interface chiến lược: `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/IConversionStrategy.ts`
- BaseStrategy (ĐỌC ĐẦU TIÊN): `.../BaseStrategy.ts` (xác định các chỗ phụ thuộc state/ và gọi updateConversionTask)
- Các chiến lược YouTube: `PollingStrategy.ts`, `StaticDirectStrategy.ts`, `OtherStreamStrategy.ts`, `IOSRamStrategy.ts`
- Factory: `StrategyFactory.ts`
- Hỗ trợ: `polling-progress-mapper.ts`, `conversion/types.ts`, `concurrent-polling.ts`
- So sánh với các app khác (nếu có)
- State management (để TRÁNH phụ thuộc): `apps/ytmp3-clone-3/src/state/`

---

## 🎯 MỤC TIÊU

1) Trích xuất chiến lược chuyển đổi sang `packages/core/conversion/`
- IConversionStrategy, BaseStrategy, PollingStrategy, StaticDirectStrategy, OtherStreamStrategy, IOSRamStrategy, StrategyFactory, types, utilities (PollingProgressMapper, ...)

2) Áp dụng DI
- Chiến lược nhận `StateUpdater` qua DI, KHÔNG import từ state/

3) Trích xuất logic chia sẻ
- Tính tiến độ, concurrent polling, xác thực định dạng, xử lý lỗi

4) Viết tests (≥80%)
- Unit test cho từng chiến lược, mock StateUpdater, mock polling API, test lỗi

5) Di trú ytmp3-clone-4
- Cập nhật imports, truyền StateUpdater, xác minh flow chuyển đổi, xóa file trùng

Tiêu chí: đủ chiến lược trong core, DI đúng, không import state/, tests ≥80%, clone-4 hoạt động như cũ

---

## 🚫 RÀNG BUỘC

KHÔNG ĐƯỢC: import từ state/, hard-code phụ thuộc state, đổi logic chuyển đổi, đổi cách tính tiến độ, bỏ DI, copy code từ tài liệu

PHẢI: dùng DI cho cập nhật state, sao chép logic NGUYÊN VẸN (chỉ gỡ ghép state), viết tests, xác minh hành vi giữ nguyên, thảo luận kỹ kiến trúc

---

## 🔑 DEPENDENCY INJECTION (DI)

Vấn đề hiện tại:
```
Strategy → import trực tiếp updateConversionTask từ state/ → Coupling chặt
```

Giải pháp:
```
Strategy (trong core) → nhận StateUpdater (interface) qua DI → KHÔNG coupling
```

App sẽ cung cấp triển khai StateUpdater.

Trước khi code, cần:
1) Liệt kê TẤT CẢ các chỗ gọi updateConversionTask
2) Liệt kê TẤT CẢ chỗ đọc state (nếu có)
3) Thiết kế interface StateUpdater đủ dùng (tên hàm mang tính ngữ nghĩa)
4) Đề xuất cách chiến lược nhận StateUpdater (constructor, context, ...)
5) Ví dụ app triển khai StateUpdater

Trong thảo luận, giải thích rõ: vị trí gọi updateConversionTask, tham số, interface đề xuất, lợi ích linh hoạt.

---

## 📋 NHIỆM VỤ CHI TIẾT (TÓM TẮT)

Task 1: Phân tích sâu
- Đọc toàn bộ: IConversionStrategy, BaseStrategy, 4 strategies, Factory, PollingProgressMapper, concurrent-polling
- Mỗi strategy: cập nhật state ở đâu, tham số gì, phụ thuộc ngoài, logic polling/API, tính tiến độ
- So sánh giữa các app (nếu khác)
- Rút ra pattern chung

Output: tài liệu phân tích, danh sách tất cả lần gọi updateConversionTask, thiết kế StateUpdater đề xuất, rủi ro

Task 2: Thiết kế StateUpdater
- Định nghĩa methods theo nhu cầu cập nhật: state, progress, statusText, downloadUrl, ...
- Đảm bảo chiến lược không cần biết cấu trúc state cụ thể
- Linh hoạt cho nhiều app (CSR/SSR)

Task 3: Trích xuất BaseStrategy → `packages/core/src/conversion/strategies/BaseStrategy.ts`
- Gỡ import state/, nhận StateUpdater qua constructor
- Không đổi logic helper/abort/error
- Test: mock StateUpdater, verify gọi cập nhật đúng

Task 4: Trích xuất các chiến lược
- PollingStrategy (phức tạp nhất): giữ NGUYÊN tính tiến độ, chuyển pha, fake progress, status rotation; test toàn diện
- StaticDirectStrategy: test flow trực tiếp, progress, lỗi
- OtherStreamStrategy: test stream, lỗi
- IOSRamStrategy: test logic iOS/RAM, lỗi

Task 5: Trích xuất StrategyFactory → `packages/core/src/conversion/StrategyFactory.ts`
- Factory nhận StateUpdater và tiêm vào chiến lược
- Test: chọn strategy đúng theo format/scenario

Task 6: Trích xuất PollingProgressMapper → `packages/core/src/conversion/utils/PollingProgressMapper.ts`
- Test: mapping tiến độ, nhận diện pha, status text, edge cases

Task 7: concurrent-polling (quyết định)
- Phân tích phụ thuộc; quyết định extract sang core hay để trong app

Task 8: Trích xuất types → `packages/core/src/conversion/types/`
- IConversionStrategy, StrategyContext, StrategyResult, TaskState, format types, v.v.

---

## 🔄 QUY TRÌNH

1) Thảo luận (bắt buộc): trình bày phân tích, thiết kế StateUpdater, thứ tự triển khai, rủi ro, câu hỏi mở

2) Triển khai theo thứ tự đã duyệt, với test đi kèm mỗi phần

3) Xác minh rộng rãi
- `pnpm test`, `pnpm test:coverage` (≥80%)
- Chạy clone-4, test mọi loại chuyển đổi (Polling/Static/Other/iOS), lỗi mạng/timeout/URL sai
- So sánh hành vi clone-3 vs clone-4 (cùng URL → kết quả giống hệt)

---

## ✅ ĐỊNH NGHĨA HOÀN THÀNH

- [ ] Tất cả chiến lược trong `packages/core/conversion/`
- [ ] DI đúng, KHÔNG import state/ trong core
- [ ] StrategyFactory, PollingProgressMapper, types trích xuất
- [ ] Coverage ≥ 80%, tests pass
- [ ] ytmp3-clone-4 di trú thành công, hành vi giống hệt clone-3
- [ ] Không lỗi console/TypeScript
- [ ] PR mô tả đầy đủ, được duyệt, merge, cập nhật MASTER_REFACTOR_DOC.md

---

## 📊 CHỈ SỐ KỲ VỌNG

- Dòng mã trích xuất: ~5.000–8.000
- Số tests: ~80–100
- Coverage: 80–90%
- App di trú: 1 (ytmp3-clone-4)
- Chiến lược: 4 (Polling, StaticDirect, OtherStream, IOSRam)
- Loại bỏ phụ thuộc state: 100%

---

Hãy THẢO LUẬN KỸ, CODE CẨN THẬN, TEST ĐẦY ĐỦ. 🚀

