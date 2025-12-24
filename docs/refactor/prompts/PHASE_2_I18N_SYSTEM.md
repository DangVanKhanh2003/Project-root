# GIAI ĐOẠN 2: HỆ THỐNG I18N - HƯỚNG DẪN CHO AI THỰC THI

> Giai đoạn: Hệ thống I18n (Tuần 3-4)
> Mục tiêu: Tạo hạ tầng đa ngôn ngữ cho 19 ngôn ngữ
> Mức độ rủi ro: 🟡 Trung bình (ảnh hưởng tất cả app)
> Tiền đề: Hoàn tất Giai đoạn 1 (đã trích xuất utilities)

---

## ⚠️ QUAN TRỌNG: KHÔNG CÓ MÃ TRONG TÀI LIỆU NÀY

Tài liệu này bao gồm:
- ✅ Đường dẫn file cần đọc
- ✅ Hướng dẫn LÀM GÌ
- ✅ Yêu cầu và ràng buộc
- ❌ KHÔNG có ví dụ mã nguồn

Bạn PHẢI:
- Đọc mã thật trong dự án
- Phân tích mẫu sử dụng i18n hiện có
- Đề xuất cách tiếp cận của riêng bạn
- Thảo luận trước khi triển khai

---

## 📚 TÀI LIỆU BẮT BUỘC (ĐỌC TRƯỚC KHI THẢO LUẬN)

Tài liệu quan trọng:
1. `/docs/refactor/MASTER_REFACTOR_DOC.md`
2. `/docs/refactor/README.md`
3. `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md`
4. `/CLAUDE.md`

Files cần đọc & phân tích:
- `/apps/y2matepro/src/i18n/` (triển khai hiện có nếu có)
- `/apps/ytmp3-clone-3/src/i18n/` (nếu có)
- `/apps/ytmp3-clone-4/src/i18n/` (nếu có)
- Tìm mẫu dùng dịch: `t('`, `i18n.`, `translate(`, `__('`
- Eleventy SSR: `.eleventy.js`, template .njk/.html

---

## 🎯 MỤC TIÊU

1) Tạo package i18n `packages/i18n/`
- Engine dịch (browser + SSR)
- Phát hiện/đổi ngôn ngữ, RTL, fallback en

2) 19 file locale (en, ar, bn, de, es, fr, hi, id, it, ja, ko, ms, my, pt, ru, th, tr, ur, vi)
- Cùng cấu trúc key, tổ chức theo domain/feature

3) Engine i18n
- Tra cứu dot-notation, nội suy, pluralization, định dạng ngày/số, cảnh báo thiếu

4) Translation checker CLI
- Thiếu key, key không dùng, báo cáo coverage

5) Di trú ytmp3-clone-4
- Thay hardcode, kiểm RTL, switch ngôn ngữ

Tiêu chí: package sẵn dùng, 19 locales cùng keys, SSR/CSR hoạt động, RTL ok, checker chạy, clone-4 quốc tế hóa hoàn chỉnh

---

## 🚫 RÀNG BUỘC

KHÔNG ĐƯỢC: hardcode dịch trong engine, dùng lib nặng, phá SSR, đổi hành vi app, copy mã từ docs

PHẢI: hỗ trợ SSR+CSR, RTL, pluralization, nội suy, fallback en, test đầy đủ, thảo luận trước khi code

---

## 📋 NHIỆM VỤ CHI TIẾT (TÓM TẮT)

1) Phân tích i18n hiện có
- Tìm pattern gọi dịch, liệt kê chuỗi cần dịch, yêu cầu SSR/CSR

2) Thiết kế kiến trúc i18n
- API thống nhất SSR/CSR, key tối đa 3 cấp, interpolations, pluralization, fallback chain, RTL helpers

3) Tạo package `packages/i18n/`
- Engine, locales, helpers, tests (≥80%) cho lookup, nội suy, pluralization, fallback, RTL, missing key

4) Tạo 19 locales
- `en.json` đầy đủ; 18 ngôn ngữ còn lại có thể placeholder English tạm thời, cấu trúc keys giống hệt

5) Checker CLI `src/cli/check-translations.ts`
- Thiếu key, key không dùng, coverage report, CLI/table + JSON, script `pnpm check:i18n`

6) Exports
- `packages/i18n/package.json` exports, scripts; `src/index.ts` export engine, types, helpers; README hướng dẫn

7) Di trú clone-4
- Thêm `@downloader/i18n`, khởi tạo engine, thay hardcode, thêm RTL + switcher ngôn ngữ, xác minh build + runtime

8) Test RTL (ar, ur)
- Kiểm tra `dir="rtl"`, layout mirror, nội dung bidi, lỗi hiển thị

---

## 🔄 QUY TRÌNH

1) Thảo luận (bắt buộc)
- Gửi tóm tắt phát hiện, đề xuất kiến trúc, key structure, SSR/CSR, RTL; hỏi xác nhận placeholders cho 18 ngôn ngữ

2) Triển khai sau khi được duyệt

3) Xác minh: `pnpm test`, `pnpm test:coverage`, chạy clone-4, kiểm RTL

---

## 🌐 GHI CHÚ DỊCH

- Ban đầu: en đầy đủ, 18 ngôn ngữ dùng English placeholder OK (đánh dấu TODO)
- Sau: nhờ người bản ngữ dịch, kiểm UI với bản dịch thật (độ dài khác nhau), định dạng số/ngày theo locale

---

Sẵn sàng bắt đầu Giai đoạn 2! Nhớ: ĐỌC → PHÂN TÍCH → THẢO LUẬN → DUYỆT → CODE 🚀

