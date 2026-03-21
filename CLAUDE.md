# CLAUDE.md

File này cung cấp hướng dẫn cho Claude Code (claude.ai/code) khi làm việc với code trong repository này.


## Tổng Quan Dự Án

Đây là một ứng dụng web để tải xuống nội dung đa phương tiện (video, hình ảnh, âm thanh) từ các nền tảng mạng xã hội bao gồm YouTube, Facebook, TikTok, Instagram, và X (Twitter). Dự án ưu tiên thiết kế mobile-first, tối ưu hóa hiệu suất, và kiến trúc sạch.

## Tech Stack

Dự án sử dụng công nghệ web chuẩn với kiến trúc hiện đại:

- **HTML5**: Semantic markup và modern web standards
- **CSS3**: Mobile-first responsive design với advanced features (Grid, Flexbox, Custom Properties)
- **JavaScript (ES6+)**: Vanilla JavaScript với ES modules, dynamic imports, và modern syntax

**Không sử dụng frameworks** - dự án được xây dựng hoàn toàn bằng vanilla web technologies để đảm bảo hiệu suất tối ưu và kiểm soát hoàn toàn code base.

## CSS Guidelines

### Input Fields
- **Font size**: Minimum và default là `16px` cho tất cả input fields (bao gồm cả mobile)
- Lý do: Tránh auto-zoom trên iOS khi focus vào input có font-size < 16px
- Text ở ô input không bao giờ nhỏ hơn 16px

### Mobile Tap Highlight
- **Tap highlight**: Sử dụng `-webkit-tap-highlight-color: transparent` để bỏ hiệu ứng nền mờ khi chạm vào các element trên mobile

### Color Tokens
- **Tất cả color đều PHẢI thông qua CSS custom properties (tokens)** được định nghĩa trong `variables.css`
- **KHÔNG ĐƯỢC dùng `[data-theme="dark"]` selector** trong các file CSS component. Thay vào đó, định nghĩa token ở `:root` (light) và `:root[data-theme="dark"]` (dark) trong `variables.css`, rồi component chỉ dùng `var(--token-name)`
- Điều này đảm bảo theme switching chỉ cần thay đổi ở một nơi duy nhất

## HTML & Templates

- Một số app sử dụng template engine (Eleventy/Nunjucks) để generate HTML. Ví dụ: `apps/ytmp4.gg/_templates/`
- **KHÔNG BAO GIỜ sửa trực tiếp file HTML nếu nó được generate từ template.** Phải tìm và sửa file template gốc (`.njk`, `.liquid`, v.v.) rồi rebuild.
- Khi cần sửa HTML, **luôn kiểm tra trước** xem file đó có template tương ứng không (tìm trong thư mục `_templates/`). Nếu có → sửa template. Nếu không có → sửa trực tiếp HTML.

## Vite Build

- Mỗi app có file `vite.config.ts` với danh sách `staticPages` chứa các trang HTML tĩnh (không qua template).
- **Khi thêm file HTML mới** vào root của app, **PHẢI thêm tên file (không có `.html`)** vào mảng `staticPages` trong `vite.config.ts` của app đó. Nếu không, trang sẽ không được build.

## Monorepo Structure

Dự án sử dụng kiến trúc monorepo với các apps trong `apps/`.

## CI/CD & Deploy

- CI/CD dùng GitHub Actions, trigger khi push lên `main`.
- **Khi commit, PHẢI ghi rõ deploy site nào** bằng tag `[deploy:site1,site2]` **ở dòng title** (dòng đầu tiên) của commit message, không phải trong body.
- Ví dụ: `feat: add tool pages [deploy:convert1s.com,tube1s.com]`
- **KHÔNG được đặt deploy tag ở body** — CI/CD chỉ đọc title line.
- Deploy tất cả: `[deploy:all]`
- Chỉ ghi các site **thực sự có thay đổi** vào deploy tag, không deploy site không liên quan.
- Danh sách site names hợp lệ: tên thư mục trong `apps/` chính là site name. Ví dụ: `apps/convert1s.com/` → deploy tag là `convert1s.com`
