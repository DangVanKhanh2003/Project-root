# CLAUDE.md

File này cung cấp hướng dẫn cho Claude Code (claude.ai/code) khi làm việc với code trong repository này.

**🚨 QUAN TRỌNG: Trước khi thực hiện bất kỳ task nào, PHẢI đọc `docs/task-workflow.md` (1 lần/conversation). Không được code ngay lập tức.**

## Tổng Quan Dự Án

Đây là một ứng dụng web để tải xuống nội dung đa phương tiện (video, hình ảnh, âm thanh) từ các nền tảng mạng xã hội bao gồm YouTube, Facebook, TikTok, Instagram, và X (Twitter). Dự án ưu tiên thiết kế mobile-first, tối ưu hóa hiệu suất, và kiến trúc sạch.

## Tech Stack

Dự án sử dụng công nghệ web chuẩn với kiến trúc hiện đại:

- **HTML5**: Semantic markup và modern web standards
- **CSS3**: Mobile-first responsive design với advanced features (Grid, Flexbox, Custom Properties)
- **JavaScript (ES6+)**: Vanilla JavaScript với ES modules, dynamic imports, và modern syntax

**Không sử dụng frameworks** - dự án được xây dựng hoàn toàn bằng vanilla web technologies để đảm bảo hiệu suất tối ưu và kiểm soát hoàn toàn code base.

## Monorepo Structure

Dự án sử dụng kiến trúc monorepo với các apps trong `apps/`:

- **`apps/y2matepro/`**: Site chính cần deploy lên production
- **`apps/yt1s-test/`**: Project mẫu để test/development locally - **KHÔNG DEPLOY**

## Deployment & CI/CD

### Sites cần deploy:
- ✅ `y2matepro` - Deploy qua GitHub Actions (main → production, test-production → test environment)

### Sites không deploy:
- ❌ `yt1s-test` - Chỉ dùng local development, không cần CI/CD workflow

### Environment Strategy:
- **`main` branch** → Production environment (với SEO indexing bình thường)
- **`test-production` branch** → Test environment (với noindex meta tags & robots.txt block)
