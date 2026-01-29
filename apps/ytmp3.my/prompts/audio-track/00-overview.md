# Gộp UI Audio Track (Bước 0 - Tổng quan)

Bạn đang làm việc trong repo tại: `{{PROJECT_ROOT}}`.

Mục tiêu: gộp **audio track dropdown** + **preview audio track badge** vào project.

Quy trình:
1) Khảo sát: tìm file/section cần sửa (Bước 1).
2) UI dropdown: thêm audio track dropdown + hidden input (Bước 2).
3) Preview badge: thêm badge audio track trong preview meta (Bước 3).
4) Responsive + CSS: hoàn thiện styling và responsive (Bước 4).

Hành vi cần khớp (không đưa code vào prompt):
- Mobile <640px: dropdown audio chỉ còn icon khi đóng; text + arrow ẩn.
- Mobile <640px khi mở: dropdown mở rộng ~200px, text + arrow fade in.
- Tiny <480px: chiều cao control 40px.
- Desktop >=641px: dropdown audio min-width ~200px; icon + text hiển thị.
- Transition: width/padding/justify ~0.75s; text/arrow opacity ~0.5s, delay ~0.25s khi mở.
- Z-index: audio dropdown wrapper phải nổi lên trên UI khác ở mobile.
- Preview meta phải wrap để không tràn.

Quy tắc:
- Chỉ sửa những file cần thiết.
- Không thay đổi logic ngoài phạm vi.
- Báo rõ file đã sửa và thay đổi gì.
