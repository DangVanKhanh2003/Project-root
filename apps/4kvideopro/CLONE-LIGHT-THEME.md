# Hướng Dẫn Clone Project với Light Theme (#1DBAC9)

## 1. TỔNG QUAN THAY ĐỔI

### Theme hiện tại (Dark)
- Background: Đen (#000000)
- Accent: Xanh lá acid (#D4FF00)
- Text: Trắng (#FFFFFF)

### Theme mới (Light)
- Background: Trắng (#FFFFFF)
- Accent: Cyan (#1DBAC9)
- Text: Đen/Xám đậm

---

## 2. FILE CẦN TẠO/SỬA

### Cấu trúc thư mục styles cho site mới:
```
src/styles/
├── variables.css      ← THAY ĐỔI (màu sắc mới)
├── themes/
│   └── light.css      ← CÓ THỂ XÓA (đã là light mặc định)
├── base.css           ← GIỮ NGUYÊN
├── reset.css          ← GIỮ NGUYÊN
├── index.css          ← GIỮ NGUYÊN cấu trúc import
└── [other files]      ← GIỮ NGUYÊN
```

---

## 3. VARIABLES.CSS MỚI

Copy file dưới đây để thay thế `variables.css`:

```css
/* =========================================================
   CSS Variables - Light Theme với Cyan Accent
   ---------------------------------------------------------
   Background: White | Accent: #1DBAC9 (Cyan)
   ========================================================= */

:root {
    /* ===== BRAND COLORS ===== */

    /* Primary Accent - Cyan */
    --color-accent-primary: #1DBAC9;
    --color-accent-hover: #17A2B0;
    --color-accent-light: #E0F7FA;
    --color-accent-dark: #0E8A96;

    /* Secondary Accent (optional) */
    --color-accent-secondary: #0891B2;

    /* ===== BASE PALETTE ===== */

    --color-white: #FFFFFF;
    --color-black: #000000;

    /* Grayscale (Light theme friendly) */
    --color-gray-50: #FAFAFA;
    --color-gray-100: #F5F5F5;
    --color-gray-200: #E5E5E5;
    --color-gray-300: #D4D4D4;
    --color-gray-400: #A3A3A3;
    --color-gray-500: #737373;
    --color-gray-600: #525252;
    --color-gray-700: #404040;
    --color-gray-800: #262626;
    --color-gray-900: #171717;

    /* ===== BACKGROUNDS ===== */

    --bg-body: var(--color-white);
    --bg-card: var(--color-white);
    --bg-card-hover: var(--color-gray-50);
    --bg-input: var(--color-white);
    --bg-header: rgba(255, 255, 255, 0.95);
    --bg-header-scroll: rgba(255, 255, 255, 0.98);
    --bg-footer: var(--color-gray-50);
    --bg-step: var(--color-gray-50);
    --bg-step-hover: var(--color-white);
    --bg-badge: rgba(29, 186, 201, 0.1);
    --bg-button: var(--color-gray-100);
    --bg-button-hover: var(--color-gray-200);
    --bg-white: var(--color-white);

    /* ===== ACCENT COLORS ===== */

    --color-accent: var(--color-accent-primary);
    --color-accent-hover: var(--color-accent-hover);
    --color-accent-dark: rgba(29, 186, 201, 0.1);

    /* Gradient */
    --gradient-primary: linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-secondary) 100%);

    /* ===== TEXT COLORS ===== */

    --text-main: var(--color-gray-900);
    --text-muted: var(--color-gray-500);
    --text-secondary: var(--color-gray-600);
    --text-tertiary: var(--color-gray-400);
    --text-accent: var(--color-accent-primary);
    --text-logo: var(--color-gray-900);
    --text-step-num: rgba(0, 0, 0, 0.05);

    /* ===== BORDERS ===== */

    --border-primary: var(--color-gray-200);
    --border-secondary: var(--color-gray-300);
    --border-hover: var(--color-gray-400);
    --border-glass: 1px solid var(--color-gray-200);
    --border-input: 1px solid var(--color-gray-300);
    --border-input-hover: var(--color-accent-primary);
    --border-input-focus: var(--color-accent-primary);
    --border-active: 1px solid var(--color-accent-primary);

    /* ===== SELECTION ===== */

    --selection-bg: var(--color-accent-primary);
    --selection-text: var(--color-white);

    /* ===== SEMANTIC COLORS ===== */

    /* Error */
    --color-error-bg: #FEF2F2;
    --color-error-border: #EF4444;
    --color-error-text: #DC2626;
    --color-error-dot: #EF4444;

    /* Success */
    --color-status-success: #10B981;
    --color-success-bg: #ECFDF5;
    --color-success-text: #065F46;

    /* Warning */
    --color-status-error: #EF4444;
    --color-warning-yellow: #F59E0B;
    --color-orange: #F97316;
    --color-orange-dark: #EA580C;

    /* Skeleton Loading */
    --color-skeleton-dark: #E5E5E5;
    --color-skeleton-light: #F5F5F5;

    /* ===== TYPOGRAPHY ===== */

    --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-display: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

    --font-weight-regular: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    /* ===== SPACING ===== */

    --header-height: 80px;
    --container-width: 1100px;
    --container-max: 64rem;
    --card-max: 56rem;

    /* Border Radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 20px;
    --radius-pill: 9999px;

    /* ===== EFFECTS ===== */

    /* Shadows (softer for light theme) */
    --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-button: 0 4px 14px rgba(29, 186, 201, 0.3);
    --shadow-button-hover: 0 6px 20px rgba(29, 186, 201, 0.4);
    --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.08);
    --shadow-dropdown: 0 10px 40px rgba(0, 0, 0, 0.1);

    /* Glow */
    --glow-accent: rgba(29, 186, 201, 0.1);
    --glow-input: 0 0 0 4px rgba(29, 186, 201, 0.15);

    /* Backdrop */
    --backdrop-drawer: rgba(255, 255, 255, 0.95);

    /* ===== GRID PATTERN ===== */

    --grid-pattern:
        linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    --grid-size: 50px 50px;

    /* ===== TRANSITIONS ===== */

    --transition-fast: 0.2s;
    --transition-normal: 0.3s;
    --transition-slow: 0.5s;
}

/* ===== SELECTION ===== */
::selection {
    background-color: var(--selection-bg);
    color: var(--selection-text);
}
```

---

## 4. CÁC THAY ĐỔI CỤ THỂ

### 4.1 Bảng so sánh màu

| Variable | Dark Theme | Light Theme (#1DBAC9) |
|----------|------------|----------------------|
| `--bg-body` | #000000 | #FFFFFF |
| `--bg-card` | #000000 | #FFFFFF |
| `--bg-header` | #000000 | rgba(255,255,255,0.95) |
| `--color-accent` | #D4FF00 | #1DBAC9 |
| `--text-main` | #FFFFFF | #171717 |
| `--text-muted` | #A1A1AA | #737373 |
| `--border-input` | #3F3F46 | #D4D4D4 |
| `--shadow-button` | lime glow | cyan glow |

### 4.2 Màu accent và các biến thể

```css
/* Màu chính */
--color-accent-primary: #1DBAC9;

/* Hover (tối hơn 10%) */
--color-accent-hover: #17A2B0;

/* Light background (cho badges, bg nhẹ) */
--color-accent-light: #E0F7FA;

/* Dark variant */
--color-accent-dark: #0E8A96;
```

### 4.3 Text colors cho Light theme

```css
/* Text chính - đen đậm */
--text-main: #171717;

/* Text phụ - xám trung */
--text-muted: #737373;

/* Text tertiary - xám nhạt */
--text-tertiary: #A3A3A3;

/* Accent text - cyan */
--text-accent: #1DBAC9;
```

---

## 5. CÁC FILE CSS CẦN KIỂM TRA

Sau khi thay đổi variables.css, kiểm tra các file sau để đảm bảo không có hardcoded colors:

### 5.1 Components cần check
- `components/buttons.css` - Nút convert, download
- `components/format-toggle.css` - Toggle MP3/MP4
- `components/form-input.css` - Input URL
- `components/hero-card.css` - Card chính
- `components/result-card.css` - Card kết quả

### 5.2 Sections cần check
- `sections/hero.css` - Hero background
- `sections/header.css` - Header styling
- `sections/footer.css` - Footer

### 5.3 Tìm và thay hardcoded colors

Tìm các pattern sau và thay bằng CSS variables:

```css
/* TÌM */
#D4FF00, #d4ff00     → thay bằng var(--color-accent)
#000000, #000        → thay bằng var(--bg-body) hoặc var(--text-main)
#FFFFFF, #fff        → thay bằng var(--color-white)
rgba(212, 255, 0     → thay bằng rgba(29, 186, 201, ...)
```

---

## 6. XÓA FILE THEMES/LIGHT.CSS

Vì theme mặc định đã là light, có thể xóa hoặc để trống file `themes/light.css`:

```css
/* themes/light.css */
/* Light theme is now default - no overrides needed */
```

---

## 7. BASE.CSS - KIỂM TRA BACKGROUND

Đảm bảo body background sử dụng variable:

```css
body {
    background-color: var(--bg-body);
    color: var(--text-main);
}

/* Nếu có grid pattern */
.bg-tech-grid {
    background-color: var(--bg-body);
    background-image: var(--grid-pattern);
    background-size: var(--grid-size);
}
```

---

## 8. HERO SECTION - ĐIỀU CHỈNH

### Decorative glow cho light theme:

```css
.decorative-glow {
    background: radial-gradient(
        circle at 50% -20%,
        rgba(29, 186, 201, 0.15) 0%,
        transparent 50%
    );
}
```

### Hero card border:

```css
.hero-card {
    background: var(--bg-card);
    border: var(--border-glass);
    box-shadow: var(--shadow-card);
}
```

---

## 9. BUTTONS - ĐIỀU CHỈNH

### Convert button:

```css
.btn-convert {
    background: var(--color-accent);
    color: var(--color-white);
    box-shadow: var(--shadow-button);
}

.btn-convert:hover {
    background: var(--color-accent-hover);
    box-shadow: var(--shadow-button-hover);
}
```

### Format toggle active:

```css
.format-btn.active {
    background: var(--color-accent);
    color: var(--color-white);
}

.format-btn:not(.active) {
    background: var(--bg-button);
    color: var(--text-main);
}
```

---

## 10. INPUT FIELD - ĐIỀU CHỈNH

```css
.video-input {
    background: var(--bg-input);
    border: var(--border-input);
    color: var(--text-main);
}

.video-input:focus {
    border-color: var(--border-input-focus);
    box-shadow: var(--glow-input);
}

.video-input::placeholder {
    color: var(--text-muted);
}
```

---

## 11. RESULT CARD - ĐIỀU CHỈNH

```css
.video-card {
    background: var(--bg-card);
    border: var(--border-glass);
}

.video-title {
    color: var(--text-main);
}

.video-channel {
    color: var(--text-muted);
}

.meta-value.accent {
    color: var(--text-accent);
}

.btn-download {
    background: var(--color-accent);
    color: var(--color-white);
}
```

---

## 12. TÓM TẮT CÁC BƯỚC

1. **Copy `variables.css` mới** từ mục 3
2. **Xóa/clear** `themes/light.css`
3. **Tìm và thay** hardcoded colors trong các component files
4. **Kiểm tra** hero, buttons, input, cards
5. **Test** trên browser

---

## 13. PALETTE TẦM CHIẾU

### Cyan (#1DBAC9) Color Palette

| Tên | Hex | Sử dụng |
|-----|-----|---------|
| Cyan 50 | #ECFEFF | Background rất nhạt |
| Cyan 100 | #CFFAFE | Background nhạt |
| Cyan 200 | #A5F3FC | Hover states |
| Cyan 300 | #67E8F9 | Borders |
| **Cyan 400** | **#22D3EE** | Alternative accent |
| **Cyan 500** | **#1DBAC9** | **Primary accent** |
| Cyan 600 | #0891B2 | Hover/Active |
| Cyan 700 | #0E7490 | Dark variant |
| Cyan 800 | #155E75 | Text on light bg |
| Cyan 900 | #164E63 | Darkest |

### Gray Palette cho Light Theme

| Tên | Hex | Sử dụng |
|-----|-----|---------|
| Gray 50 | #FAFAFA | Background nhẹ |
| Gray 100 | #F5F5F5 | Card background |
| Gray 200 | #E5E5E5 | Borders |
| Gray 300 | #D4D4D4 | Inactive borders |
| Gray 400 | #A3A3A3 | Disabled text |
| Gray 500 | #737373 | Muted text |
| Gray 600 | #525252 | Secondary text |
| Gray 700 | #404040 | Body text |
| Gray 800 | #262626 | Headlines |
| Gray 900 | #171717 | Primary text |

---

*Document version: 1.0*
*Theme: Light with Cyan (#1DBAC9) accent*
