# GIAI ĐOẠN 3 - MẪU REVIEW CHO AI (RẤT QUAN TRỌNG)

> Giai đoạn: Giai đoạn 3 - Trích xuất logic chuyển đổi
> Loại review: Code Review
> Vai trò: AI Code Reviewer
> ⚠️ LƯU Ý: Review QUAN TRỌNG NHẤT (logic cốt lõi)

---

## 📚 PHẢI ĐỌC

- `/docs/refactor/MASTER_REFACTOR_DOC.md` (phần DI)
- `/docs/refactor/REVIEWER_PROMPT.md`
- `/docs/refactor/prompts/PHASE_3_EXTRACT_CONVERSION.md`
- Mô tả PR + toàn bộ files

---

## 🎯 MỤC TIÊU CẦN XÁC MINH

1) Trích xuất đầy đủ chiến lược vào `packages/core/conversion/`
- IConversionStrategy, BaseStrategy, Polling, StaticDirect, OtherStream, IOSRam, StrategyFactory, PollingProgressMapper

2) Dependency Injection
- Có StateUpdater interface
- Mọi chiến lược nhận StateUpdater (KHÔNG import từ state/)
- Factory tiêm StateUpdater đúng cách

3) Tests
- Coverage ≥ 80%
- Mock StateUpdater + API polling
- Mỗi chiến lược có test, PollingStrategy test toàn diện

4) Di trú ytmp3-clone-4
- Cài StateUpdater ở app
- Tất cả loại chuyển đổi hoạt động
- Hành vi KHÔNG đổi

---

## ✅ CHECKLIST REVIEW

1) DI (CỰC KỲ QUAN TRỌNG)
- [ ] Có file định nghĩa StateUpdater (typed, semantic)
- [ ] KHÔNG có import từ state/ trong core (tìm bằng `rg "from .*state/" packages/core/src/conversion`)
- [ ] BaseStrategy nhận & dùng StateUpdater
- [ ] Factory nhận & truyền StateUpdater cho strategies

2) Trích xuất chiến lược
- [ ] Tồn tại đủ files trong core
- [ ] Logic chuyển đổi GIỮ NGUYÊN (chỉ gỡ coupling)
- [ ] Không đổi endpoints, validation, thông báo lỗi
- [ ] BaseStrategy là abstract, typed chuẩn
- [ ] PollingStrategy: pha tiến độ, fake progress, status rotation GIỮ NGUYÊN

3) Tests
- [ ] Coverage chung ≥ 80%
- [ ] Có mock StateUpdater & API
- [ ] Per-strategy tests (đặc biệt PollingStrategy)
- [ ] Factory tests (chọn đúng strategy, DI đúng)
- [ ] PollingProgressMapper tests

4) Clone-4 migration
- [ ] Có triển khai StateUpdater ở app
- [ ] Xoá chiến lược cũ khỏi app; imports dùng `@downloader/core/conversion`
- [ ] Khởi tạo strategies qua Factory + StateUpdater

5) Hành vi & chất lượng
- [ ] Hành vi giống hệt clone-3 (test cùng URLs)
- [ ] Tiến độ/pha giống hệt, lỗi/timeout xử lý đúng
- [ ] Không đổi logic, không thêm tính năng
- [ ] TypeScript strict, không `any`

---

## 🚨 CRITICAL (PHẢI FAIL REVIEW NẾU GẶP)

- Import từ state/ trong core
- Đổi logic chuyển đổi / endpoints / tính tiến độ
- Bỏ qua DI / không có StateUpdater
- Coverage < 80% hoặc thiếu PollingStrategy tests
- Clone-4 hành vi khác bản gốc

---

## 📝 GỢI Ý KIỂM TRA NHANH

- Tìm import state: `rg "from .*state/" packages/core/src/conversion`
- So sánh logic: `diff` giữa core và apps/ytmp3-clone-3 (bỏ qua phần DI)
- Build + test clone-4, thử các loại chuyển đổi & lỗi

---

## 🧪 MẪU BÁO CÁO REVIEW

Tóm tắt: [Approve / Approve with comments / Request Changes]

- DI: [✅/❌] – StateUpdater: [OK/Thiếu], Import state/: [Không/Có]
- Trích xuất chiến lược: [✅/❌] – Logic giữ nguyên: [✅/❌]
- Tests: [✅/❌] – Coverage: [X]% (≥80%) – PollingStrategy đầy đủ: [✅/❌]
- Migration clone-4: [✅/❌]
- Hành vi không đổi: [✅/❌]

Vấn đề nghiêm trọng: [Liệt kê | Không]

Cảnh báo: [Liệt kê | Không]

Điểm tốt: [Liệt kê]

Đã xác minh:
- `pnpm test`, `pnpm test:coverage`
- Build & chạy clone-4
- So sánh hành vi clone-3 vs clone-4

Kết luận: [Sẵn sàng merge / Cần sửa / Không]
