# Gộp UI Audio Track (Bước 3 - Preview Badge)

Repo root: `{{PROJECT_ROOT}}`.

Project tham chiếu: `F:\downloader\Project-root\apps\ytmp3.my`
Chỉ đọc đúng các section cần thiết (không load full file):
- HTML preview badge:
  - `src\features\downloader\ui-render\content-renderer.ts` → `.yt-preview-format` / `.audio-track-badge`
- CSS preview badge:
  - `src\styles\reusable-packages\yt-preview-card\yt-preview-card.css` → `.audio-track-badge`, `.yt-preview-format`, `.yt-preview-meta`

Nhiệm vụ:
1) Trong preview meta (row format/quality), thêm **audio track badge**.
2) Badge dùng class `.meta-badge` chung.
3) Badge gồm icon audio track (SVG tĩnh, không dùng dynamic flag) + text.
4) HTML update logic: dùng class helper cụ thể (VD: `.badge-format`, `.badge-audio`, `.audio-track-value`) để target.
5) Audio track value font-size: 0.8rem.
6) Label mặc định **Origin**.

Tham chiếu:
- Copy cấu trúc badge từ project tham chiếu ở các section trên.
- Không đọc full file, chỉ lấy phần badge.
