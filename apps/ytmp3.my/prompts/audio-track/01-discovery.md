# Gộp UI Audio Track (Bước 1 - Khảo sát)

Repo root: `{{PROJECT_ROOT}}`.

Project tham chiếu: `F:\downloader\Project-root\apps\ytmp3.my`
Chỉ đọc đúng các section cần thiết (không load full file):
- HTML dropdown:
  - `_templates\pages\index.njk` → `.audio-dropdown-wrapper` và `#audio-track-dropdown`
- CSS dropdown:
  - `src\styles\components\quality-select.css` → các rule audio dropdown + media mobile/desktop
- HTML preview badge (render):
  - `src\features\downloader\ui-render\content-renderer.ts` → `.yt-preview-format` / `.audio-track-badge`
- CSS preview card:
  - `src\styles\reusable-packages\yt-preview-card\yt-preview-card.css` → `.audio-track-badge`, `.yt-preview-format`, `.yt-preview-meta`
- Dropdown logic (JS):
  - `src\features\downloader\ui-render\dropdown-logic.ts`
- Danh sách ngôn ngữ:
  - `src\features\downloader\data\languages.ts` ( đã có tôi đã copy sang project này)

Nhiệm vụ:
1) Tìm file tương ứng trong project target:
   - UI dropdown format/quality
   - Preview card (result/preview)
   - CSS liên quan
2) Xác định vị trí cần thêm:
   - audio track dropdown
   - preview meta badge
3) Tóm tắt:
   - đường dẫn file
   - section/container cần sửa

Không chỉnh sửa ở bước này.
Chỉ skim các section liệt kê để map vị trí cần sửa.
