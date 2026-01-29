# Gộp UI Audio Track (Bước 4 - Responsive + CSS)

Repo root: `{{PROJECT_ROOT}}`.

Project tham chiếu: `F:\downloader\Project-root\apps\ytmp3.my`
Chỉ đọc đúng các section cần thiết (không load full file):
- CSS dropdown:
  - `src\styles\components\quality-select.css` → rule audio dropdown + media mobile/desktop
- CSS preview card:
  - `src\styles\reusable-packages\yt-preview-card\yt-preview-card.css` → `.audio-track-badge`, `.yt-preview-format`, `.yt-preview-meta`

Nhiệm vụ:
1) Style trigger audio dropdown:
   - padding: `0 10px`
   - khi collapsed: `padding-left: 1px`
   - có gap giữa SVG và text
2) Kích thước audio dropdown:
   - Desktop `>=641px`: min-width ~200px
   - Mobile `<640px`: icon-only khi đóng, ẩn text + arrow
   - Tiny `<480px`: height 40px
3) Preview meta không tràn:
   - meta width 100%
   - format row `flex-wrap: wrap`

Hành vi animation (không đưa code):
- Collapsed → expanded: width/padding/justify transition ~0.75s.
- Text/arrow opacity ~0.5s và delay ~0.25s khi mở.
- Collapsed phải ẩn text/arrow hoàn toàn (không chỉ opacity).
- Mobile: wrapper có z-index cao để menu nổi lên trên UI khác.

Ràng buộc:
- Giữ đúng design token hiện có (color, radius, shadow).
- Chỉ sửa CSS liên quan.
- Báo rõ file đã sửa và thay đổi gì.
