# Support Platforms Bar — Integration Guide

Thanh **Support Platforms Bar** là một UI component nhỏ gọn nằm **bên trong** `.hero-card`, hiển thị ở dưới cùng card. Nó liệt kê các nền tảng được hỗ trợ (YouTube, TikTok, Facebook, Instagram) bằng các icon stroke màu gray, căn giữa.

---

## Kết quả trực quan

```
┌─────────────────────────────────────────────────┐  ← .hero-card
│  [  Paste your link here...         ] [Paste]   │
│  [MP3 ▼]  [Quality ▼]  [  Convert  ]           │
│                                                 │
│     Supported platforms  [YT] [TT] [FB] [IG]   │  ← .support-platforms-bar
└─────────────────────────────────────────────────┘
```

---

## 1. HTML

Đặt block sau **bên trong** `.hero-card`, ở vị trí cuối cùng trước thẻ đóng `</div>` của card:

```html
<div class="support-platforms-bar">
    <span class="support-platforms-label">Supported platforms</span>
    <div class="support-platforms-icons">
        <!-- YouTube -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="support-platform-icon" aria-hidden="true">
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
            <path d="m10 15 5-3-5-3z"></path>
        </svg>
        <!-- TikTok -->
        <svg class="support-platform-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"></path>
        </svg>
        <!-- Facebook -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="support-platform-icon" aria-hidden="true">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
        <!-- Instagram -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="support-platform-icon" aria-hidden="true">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
        </svg>
    </div>
</div>
```

> **Lưu ý**: Icon sử dụng Lucide-style stroke SVG (không có fill màu riêng, dùng `currentColor` qua CSS). TikTok dùng `fill="currentColor"` vì icon này không có phiên bản stroke.

---

## 2. CSS Component

Thêm vào `hero.css` (hoặc stylesheet tương ứng):

```css
/* Support Platforms Bar (inside hero-card) */
.support-platforms-bar {
    padding: 30px 24px 0px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}

.support-platforms-label {
    font-size: 12px;
    color: var(--text-muted, #9ca3af);
    white-space: nowrap;
}

.support-platforms-icons {
    display: flex;
    align-items: center;
    gap: 8px;
}

.support-platform-icon {
    width: 14px;
    height: 14px;
    color: var(--text-muted, #9ca3af);
    flex-shrink: 0;
}
```

> Không cần thêm CSS variables riêng. Component sử dụng `--text-muted` có sẵn trong hệ thống design tokens.

---

## 3. Cách đặt trong bố cục

Component nằm **bên trong** `.hero-card`, ở cuối card:

```html
<div class="hero-card">
    <!-- search-view / form input -->
    <div id="search-view">...</div>

    <!-- result-view -->
    <div id="result-view" class="hidden">...</div>

    <!-- ↓ Support platforms bar ở đây ↓ -->
    <div class="support-platforms-bar">
        <span class="support-platforms-label">...</span>
        <div class="support-platforms-icons">...</div>
    </div>
</div>  <!-- đóng .hero-card -->
```

---

## 4. Tuỳ chỉnh

| Muốn thay đổi | Sửa ở đâu |
|---|---|
| Màu text & icon | `--text-muted` (dùng chung với hệ thống) |
| Text label | `<span class="support-platforms-label">` |
| Thêm icon nền tảng | Thêm `<svg class="support-platform-icon">` vào `.support-platforms-icons` |
| Kích thước icon | `.support-platform-icon` → `width` / `height` (hiện 14px) |
| Khoảng cách icon | `.support-platforms-icons` → `gap` (hiện 8px) |
| Padding | `.support-platforms-bar` → `padding` (hiện 30px top, 0 bottom) |

---

## 5. Files liên quan

| File | Vai trò |
|---|---|
| `_templates/_includes/partials/hero-form.njk` | HTML template cho trang download chính |
| `_templates/_includes/partials/strim-form.njk` | HTML template cho trang cắt video |
| `src/styles/sections/hero.css` | CSS cho support platforms bar |

---

## 6. Bonus: Input Field Active Border & Caret

CSS đi kèm cho phần input phía trên (active border khi focus + caret màu trắng ở dark theme):

### CSS Variables

```css
:root {
    --input-caret-color: var(--text-body);   /* Dark text caret — light theme */
}

:root[data-theme="dark"] {
    --input-caret-color: #ffffff;            /* White caret — dark theme */
}
```

### Component CSS

```css
/* Active border khi click vào input */
.input-shell:focus-within .input-wrapper,
.input-wrapper:focus-within {
    border-color: var(--color-accent);
}

/* Màu caret theo theme */
.video-input {
    caret-color: var(--input-caret-color);
}
```

`--color-accent` tự động là màu brand của từng theme (xanh dương ở light, cam ở dark).

---

## 7. Checklist tích hợp

- [x] Thêm HTML vào bên trong `.hero-card` (cuối card)
- [x] Thêm CSS vào `hero.css`
- [x] Xóa CSS variables cũ (`--support-bg`, `--support-bg-hover`, `--support-text`)
- [x] Đảm bảo `--text-muted` đã được định nghĩa trong design tokens
- [ ] Kiểm tra trên mobile (< 768px)
