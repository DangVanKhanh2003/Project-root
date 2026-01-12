Tuyệt vời - dưới đây là **phiên bản hoàn chỉnh hợp nhất** toàn bộ tài liệu kiến trúc frontend, đã bao gồm: triết lý, cấu trúc, tách base/preload/feature, quy tắc mobile-first, section-level CSS, và media query chuẩn.
Bạn có thể copy nguyên văn làm file:
📘 `ARCHITECTURE_GUIDELINES.md`

---

# 🧭 FRONTEND ARCHITECTURE GUIDELINES

## 1️⃣ Triết Lý & Mục Tiêu

Kiến trúc này được thiết kế cho **website hiện đại, mobile-first**, tối ưu hiệu năng, và dễ mở rộng lâu dài.
Mục tiêu chính:

* **Hiệu năng tối đa:** giảm tài nguyên tải ban đầu, áp dụng lazy-loading triệt để.
* **Cấu trúc tách bạch:** base / preload / feature rõ ràng.
* **Dễ bảo trì:** module hoá, mỗi file một trách nhiệm.
* **Mở rộng an toàn:** thêm trang hoặc tính năng mới mà không ảnh hưởng phần cũ.

---

## 2️⃣ Công Nghệ Chính

* **Build Tool:** Vite ([https://vitejs.dev/](https://vitejs.dev/))
* **Ngôn ngữ:** Vanilla JS (ES6+ Modules)
* **Styling:** CSS thuần với CSS Variables (Design Tokens)
* **Linting:** ESLint + Stylelint
* **Performance Tools:** vite-plugin-critical, PurgeCSS / LightningCSS

---

## 3️⃣ Cấu Trúc Thư Mục Chuẩn

```
/pages/                 # HTML pages (entry)
  index.html
  downloader.html

/public/                # Assets tĩnh (ảnh, font, favicon...)
  favicon.ico

/src/
  main.js               # Orchestrator – xác định page, import module
  /styles/
    reset.css           # Làm phẳng khác biệt trình duyệt
    base.css            # Tokens + typography + layout cơ bản
    /preload/           # Critical CSS cho trang hiển thị ngay
      hero.critical.css
      header.critical.css
    /features/          # CSS cho module/section lazy-load
      hero.interactive.css
      modal.css
  /libs/                # Business logic, không đụng DOM
    downloader-lib/
  /features/            # UI logic – mỗi module 1 chức năng
    downloader/
      index.js
      pastebox.js
      results.js
      modal.js
```

---

## 4️⃣ Nguyên Tắc Mobile-First & Tuân Thủ Base

### 4.1 Mobile-First (Bắt Buộc)

* ✅ Tất cả CSS **mobile trước, mở rộng bằng `@media (min-width)`**.
* ❌ Cấm `@media (max-width)` (trừ trường hợp được ghi chú).
* ✅ Dùng token breakpoint (`var(--bp-*)`), không hardcode px.
* ✅ Dùng `clamp()` cho font/spacing để giảm số breakpoint.

### 4.2 Tuân Thủ Base

* ✅ Mọi giá trị màu, spacing, font, radius, shadow phải dùng token từ `base.css`.
* ❌ Cấm hardcode như `#1b5e20`, `20px`, `box-shadow: ...`.

### 4.3 Phân Tầng CSS

| Tầng          | Mục tiêu                 | Ví dụ                      |
| ------------- | ------------------------ | -------------------------- |
| **reset.css** | Normalize trình duyệt    | box-sizing, margin:0       |
| **base.css**  | Token & primitive        | typography, container, btn |
| **preload/**  | Critical hiển thị ngay   | hero, header               |
| **features/** | CSS lazy cho interaction | modal, hover nâng cao      |

### 4.4 JS

* `main.js`: chỉ **orchestrator** – xác định `body#id`, dynamic import module trang.
* `features/`: mỗi file 1 chức năng (UI logic).
* `libs/`: business logic thuần, không thao tác DOM.
* Không dùng jQuery; chỉ dùng ES Modules.

---

## 5️⃣ Section-Level CSS Strategy (Preload vs Feature)

### 5.1 Mục Tiêu

* Chỉ tải CSS **cần thiết cho lần vẽ đầu** (above-the-fold).
* CSS chia theo **section**: mỗi section có preload và feature riêng.

### 5.2 Quy Tắc

* **Preload (critical):** layout, màu, typography, spacing – áp dụng ngay.
* **Feature:** animation, hover, state (`.is-open`, `.is-playing`...), lazy-load.
* **Không** để style interaction trong preload.

### 5.3 Cấu Trúc

```
/styles/
  /preload/
    hero.critical.css
  /features/
    hero.interactive.css
```

### 5.4 Nguyên Tắc “Không rò rỉ”

* Section chỉ style chính nó (`.hero`, `.faq`...), không ảnh hưởng block khác.
* Không `@import` chéo giữa preload/feature.

### 5.5 Definition of Done (Section)

* [ ] Có preload CSS áp dụng ngay.
* [ ] Có feature CSS lazy-load nếu có interaction.
* [ ] Không CLS, không unused CSS >1KB.
* [ ] Test ở 320 / 480 / 768 / 1024 / 1440 / 1920.

---

## 6️⃣ MEDIA QUERY CHUẨN (BẮT BUỘC TRONG MỌI FILE CSS)

### 6.1 Cấu Trúc Phải Có

Mỗi file CSS **bắt buộc** có phần khai báo media theo chuẩn dưới đây **ở ngay đầu file**, trước phần style chính.

```css
/* =========================================================
   Responsive Breakpoints (BẮT BUỘC CHO MỌI FILE)
   ---------------------------------------------------------
   • Extra Small Mobile (0–350px)
   • Small Mobile (351–599px)
   • Medium (Tablet) – 600–839px
   • Expanded (Desktop) – 840–1239px
   • Large (Wide Desktop) – 1240px+
   ========================================================= */
```

### 6.2 Nguyên Tắc

* ✅ Tất cả CSS responsive **phải tập trung trong một khu media duy nhất** (đặt ở đầu file).
* ❌ Cấm có `@media` rải rác ở giữa hoặc cuối file.
* ✅ Dùng **mobile-first**: `@media (min-width: …)`.
* ✅ Sử dụng token breakpoint từ `:root`.
* ✅ Nếu không có rule nào cho breakpoint nào, vẫn để comment placeholder (để đồng nhất).

**Ví dụ (cấu trúc khung ở đầu file):**

```css
/* =========================================================
   Responsive Breakpoints (BẮT BUỘC)
   ---------------------------------------------------------
   • Extra Small Mobile (0–350px)
   • Small Mobile (351–599px)
   • Medium (Tablet) – 600–839px
   • Expanded (Desktop) – 840–1239px
   • Large (Wide Desktop) – 1240px+
   ========================================================= */

@media (min-width: 0px) and (max-width: 350px) {
  /* Extra Small Mobile rules here */
}

@media (min-width: 351px) and (max-width: 599px) {
  /* Small Mobile rules here */
}

@media (min-width: 600px) and (max-width: 839px) {
  /* Medium Tablet rules here */
}

@media (min-width: 840px) and (max-width: 1239px) {
  /* Expanded Desktop rules here */
}

@media (min-width: 1240px) {
  /* Large Wide Desktop rules here */
}

/* ======= Base Style (Common for all devices) ======= */
```

---

## 7️⃣ Hiệu Năng & Budget

| Mục                      | Giới hạn                         |
| ------------------------ | -------------------------------- |
| Critical CSS inline      | ≤ **10KB**                       |
| JS khởi tạo (main+entry) | ≤ **70KB gzip**                  |
| Unused CSS mỗi trang     | ≤ **2KB**                        |
| Ảnh LCP                  | ≤ **200KB**, dùng `srcset/sizes` |
| LCP                      | ≤ **2.5s**                       |
| CLS                      | < **0.1**                        |
| TBT                      | ≤ **200ms**                      |

**PR sẽ bị từ chối nếu vượt budget.**

---

## 8️⃣ Accessibility & SEO

* Focus ring rõ ràng; hỗ trợ `prefers-reduced-motion`.
* Màu tương phản ≥ 4.5:1.
* Form có `label`/`aria-*`.
* `<title>`, `meta description`, `canonical`, `og:` tags đầy đủ.
* ALT ảnh có nghĩa; nút là `<button>`, link là `<a>`.

---

## 9️⃣ Code Style & Linting

### CSS

* BEM + prefix feature (`.dl-hero__title`, `.faq-item--open`).
* Selector sâu tối đa **3 cấp**.
* Cấm `!important` (trừ trường hợp đặc biệt, có chú thích).

**Stylelint rule bắt buộc:**

* Không `@media (max-width)`.
* Phải có block “Responsive Breakpoints” ở đầu file.
* Không hardcode màu/spacing/font.
* Không cascade sâu >3 cấp.

### JS

* Mỗi module 1 chức năng; export `init()`.
* Không default export mơ hồ.
* `main.js` chỉ dynamic import theo `body#id`.
* Cấm jQuery.

### CI / Pre-commit

* `eslint` + `stylelint` check.
* Husky + lint-staged tự động fix trước commit.
* Kiểm tra kích thước build (`scripts/size-check.mjs`).

---

## 🔟 Definition of Done (PR Checklist)

* [ ] File CSS có block media chuẩn đầu trang.
* [ ] Viết mobile-first (`min-width`), không dùng `max-width`.
* [ ] Dùng token base, không hardcode giá trị thiết kế.
* [ ] Section có preload + feature rõ ràng.
* [ ] JS module hoá, không logic trộn lẫn.
* [ ] Không vượt performance budget.
* [ ] A11y/SEO tối thiểu đạt yêu cầu.
* [ ] Không console error/warning.

---

## ✅ Kết Luận

Tuân thủ tài liệu này sẽ đảm bảo:

* **Cấu trúc rõ ràng – tách bạch – mobile-first**
* **Hiệu năng cao và dễ bảo trì**
* **AI sinh code thống nhất, không phá cấu trúc base**
* **Mọi trang đều đáp ứng trải nghiệm hiện đại, sạch, và chuẩn SEO.**

---

Bạn có muốn tôi giúp tạo **bản `.md` kèm format tiêu đề, bullet, heading chuẩn GitHub (với TOC tự sinh và anchor link)** để import trực tiếp vào Notion hoặc repo GitHub cho AI đọc hiểu tốt hơn không?
