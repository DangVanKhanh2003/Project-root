# Performance Investigation: ytmp4.gg iOS/macOS Chrome Lag

## Triệu chứng
- Lag khi scroll page trên iOS/macOS Chrome
- Lag khi animation fill status container (progress bar)
- ytmp3.gg không bị lag dù cũng dùng cùng kỹ thuật animate `width` trên progress bar

## Root Cause: Compositing Layer Storm

Không phải 1 nguyên nhân đơn lẻ — mà là **nhiều yếu tố đắt đỏ chồng lên nhau**, tạo thành "paint storm" trên mỗi frame. ytmp3.gg cũng animate `width` nhưng page nhẹ nên không bị. ytmp4.gg animate `width` trên page nặng (nhiều compositing layers + continuous animation) nên lag.

---

## 
```css
.site-header {
    position: relative;
    z-index: 200;
    background: var(--background-hero-section);
    backdrop-filter: blur(10px);        /* ← TẠO COMPOSITING LAYER ĐẮT ĐỎ */
    padding: 5px 0px;
}
```

### ytmp3.gg — `src/styles/common.css:14-20`
```css
.header-background {
    background-color: var(--background-primary);
    width: 100%;
    padding: 5px var(--container-padding-sm);
    position: static;                    /* ← KHÔNG CÓ BLUR, STATIC POSITION */
    z-index: 1100;
}
```

### Tại sao gây lag?
- `backdrop-filter: blur(10px)` buộc browser phải **đọc pixel phía dưới → apply blur → composite** trên **MỖI FRAME**
- Khi bất kỳ child nào repaint (progress bar, scroll, animation) → header phải re-composite
- iOS/macOS Chrome tối ưu `backdrop-filter` rất kém so với desktop
- Header luôn hiển thị → overhead **liên tục** trong suốt session

---

## Issue #2: Conic-Gradient Animation Chạy Liên Tục — HIGH

### ytmp4.gg — `src/styles/components/form.css:8-46`
```css
@property --angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
}

@keyframes rotate-gradient {
    to { --angle: 360deg; }
}

.input-running-border {
    filter: blur(2px);                   /* ← THÊM BLUR */
    background: conic-gradient(from var(--angle),
            rgba(var(--input-border-glow-rgb), 0) 0%,
            rgba(var(--input-border-glow-rgb), 0.4) 10%,
            rgba(var(--input-border-glow-rgb), 0.6) 35%,
            rgba(var(--input-border-glow-rgb), 0.4) 60%,
            rgba(var(--input-border-glow-rgb), 0) 70%);
    animation: rotate-gradient 8s linear infinite;  /* ← CHẠY MÃI MÃI */
    transition: opacity 0.4s ease;
    opacity: 1;
}
```

### ytmp3.gg
**Không có animation nào trên input.** Chỉ dùng `border-color transition 0.2s` đơn giản.

### Tại sao gây lag?
- `@property --angle` + `conic-gradient` là combination **rất đắt** để compute mỗi frame
- `filter: blur(2px)` compound thêm
- Animation chạy **infinite** — ngay cả khi user đang scroll, không focus input
- Trên iOS GPU phải render conic-gradient + blur **60 lần/giây liên tục**

---

## Issue #3: Merging Animation 40 Giây Animate `width` — HIGH

### ytmp4.gg — `src/styles/reusable-packages/conversion-status/conversion-status.css:121-149`
```css
.status--processing.status--merging::before {
  width: 0%;
  animation: merging-progress 40s ease-out forwards;  /* ← 40 GIÂY ANIMATE WIDTH */
  transition: none !important;
}

@keyframes merging-progress {
  from { width: 0%; }
  37.5% { width: 50%; }
  to { width: 98%; }
}
```

### ytmp3.gg — `src/styles/features/download-ui.css:56-72`
```css
.status::before {
  width: var(--progress-width, 0%);
  transition: width 0.1s ease;          /* ← CHỈ TRANSITION KHI JS UPDATE */
  display: none;                        /* ← ẨN KHI KHÔNG CẦN */
}

.status.status--has-progress::before {
  display: block;                       /* ← CHỈ HIỆN KHI CÓ PROGRESS */
}
```

### Tại sao khác?
- ytmp4.gg: CSS `@keyframes` chạy **liên tục 40 giây**, animate `width` mỗi frame → layout recalc mỗi frame
- ytmp3.gg: Chỉ transition `width` **khi JS update** CSS variable (mỗi API response) → ít layout recalc hơn nhiều
- ytmp3.gg **ẩn progress bar** (`display: none`) khi không cần → 0 paint cost

---

## Issue #4: Thiếu iOS Scroll Optimizations — HIGH

### ytmp3.gg — `src/styles/common.css:528-552` (mobile drawer + scroll containers)
```css
/* iOS Safari scroll optimization */
-webkit-overflow-scrolling: touch;

/* Prevent overscroll bounce */
overscroll-behavior: none;
overscroll-behavior-x: none;
overscroll-behavior-y: contain;

/* Lock touch to vertical only */
touch-action: pan-y;

/* GPU acceleration for scroll */
will-change: scroll-position;
-webkit-backface-visibility: hidden;
backface-visibility: hidden;
```

### ytmp4.gg
**Không có bất kỳ optimization nào ở trên.** Scroll containers (`.group-items`, dropdowns) thiếu hoàn toàn các thuộc tính iOS.

### Tại sao gây lag?
- Không có `-webkit-overflow-scrolling: touch` → iOS không dùng momentum scrolling tối ưu
- Không có `overscroll-behavior` → rubber-band bouncing gây extra repaint
- Không có `will-change: scroll-position` → browser không chuẩn bị GPU layer cho scroll

---

## Issue #5: Forced Reflows Trong Animation Code — MEDIUM

### ytmp4.gg — `src/features/downloader/ui-render/download-rendering.ts:416`
```typescript
void statusElement.offsetWidth;  // ← FORCE BROWSER LAYOUT SYNC
```

### ytmp4.gg — `src/features/downloader/ui-render/multiple-download/video-item-renderer.ts:362,384`
```typescript
void bar.offsetWidth;  // ← FORCE REFLOW (lần 1)
void bar.offsetWidth;  // ← FORCE REFLOW (lần 2)
```

### Tại sao gây lag?
- `offsetWidth` buộc browser **dừng mọi thứ** để sync layout
- Khi đang scroll + animation → forced reflow block main thread → dropped frame
- 3 chỗ forced reflow trong code path của progress animation

---

## Issue #6: setInterval 100ms Update DOM During Scroll — MEDIUM

### ytmp4.gg — `src/features/downloader/ui-render/merging-progress-estimator.ts:41`
```typescript
intervalId = window.setInterval(() => {
  // ... calculate progress ...
  onProgressCallback(rounded);  // ← GHI DOM MỖI 100ms
}, 100);
```

### ytmp4.gg — `src/features/downloader/ui-render/download-rendering.ts:225`
```typescript
const interval = window.setInterval(() => {
  statusTextElement.textContent = EXTRACTING_MESSAGES[msgIndex];  // ← GHI DOM MỖI 1s
}, 1000);
```

### Tại sao gây lag?
- Timer chạy trên **main thread**, cạnh tranh với scroll event handler
- DOM write trong timer → trigger repaint → cộng dồn với scroll + animation repaint

---

## Issue #7: `getBoundingClientRect()` Trong Scroll Handler — MEDIUM

### ytmp4.gg — `src/features/downloader/ui-render/content-renderer.ts:147`
```typescript
window.addEventListener('scroll', throttledCheck, { passive: true });

const checkGridScroll = (): void => {
  const gridRect = grid.getBoundingClientRect();  // ← FORCE LAYOUT READ MỖI SCROLL
  const distanceToBottom = gridRect.bottom - window.innerHeight;
};
```

### Tại sao gây lag?
- `getBoundingClientRect()` force browser flush layout changes
- Nếu progress bar đang animate `width` → browser phải recalc layout trước khi trả kết quả → stall frame

---

## Issue #8: Thiếu CSS Containment — LOW-MEDIUM

### Cả hai project đều thiếu
Không có `contain` hay `will-change` trên status container / progress bar.

### Fix cần thêm:
```css
.status-container {
  contain: layout style paint;
  will-change: contents;
}
```
Isolate layout impact → progress bar width change không trigger layout recalc toàn page.

---

## Tổng Hợp So Sánh

| # | Issue | ytmp4.gg | ytmp3.gg | Severity |
|---|-------|----------|----------|----------|
| 1 | Header backdrop-filter | `blur(10px)` — re-composite mỗi frame | Không có | CRITICAL |
| 2 | Input animation | Conic-gradient 8s infinite + blur | Không có | HIGH |
| 3 | Merging progress | CSS @keyframes 40s animate `width` | JS update only khi API response | HIGH |
| 4 | iOS scroll optimizations | Không có | Đầy đủ (momentum, overscroll, will-change) | HIGH |
| 5 | Forced reflows | 3 chỗ `void element.offsetWidth` | Không rõ | MEDIUM |
| 6 | setInterval DOM writes | 100ms + 1000ms intervals | Ít hơn | MEDIUM |
| 7 | getBoundingClientRect on scroll | Có, trong RAF callback | Không rõ | MEDIUM |
| 8 | CSS containment | Không có | Không có | LOW-MEDIUM |

---

## Chuỗi Lag (tại sao kết hợp mới gây lag)

```
User scroll trên iOS
  → Browser cần repaint scroll (không có -webkit-overflow-scrolling tối ưu)
  → Header backdrop-filter: blur(10px) phải re-composite (vì page repaint)
  → Conic-gradient animation đang chạy → thêm GPU work
  → Progress bar đang animate width (@keyframes 40s) → layout recalc mỗi frame
  → setInterval 100ms ghi DOM → thêm repaint
  → getBoundingClientRect() trong scroll handler → force layout flush
  → TẤT CẢ CÙNG HIT MAIN THREAD 1 LÚC
  → Dropped frames → LAG
```

ytmp3.gg không có 4 yếu tố đầu tiên → main thread nhẹ → animate `width` + scroll = vẫn mượt.

---

## Fix Priority

1. **Bỏ `backdrop-filter: blur(10px)`** trên header → dùng solid/semi-transparent background
2. **Tắt conic-gradient animation** khi không focus hoặc bỏ hẳn
3. **Thêm iOS scroll optimizations** cho scroll containers
4. **Thêm `contain: layout style paint`** cho status container
5. **Cân nhắc thay `width` animation bằng `transform: scaleX()`** cho merging phase
6. **Giảm forced reflows** — tìm cách khác thay `void el.offsetWidth`
