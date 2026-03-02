# SSVID Dark Theme — Implementation Prompt for AI

> Copy toàn bộ nội dung từ "---BEGIN PROMPT---" đến "---END PROMPT---" và paste vào Claude/Codex/Gemini.

---BEGIN PROMPT---

Bạn là một AI lập trình chuyên CSS. Nhiệm vụ của bạn là implement dark theme cho project `apps/ssvid.cc` theo đúng chiến lược "Tokenize First, Override Once".

**QUAN TRỌNG: Đọc hết prompt này trước khi làm bất cứ thứ gì. Không implement từng phần rồi dừng lại hỏi — hãy làm theo đúng thứ tự được mô tả.**

---

## 1. Bối cảnh project

Project path: `F:/downloader/Project-root/apps/ssvid.cc`

Cấu trúc CSS chính:
```
src/styles/
  variables.css                        ← File token toàn cục (:root)
  index.css                            ← Import tất cả CSS
  layout/header.css                    ← Header + drawer + dropdown
  layout/footer.css                    ← Footer (đã dùng token - OK)
  sections/hero.css                    ← Hero card (white hardcoded)
  sections/content.css                 ← Subsection, FAQ (white hardcoded)
  components/form.css                  ← Input form + animated border
  components/format-selector.css       ← Format toggle, quality select
  components/dropdown.css              ← Dropdown chung
  components/material-popup.css        ← Popup modals
  features/multiple-downloader-v2.css  ← File lớn nhất (1918 lines)
  overrides/ui-components.css          ← QUAN TRỌNG: !important overrides
  reusable-packages/package-root.css   ← Token riêng (--pkg-* prefix)
```

Tài liệu tham khảo:
- `apps/ssvid.cc/doc_important/SSVID_DARK_THEME_ANALYSIS.md` — phân tích chi tiết
- `apps/ezconv/doc_important/EZCONV_DARK_THEME_PALETTE.md` — palette source

---

## 2. Chiến lược (bắt buộc tuân theo)

**KHÔNG** viết `[data-theme="dark"] .hero-card { background: ... }` cho từng selector.

**PHẢI** làm theo thứ tự:
1. Thêm semantic tokens vào `variables.css` (với giá trị light)
2. Thay thế hardcoded màu trong components bằng các token đó
3. Chỉ cần 1 block `[data-theme="dark"]` override tokens
4. Override `package-root.css`
5. Fix `overrides/ui-components.css`

---

## 3. Dark theme palette (EzConv-inspired — giá trị CỐ ĐỊNH)

```
Brand:            #C65D3B  (burnt orange)
Brand hover:      #B14F2F
Brand soft:       #D9785B

Page bg:          #1F1F1E  (warm charcoal)
Card bg:          #2A2A28
Surface soft:     #383836
Hover surface:    #383836

Text heading:     #E8E6E3
Text body:        #D6D4CF
Text secondary:   #C9C7C2
Placeholder:      #8A8884

Border default:   #3A3A38
Border input:     #40403E
Border subtle:    #2F2F2D

Accent soft fill: rgba(198, 93, 59, 0.12)
Accent strong:    rgba(198, 93, 59, 0.20)
```

**Tuyệt đối KHÔNG thêm màu xanh, tím, glow, glassmorphism.**

---

## 4. Bước 1 — Cập nhật `variables.css`

### 4a. Thêm semantic tokens vào `:root` (giá trị light defaults)

```css
/* Thêm vào CUỐI :root block */

/* Surface tokens */
--bg-page: #F6F6F6;
--bg-card: #ffffff;
--bg-surface-soft: rgba(0, 79, 171, 0.05);
--bg-hover: rgba(0, 79, 171, 0.08);

/* Text tokens */
--text-heading: #374957;
--text-body: #374957;
--text-secondary: #4f5b66;
--text-placeholder: #9ca3af;

/* Border tokens */
--border-default: rgba(137, 137, 137, 0.33);
--border-input: #b0b0b0;
--border-subtle: #e5e7eb;

/* Accent fill tokens */
--accent-fill-soft: rgba(0, 79, 171, 0.08);
--accent-fill-strong: rgba(0, 79, 171, 0.16);

/* Animated border: RGB only (for conic-gradient trick) */
--input-border-glow-rgb: 52, 107, 241;
--input-glow-radial-rgb: 52, 107, 241;

/* Status badge backgrounds */
--status-ready-bg: #eff6ff;
--status-ready-color: #3b82f6;
--status-success-bg: #dcfce7;
--status-success-color: #166534;
--status-error-bg: #fee2e2;
--status-error-color: #b91c1c;
--status-pending-bg: #f1f5f9;
--status-pending-color: #64748b;
--status-analyzing-bg: #e0f2fe;
--status-analyzing-color: #0369a1;
--status-converting-bg: #fff7ed;
--status-converting-color: #c2410c;
```

### 4b. Thêm `[data-theme="dark"]` block sau `:root`

```css
:root[data-theme="dark"] {
  --brand: #C65D3B;
  --brand-hover: #B14F2F;
  --primary-color: #C65D3B;
  --primary-color-hover: #B14F2F;
  --color-accent: #C65D3B;
  --color-accent-hover: #B14F2F;
  --color-accent-dark: rgba(198, 93, 59, 0.20);
  --background-hero-section: #2A2A28;

  --bg-page: #1F1F1E;
  --bg-card: #2A2A28;
  --bg-primary: #1F1F1E;
  --bg-secondary: #1F1F1E;
  --bg-surface-soft: #383836;
  --bg-hover: #383836;
  --surface-weak: rgba(198, 93, 59, 0.10);

  --text-heading: #E8E6E3;
  --text-body: #D6D4CF;
  --text-secondary: #C9C7C2;
  --text: #D6D4CF;
  --text-main: #D6D4CF;
  --text-muted: #C9C7C2;
  --text-placeholder: #8A8884;
  --text-primary: #E8E6E3;
  --muted: #C9C7C2;

  --border-default: #3A3A38;
  --border-input: #40403E;
  --border-subtle: #2F2F2D;
  --border-secondary: #3A3A38;
  --border-glass: 1px solid #3A3A38;

  --accent-fill-soft: rgba(198, 93, 59, 0.12);
  --accent-fill-strong: rgba(198, 93, 59, 0.20);

  --input-border-glow-rgb: 198, 93, 59;
  --input-glow-radial-rgb: 198, 93, 59;

  --status-ready-bg: rgba(198, 93, 59, 0.12);
  --status-ready-color: #D9785B;
  --status-success-bg: rgba(16, 185, 129, 0.15);
  --status-success-color: #10B981;
  --status-error-bg: rgba(231, 76, 60, 0.15);
  --status-error-color: #E74C3C;
  --status-pending-bg: #383836;
  --status-pending-color: #C9C7C2;
  --status-analyzing-bg: rgba(198, 93, 59, 0.10);
  --status-analyzing-color: #D9785B;
  --status-converting-bg: rgba(198, 93, 59, 0.10);
  --status-converting-color: #C65D3B;

  --color-status-error: #E74C3C;
}
```

---

## 5. Bước 2 — Fix `form.css` (animated border gradient)

Tìm `.input-running-border` và `.input-focus-glow`, thay màu hardcoded bằng RGB variable:

```css
.input-running-border {
  background: conic-gradient(from var(--angle),
    rgba(var(--input-border-glow-rgb), 0) 0%,
    rgba(var(--input-border-glow-rgb), 0.4) 10%,
    rgba(var(--input-border-glow-rgb), 0.6) 35%,
    rgba(var(--input-border-glow-rgb), 0.4) 60%,
    rgba(var(--input-border-glow-rgb), 0) 70%);
}

.input-focus-glow {
  background-image: radial-gradient(75% 181% at 50% 50%,
    rgba(var(--input-glow-radial-rgb), 0.9) 0px,
    rgba(var(--input-glow-radial-rgb), 0.8) 50%,
    rgba(var(--input-glow-radial-rgb), 0) 100%);
}
```

Cũng thay:
```css
.input-shell .input-content { background: var(--bg-card); }
.input-wrapper { background: var(--bg-card); border-color: var(--border-input); }
```

---

## 6. Bước 3 — Thay hardcoded màu trong components

### `hero.css`
```
.hero-card         → background: var(--bg-card)
```

### `content.css`
```
.subsection                              → background: var(--bg-card)
.content-section--gray .subsection      → background: var(--bg-card)
.content-section--white .subsection     → background: var(--bg-surface-soft)
.faq-item                               → background: var(--bg-card)
.content-section p { color: black }     → color: var(--text-body)
```

### `format-selector.css`
```
.format-toggle    → background: var(--bg-card); border-color: var(--border-input)
.quality-select   → background: var(--bg-card); color: var(--text-body); border-color: var(--border-input)
```

### `header.css`
```
.drawer-content           → background: var(--bg-card); color: var(--text-body)
.license-dropdown         → background: var(--bg-card); border-color: var(--border-default)
.lang-dropdown            → background: var(--bg-card); color: var(--text-body)
.drawer-link              → color: var(--text-body)
.drawer-sublink           → color: var(--text-body)
.drawer-lang-button       → border-color: var(--border-default); background: var(--bg-surface-soft); color: var(--text-body)
.license-dropdown-item    → color: var(--text-body)
.license-dropdown-item:hover → background: var(--bg-hover)
.lang-option:hover        → background: var(--bg-hover)
.license-dropdown.drawer-license-actions.open → border-color: var(--border-default); background: var(--bg-surface-soft)
```

### `multiple-downloader-v2.css` (đọc toàn bộ file trước khi edit)
```
.multiple-download-card              → background: var(--bg-card)
.urls-input-container                → background: var(--bg-card); border-color: var(--border-input)
.multi-format-toggle                 → background: var(--bg-card); border-color: var(--border-input)
.multi-quality-select                → background: var(--bg-card); color: var(--text-body); border-color: var(--border-input)
.multi-download-header (bg #f8fafc)  → background: var(--bg-surface-soft) (giữ !important nếu có)
.multi-header-top-row                → background: var(--bg-surface-soft)
.multiple-download-group-actions     → background: var(--bg-surface-soft)
.multi-video-item                    → background: var(--bg-card); border-color: var(--border-subtle)
.multi-video-thumb                   → background: var(--bg-surface-soft)
.multi-video-title (#1a1a1a)         → color: var(--text-heading)
.multi-video-author (#64748b)        → color: var(--text-secondary)
.multi-header-title (#1e293b)        → color: var(--text-heading)
.item-count-total                    → color: var(--text-secondary)
.selected-text                       → color: var(--text-secondary)
.content-col p (#4b5563)             → color: var(--text-secondary)
.input-action-btn                    → color: var(--text-secondary)
.item-setting-badge (#f1f5f9)        → background: var(--bg-surface-soft); color: var(--text-secondary)
.progress-percentage-label (#1e293b) → color: var(--text-heading)
.multi-video-progress (#f1f5f9)      → background: var(--bg-surface-soft)
.urls-textarea::placeholder          → color: var(--text-placeholder)
```

Status badges — thay toàn bộ:
```css
.status-badge.ready     { background: var(--status-ready-bg);     color: var(--status-ready-color);     border: none; }
.status-badge.pending   { background: var(--status-pending-bg);   color: var(--status-pending-color);   }
.status-badge.analyzing { background: var(--status-analyzing-bg); color: var(--status-analyzing-color); }
.status-badge.downloading { background: var(--status-success-bg); color: var(--status-success-color);   }
.status-badge.success,
.status-badge.completed { background: var(--status-success-bg);   color: var(--status-success-color);   border: none; }
.status-badge.error     { background: var(--status-error-bg);     color: var(--status-error-color);     border: none; }
.status-badge.converting{ background: var(--status-converting-bg);color: var(--status-converting-color);}
.status-badge.cancelled { background: var(--status-pending-bg);   color: var(--status-pending-color);   }
```

---

## 7. Bước 4 — Fix `overrides/ui-components.css`

File này dùng `!important` để override package styles. Giữ `!important`, chỉ thay giá trị màu:

```css
.suggestion-container {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-subtle) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.suggestion-item {
  background-color: var(--bg-card) !important;
  color: var(--text-body) !important;
  border-bottom: 1px solid var(--border-subtle) !important;
}

.suggestion-item:hover,
.suggestion-item.active,
.suggestion-item:focus,
.suggestion-item.suggestion-item--highlighted {
  background-color: var(--accent-fill-soft) !important;
  color: var(--brand) !important;
}

.suggestion-item strong { color: var(--brand) !important; }

.search-result-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-subtle) !important;
}

.search-result-card .card-title { color: var(--text-heading) !important; }
.search-result-card .meta-info  { color: var(--text-secondary) !important; }
.skeleton-card { background-color: var(--bg-card) !important; }
```

---

## 8. Bước 5 — Override `package-root.css`

Thêm vào CUỐI file (sau block `[data-theme="light"]` đang có):

```css
[data-theme="dark"] {
  --pkg-color-primary: #C65D3B;
  --pkg-color-on-primary: #ffffff;
  --pkg-color-primary-container: rgba(198, 93, 59, 0.12);
  --pkg-color-on-primary-container: #D9785B;

  --pkg-color-surface: #2A2A28;
  --pkg-color-surface-variant: #1F1F1E;
  --pkg-color-surface-container: #383836;
  --pkg-color-on-surface: #E8E6E3;
  --pkg-color-on-surface-variant: #C9C7C2;

  --pkg-color-outline: #3A3A38;
  --pkg-color-outline-variant: #2F2F2D;

  --pkg-suggestions-bg: #2A2A28;
  --pkg-suggestions-text-color: #E8E6E3;
  --pkg-suggestions-hover-bg: rgba(198, 93, 59, 0.10);
  --pkg-suggestions-highlight-bg: rgba(198, 93, 59, 0.12);
  --pkg-suggestions-highlight-color: #D9785B;

  --pkg-search-results-section-bg: #1F1F1E;
  --pkg-search-results-card-bg: #2A2A28;
  --pkg-search-results-title-color: #E8E6E3;
  --pkg-search-results-channel-color: #C9C7C2;
  --pkg-search-results-metadata-color: #C9C7C2;
  --pkg-search-results-card-shadow-hover: 0 4px 20px rgba(198, 93, 59, 0.15);

  --pkg-expire-modal-bg: #2A2A28;
  --pkg-captcha-modal-bg: #1F1F1E;
  --pkg-captcha-modal-border-color: #3A3A38;

  --pkg-skeleton-color-dark: rgba(255, 255, 255, 0.10);
  --pkg-skeleton-color-light: rgba(255, 255, 255, 0.05);
}
```

---

## 9. Bước 6 — Theme switcher JS

```javascript
// Toggle dark mode
function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', theme);
}

// Khởi tạo khi trang load (đặt rất sớm, ưu tiên trong <head>)
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}
```

---

## 10. Ràng buộc (KHÔNG được vi phạm)

- Không viết `[data-theme="dark"] .hero-card { ... }` — đó là duplicate
- Không rewrite layout, spacing, font sizes
- Không thêm `box-shadow` nặng vào dark mode
- Không dùng màu xanh dương, tím, neon, glassmorphism
- Không thay đổi màu `.group-download-btn` (green success của nút download ZIP — đây là semantic color)
- Không thay đổi cấu trúc HTML
- Không cần làm theme toggle button nếu không được yêu cầu

---

## 11. Verify sau khi xong

Mở browser console và chạy `document.documentElement.setAttribute('data-theme', 'dark')`:

- ✅ `.hero-card` → nền `#2A2A28`, không trắng
- ✅ `.input-running-border` gradient → màu cam, không xanh
- ✅ Mobile drawer → nền `#2A2A28`
- ✅ Lang dropdown → nền `#2A2A28`
- ✅ Body text → `#D6D4CF`, không đen
- ✅ Status badges → tông ấm cam/xanh lá muted, không bright blue/green

---END PROMPT---
