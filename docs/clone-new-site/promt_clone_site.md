# Clone Site Guide — Tạo site mới từ template trong monorepo

Hướng dẫn cho AI tự động clone app `apps/onedownloader.net` thành site mới, rebrand, và cấu hình CI/CD.

---

## Prompt — Copy & Paste

Chỉ cần thay **1 link** data folder. AI sẽ tự lấy domain + brand từ tên folder.

```
Đọc file hướng dẫn F:\downloader\Project-root\docs\clone-new-site\CLONE-SITE-GUIDE.md và clone site mới.

- Source template: F:\downloader\Project-root\apps\onedownloader.net
- Data folder: C:\Users\khanh084\Downloads\{tên-site}\{tên-site}

Lấy domain từ tên folder data (ví dụ folder "ytmp3.website" → domain là ytmp3.website).
Tự suy ra brand name từ domain (ví dụ ytmp3.website → YTSSS).
Target app: F:\downloader\Project-root\apps\{domain}

Thực hiện đầy đủ theo CLONE-SITE-GUIDE.md. Thảo luận trước khi sửa GitHub workflows.
```

**Ví dụ — bạn chỉ paste đúng 1 dòng thay đổi:**
```
Đọc file hướng dẫn F:\downloader\Project-root\docs\clone-new-site\CLONE-SITE-GUIDE.md và clone site mới.

- Source template: F:\downloader\Project-root\apps\onedownloader.net
- Data folder:C:\Users\khanh084\Downloads\ytmp3.website

Lấy domain từ tên folder data (ví dụ folder "ytmp3.website" → domain là ytmp3.website).
Tự suy ra brand name từ domain (ví dụ ytmp3.website → ytmp3).
Target app: F:\downloader\Project-root\apps\ytmp3.website

Thực hiện đầy đủ theo CLONE-SITE-GUIDE.md. Thảo luận trước khi sửa GitHub workflows.


Note: Chú ý là xóa hết file data của project mẫu sau khi clone sang site mới nhé tránh trường hợp chỉ đổi brand làm cho content lại giống nhau

```

---