# Prompt Sẵn Dùng Cho AI Khác (Toàn Bộ Project Root)

## Đường dẫn vật lý bắt buộc đọc trước
1. `F:\downloader\Project-root\README.md`
2. `F:\downloader\Project-root\CLAUDE.md`
3. `F:\downloader\Project-root\apps\ytmp4.gg\docs\download-link-expiry-implementation-guide.md`
4. `F:\downloader\Project-root\apps\ytmp4.gg\docs\expire-single-vs-multiple-context.md`
5. `F:\downloader\Project-root\apps\ytmp4.gg\docs\prompt-expire-single-vs-multiple-port.md`

## Prompt để copy cho AI
```text
Bạn là Senior Frontend/TypeScript Engineer làm việc trên MONOREPO.

PROJECT ROOT
- F:\downloader\Project-root

MỤC TIÊU
- Audit và sửa toàn bộ các site trong monorepo (không chỉ 1 site).
- Mọi thay đổi phải ưu tiên ở source của từng app, tránh vá tạm file output build.
- Giữ kiến trúc hiện có của từng app, không refactor lan man ngoài scope bugfix/hardening.

BẮT BUỘC ĐỌC TRƯỚC (đường dẫn vật lý tuyệt đối)
1) F:\downloader\Project-root\README.md
2) F:\downloader\Project-root\CLAUDE.md
3) F:\downloader\Project-root\apps\ytmp4.gg\docs\download-link-expiry-implementation-guide.md
4) F:\downloader\Project-root\apps\ytmp4.gg\docs\expire-single-vs-multiple-context.md
5) F:\downloader\Project-root\apps\ytmp4.gg\docs\prompt-expire-single-vs-multiple-port.md

YÊU CẦU QUAN TRỌNG
1) Không mặc định chỉ sửa ytmp4.gg.
2) Bắt buộc scan toàn bộ `F:\downloader\Project-root\apps\` để phát hiện danh sách site cần xử lý.
3) Với mỗi site, tự detect module có/không (single, multiple, playlist, channel, ZIP, multifile).
4) Module nào không tồn tại thì bỏ qua, ghi rõ trong báo cáo.

PHẠM VI KIỂM TRA CHO TỪNG SITE
1) Điều hướng/link: header, footer, hero, internal links, i18n/langPrefix.
2) UI/CSS states: normal/hover/focus/disabled, responsive desktop/mobile.
3) Luồng downloader: single + multiple/playlist/channel nếu module có.
4) Expire logic: TTL downloadLink mặc định 25 phút, không hardcode TTL rải rác.
5) Trạng thái/UX: tách bạch `expired` và `error`, popup/message đúng ngữ cảnh.
6) Đúng luồng template/source -> output.
7) Các bug có nguy cơ regression.

QUY TRÌNH LÀM VIỆC BẮT BUỘC
1) Discovery phase:
   - Liệt kê toàn bộ app trong `apps/`.
   - Với mỗi app: stack, script build, entry points, module downloader hiện có.
2) Audit phase:
   - Liệt kê issue theo severity: critical/high/medium/low.
3) Fix phase:
   - Sửa lần lượt theo ưu tiên severity.
4) Verify phase:
   - Chạy build/test phù hợp cho từng app đã sửa.
5) Report phase:
   - Danh sách app đã xử lý.
   - File đã sửa theo từng app.
   - Before/after behavior.
   - Kết quả verify.
   - Risk còn lại + đề xuất bước tiếp theo.

RÀNG BUỘC
1) Không workaround tạm bợ.
2) Không thêm feature ngoài scope nếu không bắt buộc.
3) Không dùng lệnh git destructive.
4) Không bỏ qua regression risk ở các app liên quan.

BẮT ĐẦU NGAY
- Scan toàn bộ `apps/`, lập audit list theo severity, rồi implement fix end-to-end.
```
