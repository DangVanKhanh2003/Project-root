# Theme Tokens - Hướng dẫn thay màu khi clone site mới

File: `src/styles/variables.css`

Khi clone site mới, cần thay các token dưới đây theo brand color mới.

## 1. Brand color chính

| Token | Ví dụ (emerald) | Mô tả |
|-------|-----------------|-------|
| `--brand` | `#2E917C` | Màu brand chính |
| `--brand-hover` | `#267A69` | Màu brand khi hover (tối hơn ~10%) |

## 2. Tokens dùng brand RGB trong `rgba()` — chỉ cần find & replace

Find & replace RGB cũ → RGB mới. Ví dụ: `46, 145, 124` → `240, 122, 144`

Các token bị ảnh hưởng (cả light & dark):

- `--color-accent-soft-05`
- `--color-accent-soft-08`
- `--color-accent-soft-10`
- `--color-accent-soft-12`
- `--color-accent-dark`
- `--status-container-border`
- `--accent-fill-soft`
- `--accent-fill-strong`
- `--multi-list-extracting-glow-color`
- `--input-border-glow-rgb`
- `--input-glow-radial-rgb`
- `--status-ready-bg`
- `--status-analyzing-bg`
- `--status-converting-bg`
- `--processing-bg` (dark)
- `--surface-weak` (dark)
- `--status-container-bg` (dark)
- `--status-progress-bg` (dark)
- `--spinner-border-color` (dark)

## 3. Tokens cần chọn màu thủ công (hardcoded, không dùng `rgba()`)

Những token này là màu dẫn xuất từ brand, cần pick màu phù hợp với brand mới.

### Light (`:root`)

| Token | Emerald | Pink | Cách chọn |
|-------|---------|------|-----------|
| `--meta-badge-bg` | `rgba(46,145,124,0.12)` | `var(--brand)` | Nền badge metadata |
| `--meta-badge-color` | `#2e917cf5` | `#ffffff` | Chữ badge metadata |
| `--yt-preview-card-bg` | `rgba(46,145,124,0.08)` | `#fae6eb` | Nền card preview YT |
| `--status-container-bg` | `#E6F3F0` | `#FAE6EB` | Nền status container, brand rất nhạt ~5-8% |
| `--status-progress-bg` | `#D4ECE7` | `#F5D2DA` | Nền progress bar, brand nhạt ~15-20% |
| `--spinner-border-color` | `#B0D9D0` | `#EBB4BC` | Viền spinner, brand nhạt ~30-40% |

### Dark (`:root[data-theme="dark"]`)

| Token | Emerald | Pink | Cách chọn |
|-------|---------|------|-----------|
| `--status-text-color` | `#4DB8A3` | `#F8A0B0` | Text status, brand sáng hơn cho dark bg |
| `--spinner-top-color` | `#4DB8A3` | `#F8A0B0` | Viền spinner xoay, = status-text-color |
| `--status-ready-color` | `#4DB8A3` | `#F8A0B0` | Badge ready, = status-text-color |
| `--status-analyzing-color` | `#4DB8A3` | `#F8A0B0` | Badge analyzing, = status-text-color |
| `--status-converting-color` | `#2E917C` | `#F07A90` | Badge converting, = brand gốc |
| `--logo-text-color` | `#2E917C` | `#F07A90` | Logo text trong dark mode, = brand gốc |
| `--brand-light` | `#7DD4C2` | `#F8A8B8` | Brand sáng cho dark surface, brand +30% lightness |
| `--brand-light-hover` | `#9DE3D5` | `#FBC0CC` | Hover của brand-light, sáng hơn nữa |

## Tóm tắt quy trình

1. Chọn `--brand` và `--brand-hover`
2. Find & replace RGB cũ → RGB mới (xử lý hết mục 2)
3. Pick thủ công 6 màu light + 7 màu dark ở mục 3
