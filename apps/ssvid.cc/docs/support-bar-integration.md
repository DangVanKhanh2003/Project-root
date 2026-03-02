# Support Platforms Bar — Integration Guide

Thanh **Support Platforms Bar** là một UI component nhỏ gọn hiển thị ngay bên dưới khung input chính, liệt kê các nền tảng được hỗ trợ (YouTube, TikTok, Facebook, Instagram…). Nó "dính" vào đáy card input, tạo cảm giác là một phần nối tiếp của card.

---

## Kết quả trực quan

```
┌─────────────────────────────────────────────┐  ← .hero-card
│  [  Paste your link here...       ] [Paste] │
│  [MP3 ▼]  [Quality ▼]  [  Convert  ]        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐  ← .support-platforms-btn
│  Supported platforms       [YT][TT][FB][IG] │
└─────────────────────────────────────────────┘
```

---

## 1. HTML

Đặt block sau **ngay sau** thẻ đóng của `.hero-card` (hoặc card input chính):

```html
<div class="support-platforms-container">
    <button class="support-platforms-btn" type="button">
        <div class="support-platforms-content">
            <p class="support-platforms-text">Supported platforms</p>

            <div class="support-platforms-right">
                <div class="support-platforms-icons-group">

                    <!-- YouTube -->
                    <div class="support-platforms-icon-item">
                        <svg viewBox="0 0 24 24" fill="#FF0000" width="12" height="12">
                            <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M9.999,15.595V8.405L16.001,12L9.999,15.595z"/>
                        </svg>
                    </div>

                    <!-- TikTok -->
                    <div class="support-platforms-icon-item">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                    </div>

                    <!-- Facebook -->
                    <div class="support-platforms-icon-item">
                        <svg viewBox="0 0 24 24" fill="#1877F2" width="12" height="12">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </div>

                    <!-- Instagram -->
                    <div class="support-platforms-icon-item">
                        <svg viewBox="0 0 24 24" width="12" height="12">
                            <defs>
                                <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stop-color="#fd5949" />
                                    <stop offset="50%" stop-color="#d6249f" />
                                    <stop offset="100%" stop-color="#285AEB" />
                                </linearGradient>
                            </defs>
                            <path fill="url(#igGradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </div>

                </div>
            </div>
        </div>
    </button>
</div>
```

> **Lưu ý**: Nếu dùng nhiều trang có gradient Instagram, đảm bảo `id="igGradient"` là duy nhất trên mỗi trang, hoặc dùng `<use>` từ một `<defs>` global.

---

## 2. CSS Variables (thêm vào `:root`)

```css
:root {
    /* Support Bar — Light Theme */
    --support-bg:       #f5f4ed;
    --support-bg-hover: #ecece2;
    --support-text:     #3d3d3a;
}

:root[data-theme="dark"] {
    /* Support Bar — Dark Theme */
    --support-bg:       #1f1e1d;
    --support-bg-hover: #3a3a38;
    --support-text:     #c2c0b6;
}
```

---

## 3. CSS Component

Paste toàn bộ khối này vào stylesheet của bạn (hoặc vào file riêng `support-bar.css`):

```css
/* ─── Support Platforms Bar ──────────────────────────────── */

.support-platforms-container {
    padding: 0 0.75rem;
    width: 100%;
}

@media (min-width: 768px) {
    .support-platforms-container {
        padding: 0 1rem;
    }
}

/* Button "dính" vào đáy card */
.support-platforms-btn {
    width: 100%;
    position: relative;
    z-index: 0;

    /* Kéo lên để gắn vào card phía trên */
    margin-top: -0.25rem;
    margin-bottom: -0.25rem;

    padding: 8px 1rem 5px;

    border: 1px solid transparent;
    border-top: none;                        /* Không có viền trên — hòa vào card */
    border-bottom-left-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;

    background-color: var(--support-bg);

    cursor: default;
    appearance: none;
    outline: none;
    font-family: inherit;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

.support-platforms-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 0.375rem;
}

.support-platforms-text {
    font-size: 13px;
    font-weight: 500;
    color: var(--support-text);
    margin: 0;
}

.support-platforms-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.support-platforms-icons-group {
    display: flex;
    align-items: center;
}

/* Mỗi icon badge */
.support-platforms-icon-item {
    width: 18px;
    height: 18px;
    border-radius: 4.86px;
    background-color: #fff;
    border: 1px solid var(--border-subtle, #e5e7eb);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;

    /* Stacking overlap effect */
    flex-shrink: 0;
    position: relative;
    transition: opacity 0.5s ease;
}

.support-platforms-icon-item:first-child {
    margin-left: 0;
}

.support-platforms-icon-item svg {
    max-width: 12px;
    max-height: 12px;
    object-fit: contain;
}
```

---

## 4. Cách đặt trong bố cục

Component này được thiết kế để đặt **ngay sau card input** (`.hero-card`). Quan hệ HTML:

```html
<div class="hero-card">
    <!-- form input -->
</div>

<div class="support-platforms-container">   ← đặt ở đây
    <button class="support-platforms-btn">
        ...
    </button>
</div>
```

Kỹ thuật `margin-top: -0.25rem` + `border-top: none` khiến thanh này "nối tiếp" card phía trên mà không có khe hở.

Nếu card của bạn có `border-radius`, đảm bảo container bọc ngoài đủ rộng để padding trái/phải của `.support-platforms-container` canh đúng với card.

---

## 5. Tuỳ chỉnh

| Muốn thay đổi | Sửa ở đâu |
|---|---|
| Màu nền thanh | `--support-bg` |
| Màu chữ | `--support-text` |
| Text label | `<p class="support-platforms-text">` |
| Thêm icon nền tảng | Thêm `<div class="support-platforms-icon-item">` |
| Kích thước icon | `width/height` trên SVG (hiện là `12px`) |
| Hover background | `--support-bg-hover` (chưa kích hoạt mặc định — thêm `:hover` nếu cần) |

### Thêm hover effect (tuỳ chọn)

```css
.support-platforms-btn:hover {
    background-color: var(--support-bg-hover);
}
```

---

## 6. Bonus: Input Field Active Border & Caret

Đây là CSS đi kèm cho phần input phía trên (active border khi focus + caret màu trắng ở dark theme):

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

- [ ] Thêm CSS variables vào `:root` và `:root[data-theme="dark"]`
- [ ] Paste CSS component vào stylesheet
- [ ] Thêm HTML sau card input
- [ ] Đảm bảo `--border-subtle` đã được định nghĩa (hoặc thay bằng giá trị cứng `#e5e7eb`)
- [ ] Nếu dùng dark mode: đảm bảo `data-theme="dark"` được set lên thẻ `<html>` hoặc `:root`
- [ ] Kiểm tra trên mobile (< 768px) — padding tự điều chỉnh qua media query
