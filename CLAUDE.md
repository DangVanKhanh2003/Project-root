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

### Mobile Tap Highlight
- **Tap highlight**: Sử dụng `-webkit-tap-highlight-color: transparent` để bỏ hiệu ứng nền mờ khi chạm vào các element trên mobile

## Monorepo Structure

Dự án sử dụng kiến trúc monorepo với các apps trong `apps/`.
