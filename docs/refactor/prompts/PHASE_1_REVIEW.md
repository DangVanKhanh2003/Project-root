# GIAI ĐOẠN 1 - MẪU REVIEW CHO AI

> Giai đoạn: Giai đoạn 1 - Trích xuất tiện ích
> Loại review: Code Review
> Vai trò: AI Code Reviewer

---

## 📚 PHẢI ĐỌC TRƯỚC KHI REVIEW

- `/docs/refactor/MASTER_REFACTOR_DOC.md`
- `/docs/refactor/REVIEWER_PROMPT.md`
- `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md`
- Mô tả PR và toàn bộ files

---

## 🎯 MỤC TIÊU CẦN XÁC MINH

1) Trích xuất 4 utilities về `packages/core/src/utils/`
- format-utils.ts, link-validator.ts, download-stream.ts, youtube/*

2) Tests đầy đủ (≥ 80%) và mock API trình duyệt khi cần

3) Di trú ytmp3-clone-4 (cập nhật imports, xoá files trùng, hành vi giữ nguyên)

4) Không thay đổi app khác

---

## ✅ CHECKLIST REVIEW

1) Extraction
- [ ] Có các files trong `packages/core/src/utils/`
- [ ] Code sao chép NGUYÊN VẸN (chỉ sửa import nếu cần)
- [ ] Không đổi logic, chữ ký hàm, types, comments
- [ ] Không phụ thuộc state/, UI, app-specific

2) Tests
- [ ] Coverage chung ≥ 80%
- [ ] Test đủ cho: format-utils, link-validator, download-stream, youtube helpers
- [ ] Mock `fetch`, `URL.createObjectURL`, `URL.revokeObjectURL` (download-stream)
- [ ] Test happy path, edge cases, error cases

3) Package structure
- [ ] `packages/core/package.json` exports đúng
- [ ] `packages/core/src/utils/index.ts` export đủ modules
- [ ] `packages/core/src/utils/youtube/index.ts` barrel export
- [ ] Không lỗi TypeScript, strict mode ok

4) Migration ytmp3-clone-4
- [ ] Đã xoá utils trùng trong app
- [ ] `apps/ytmp3-clone-4/package.json` thêm `@downloader/core`
- [ ] Imports đổi sang `@downloader/core/utils` và `@downloader/core/utils/youtube`
- [ ] Build pass, không lỗi TSC, không console errors

5) Hành vi
- [ ] Tùy chọn định dạng, chuyển đổi, lỗi, tải xuống giống trước
- [ ] Không đổi hành vi, không regression

---

## 🚨 CRITICAL (PHẢI FAIL REVIEW NẾU GẶP)

- Thay đổi logic utilities hoặc thêm tính năng
- Import từ state/ trong package core
- Coverage < 80% hoặc thiếu mock browser APIs
- Hành vi app thay đổi sau di trú
- Sửa các app khác ngoài clone-4

---

## 📝 GỢI Ý KIỂM TRA NHANH

- So sánh file trích xuất với bản gốc: dùng `diff` giữa core và apps/ytmp3-clone-3
- Tìm import cũ trong clone-4: `rg "from.*utils/format-utils" apps/ytmp3-clone-4/src`
- Tìm import mới: `rg "@downloader/core" apps/ytmp3-clone-4/src`
- Chạy build: `cd apps/ytmp3-clone-4 && pnpm run build`

---

## 🧪 MẪU BÁO CÁO REVIEW

Tóm tắt: [Approve / Approve with comments / Request Changes]

- Extraction: [✅/❌]
- Tests: [✅/❌] – Coverage: [X]% (≥80%)
- Migration: [✅/❌]
- Behavior unchanged: [✅/❌]
- Code quality: [✅/❌]

Vấn đề nghiêm trọng: [Liệt kê | Không]

Cảnh báo (không chặn): [Liệt kê | Không]

Điểm tốt: [Liệt kê]

Câu hỏi: [Liệt kê]

Đã xác minh:
- `pnpm test`, `pnpm test:coverage`
- `pnpm run build` (clone-4)
- So sánh code và hành vi

Kết luận: [Sẵn sàng merge / Cần sửa rồi merge / Không]
