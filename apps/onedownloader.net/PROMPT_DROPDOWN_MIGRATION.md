# Prompt cập nhật dropdown cho project khác

```txt
Bạn là senior frontend engineer. Hãy cập nhật dropdown quality trong project này theo đúng tài liệu sau.

TÀI LIỆU BẮT BUỘC
1) Requirements:
- TASK_DROPDOWN_REQUIREMENTS.md:
  F:\downloader\Project-root\apps\ytmp4.gg\TASK_DROPDOWN_REQUIREMENTS.md

2) Implementation guide:
- DROPDOWN_LIST_OPTION_IMPLEMENTATION.md:
  F:\downloader\Project-root\apps\ytmp4.gg\DROPDOWN_LIST_OPTION_IMPLEMENTATION.md

YÊU CẦU THỰC HIỆN
- Đọc kỹ cả 2 tài liệu trước khi sửa code.
- Triển khai đúng grouped dropdown (MP4/WEBM/MKV + quality) như tài liệu.
- Giữ native select làm source-of-truth, dropdown custom chỉ là lớp UI.
- Không đổi cấu trúc HTML template; chỉ sửa TS/JS/CSS.
- Áp dụng đồng bộ cho các màn liên quan (main, stream/cut, multiple, playlist, channel nếu có).
- Header group và item phải khác nhau rõ:
  - header đậm hơn
  - item xám hơn, không bold
- Fix interaction:
  - click trigger mở menu
  - toggle group độc lập
  - cho phép đóng hết group
  - click ngoài / ESC đóng menu

OUTPUT BẮT BUỘC
1) Danh sách file đã sửa.
2) Tóm tắt thay đổi theo từng file.
3) Lệnh verify đã chạy (build/test) + kết quả.
4) Checklist pass/fail theo từng tiêu chí trong tài liệu.
```

## Link tài liệu
- [TASK_DROPDOWN_REQUIREMENTS.md](F:\downloader\Project-root\apps\ytmp4.gg\TASK_DROPDOWN_REQUIREMENTS.md)
- [DROPDOWN_LIST_OPTION_IMPLEMENTATION.md](F:\downloader\Project-root\apps\ytmp4.gg\DROPDOWN_LIST_OPTION_IMPLEMENTATION.md)
