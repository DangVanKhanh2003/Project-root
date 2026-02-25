# Tài liệu thay đổi commit `a0cc9e76969332d8a79a986a58cc3f20623b2290`

## Thông tin commit
- **Author**: KhanhDV `<dangvankhanh09022003@gmail.com>`
- **AuthorDate**: `2026-02-24T18:33:48+07:00`
- **CommitDate**: `2026-02-24T18:33:48+07:00`
- **Message**: `Restore ytmp4.gg to ssvid old theme and old image assets`
- **Tổng quan**: `19 files changed, 65 insertions(+), 82 deletions(-)`

## Danh sách đầy đủ file thay đổi

1. `apps/ytmp4.gg/_templates/_includes/header.njk`  
   Đổi màu SVG logo ở cả `header-logo` và `drawer-logo`:  
   `rect fill #004fab -> #CB0E35`, `path fill #003f8a -> #8D021F`.

2. `apps/ytmp4.gg/public/favicon-128x128.png`  
   Binary asset thay mới. Blob: `a76ad0c8 -> fda0b35e`.

3. `apps/ytmp4.gg/public/favicon-16x16.png`  
   Binary asset thay mới. Blob: `aff864ce -> 5a9c647d`.

4. `apps/ytmp4.gg/public/favicon-32x32.png`  
   Binary asset thay mới. Blob: `1f8ff812 -> e0911764`.

5. `apps/ytmp4.gg/public/favicon-48x48.png`  
   Binary asset thay mới. Blob: `7743db77 -> 97dad732`.

6. `apps/ytmp4.gg/public/favicon-512x512.png`  
   Binary asset thay mới. Blob: `1aed2689 -> 896bb558`.

7. `apps/ytmp4.gg/public/favicon-96x96.png`  
   Binary asset thay mới. Blob: `0aef8a3c -> 5305d9f7`.

8. `apps/ytmp4.gg/public/favicon.ico`  
   Binary asset thay mới. Blob: `0aef8a3c -> e0911764`.

9. `apps/ytmp4.gg/public/favicon.png`  
   Binary asset thay mới. Blob: `0aef8a3c -> 97dad732`.

10. `apps/ytmp4.gg/public/logo.png`  
    Binary asset thay mới. Blob: `1f8ff812 -> c8287511`.

11. `apps/ytmp4.gg/src/styles/common.css`  
    `.bg-tech-grid` đổi grid tint từ xanh `rgba(0, 79, 171, 0.03)` sang đỏ `rgba(141, 2, 31, 0.03)`.

12. `apps/ytmp4.gg/src/styles/components/form.css`  
    `.btn-paste:hover` đổi nền hover và text sang palette đỏ:  
    `rgba(0, 79, 171, 0.1) -> rgba(141, 2, 31, 0.1)`, `#004fab -> #8F0F20`.

13. `apps/ytmp4.gg/src/styles/features/multiple-downloader-v2.css`  
    Đổi accent xanh sang đỏ ở các selector:  
    `.heading`, `.input-action-btn:hover`, `.multi-format-btn.active`, `.multi-quality-select:hover/focus`, `.multi-start-btn`, `.btn-icon.btn-download`, `.progress-bar`, `.progress-text`, `.btn-primary`, `.btn-primary:hover`, `.btn-success`, `.btn-success:hover`, `.btn-success:disabled`, `.playlist-tab.active`, checkbox `accent-color`, `.btn-load-more-group` (border/bg/hover), `.btn-playlist-group-action` (bg/border/color/hover/disabled), `.item-*-select:focus`, `.item-action-btn`.  
    Ngoài ra xóa 2 dòng trống cuối file.

14. `apps/ytmp4.gg/src/styles/layout/header.css`  
    `header` background: `var(--background-hero-section) -> var(--primary-color)`.  
    Xóa block CSS override ép logo đỏ thành xanh:
    - `.header-logo svg rect[fill="#CB0E35"] { fill: #004fab; }`
    - `.header-logo svg path[fill="#8D021F"] { fill: #003f8a; }`
    - tương tự cho `.drawer-logo`.

15. `apps/ytmp4.gg/src/styles/reusable-packages/conversion-status/conversion-status.css`  
    Progress fill nền `#cfe0ff -> #F8B6B6`; viền phải `rgba(0, 79, 171, 0.4) -> rgba(141, 2, 31, 0.4)`.

16. `apps/ytmp4.gg/src/styles/reusable-packages/package-root.css`  
    Đổi token package-level:
    - `--pkg-color-primary: #004fab -> #D4FF00`
    - `--pkg-color-primary-container: rgba(0, 79, 171, 0.1) -> rgba(139, 92, 246, 0.1)`
    - `--pkg-color-on-primary-container: #003f8a -> #c4b5fd`
    - `--pkg-color-accent: #003f8a -> #7c3aed`
    - `--pkg-color-accent-bright: #2563eb -> #3b82f6`
    - Retry button: `--pkg-search-results-retry-bg` từ `error` sang `primary`, hover từ `#dc2626` sang `accent`.
    Xóa 1 dòng trống cuối file.

17. `apps/ytmp4.gg/src/styles/sections/hero.css`  
    `.hero-bg` background: `var(--background-hero-section) -> var(--primary-color)`.  
    Logo hero: giữ màu đỏ gốc bằng cách đổi rule `.logo-hero svg rect[fill="#CB0E35"]` thành `fill: #CB0E35`; xóa rule ép `path` sang xanh.

18. `apps/ytmp4.gg/src/styles/sections/overview.css`  
    Palette đỏ/pink cho overview:
    - Badge bg `rgba(217, 232, 255, 0.6) -> rgba(255, 216, 228, 0.5)`
    - Badge text `#003f8a -> #5D0014`
    - Number circle bg `#004fab -> #8D021F`
    - Timeline line `#cfe0ff -> #FFD8E4`

19. `apps/ytmp4.gg/src/styles/variables.css`  
    Đổi root design tokens:
    - `--brand: #004fab -> #8F0F20`
    - `--surface-weak: #e8f1ff -> #F9F2F4`
    - `--primary-color: #004fab -> #8F0F20`
    - `--primary-color-hover: #003f8a -> #9f1e16`
    - `--background-hero-section: #0055b9 -> #8F0F20`
    - `--color-accent-hover: #003f8a -> #740219`
    - `--color-accent-dark: rgba(0, 79, 171, 0.12) -> rgba(141, 2, 31, 0.12)`
