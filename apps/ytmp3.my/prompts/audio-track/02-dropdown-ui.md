# Gộp UI Audio Track (Bước 2 - Dropdown UI)

Repo root: `{{PROJECT_ROOT}}`.

Project tham chiếu: `F:\downloader\Project-root\apps\ytmp3.my`
Chỉ đọc đúng các section cần thiết (không load full file):
- HTML dropdown:
  - `_templates\pages\index.njk` → `.audio-dropdown-wrapper` và `#audio-track-dropdown`
- CSS dropdown:
  - `src\styles\components\quality-select.css` → các rule audio dropdown + media mobile/desktop
- Dropdown logic:
  - `src\features\downloader\ui-render\dropdown-logic.ts`

Nhiệm vụ:
1) Thêm **audio track dropdown** (searchable) cạnh quality selector.
2) Thêm hidden input:
   - `name="audioTrack"`
   - default `"original"`
3) Thêm icon SVG audio track vào trigger.
4) Trigger phải hỗ trợ icon + text + arrow (mobile đóng thì ẩn text/arrow).

Tham chiếu:
- Copy cấu trúc dropdown + SVG từ project tham chiếu ở các section trên.
- Không đọc full file, chỉ lấy phần dropdown.

Ghi chú hành vi (không đưa code):
- Mobile đóng: icon-only.
- Mobile mở: dropdown mở rộng ~200px, text/arrow hiện.
