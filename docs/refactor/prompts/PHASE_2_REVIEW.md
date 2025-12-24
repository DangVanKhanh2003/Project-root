# GIAI ĐOẠN 2 - MẪU REVIEW CHO AI

> Giai đoạn: Giai đoạn 2 - Hệ thống I18n
> Loại review: Code Review
> Vai trò: AI Code Reviewer

---

## 📚 PHẢI ĐỌC

- `/docs/refactor/MASTER_REFACTOR_DOC.md`
- `/docs/refactor/REVIEWER_PROMPT.md`
- `/docs/refactor/prompts/PHASE_2_I18N_SYSTEM.md`
- Mô tả PR và toàn bộ files

---

## 🎯 MỤC TIÊU CẦN XÁC MINH

1) Package `@downloader/i18n` (engine + 19 locales + checker + helpers)

2) Hỗ trợ 19 ngôn ngữ (keys giống nhau, en đầy đủ, RTL: ar, ur)

3) Di trú ytmp3-clone-4 (bỏ hardcode, switch ngôn ngữ, RTL hoạt động)

4) Không thay đổi các app khác

---

## ✅ CHECKLIST

1) Cấu trúc package
- [ ] `packages/i18n/package.json` đúng tên, exports, deps tối thiểu, scripts
- [ ] `src/` + `tests/` + `README.md`
- [ ] Export engine, helpers, types

2) Locales
- [ ] Đủ 19 files: en, ar, bn, de, es, fr, hi, id, it, ja, ko, ms, my, pt, ru, th, tr, ur, vi
- [ ] Cùng cấu trúc key (chạy `pnpm check:i18n`)
- [ ] en đầy đủ, placeholders đánh dấu rõ

3) Engine
- [ ] Lookup dot-notation, nội suy, pluralization, fallback en, cảnh báo thiếu
- [ ] SSR: chạy trên Node/Eleventy, không dùng browser-only APIs
- [ ] CSR: chạy trên browser, nạp locale động, bundle hợp lý

4) RTL
- [ ] Nhận diện đúng (ar, ur → RTL; còn lại LTR)
- [ ] Helper `dir`/class RTL
- [ ] Render RTL đúng (dir="rtl", layout mirror)

5) Checker tool
- [ ] Chạy bằng `pnpm check:i18n`
- [ ] Phát hiện key thiếu/không dùng, báo cáo coverage

6) Di trú clone-4
- [ ] Thêm `@downloader/i18n`
- [ ] Không còn chuỗi UI hardcode
- [ ] Toàn bộ UI dùng key dịch
- [ ] Switcher ngôn ngữ hoạt động (persist)
- [ ] Build pass, không lỗi TSC

7) Tests
- [ ] Coverage ≥ 80%
- [ ] Engine, helpers, RTL, checker, SSR/CSR đều có test

---

## 🚨 CRITICAL (PHẢI FAIL REVIEW NẾU GẶP)

- Thiếu ngôn ngữ hoặc keys không nhất quán
- SSR bị hỏng / dùng browser-only trong SSR
- RTL không hoạt động đúng
- Coverage < 80% hoặc thiếu case trọng yếu
- Còn chuỗi hardcode trong clone-4
- Checker dịch không tồn tại/báo sai
- Sửa app khác ngoài clone-4

---

## 📝 GỢI Ý KIỂM TRA NHANH

- `pnpm check:i18n` → 100% keys, không thiếu
- Tìm hardcode: `rg "\b[A-Z][a-z]+\b" apps/ytmp3-clone-4/src` (lọc comment/console)
- Test RTL: đặt ngôn ngữ ar/ur, kiểm tra `dir="rtl"`, UI mirror
- Build: `cd apps/ytmp3-clone-4 && pnpm run build`

---

## 🧪 MẪU BÁO CÁO REVIEW

Tóm tắt: [Approve / Approve with comments / Request Changes]

- Package cấu trúc/exports: [✅/❌]
- 19 locales + key consistency: [✅/❌]
- Engine (SSR+CSR) + RTL: [✅/❌]
- Checker: [✅/❌]
- Clone-4 migrated: [✅/❌]
- Coverage: [X]% (≥80%)

Vấn đề nghiêm trọng: [Liệt kê | Không]

Cảnh báo: [Liệt kê | Không]

Điểm tốt: [Liệt kê]

Đã xác minh:
- `pnpm test`, `pnpm test:coverage`, `pnpm check:i18n`
- `pnpm run build` (clone-4)
- Không còn hardcode UI

Kết luận: [Sẵn sàng merge / Cần sửa / Không]
