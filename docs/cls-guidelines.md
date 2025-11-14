# Quy tắc Coding Tránh Cumulative Layout Shift (CLS)

Tài liệu tổng hợp các quy tắc thực tiễn để ngăn layout nhảy (CLS) trong quá trình phát triển. Mục tiêu: CLS p75 < 0.1 trên mọi trang/route.

---

## 1) Nguyên tắc cốt lõi

- Đặt chỗ kích thước trước khi nội dung tải (ảnh, video, iframe, ads, widget, banner).
- Không chèn nội dung lên trên phần đã render (trừ khi có tương tác người dùng).
- Chỉ animate thuộc tính không ảnh hưởng layout: `transform`, `opacity`.
- Tối ưu webfont để tránh nhảy chữ khi font tải xong.
- Giữ SSR và CSR/hydration đồng nhất; không render thêm trên client.

---

## 2) Ảnh, video, iframe, media

- Ảnh: luôn set `width` và `height` trong HTML để browser suy ra tỉ lệ; hoặc dùng CSS `aspect-ratio`.

  ```html
  <img src="/img/hero.jpg" width="1200" height="630" alt="Hero" decoding="async" fetchpriority="high" />
  ```

  ```css
  .thumb {
    aspect-ratio: 4 / 3;
    width: 100%;
    height: auto; /* browser suy ra từ aspect-ratio */
    display: block;
  }
  ```

- Placeholder đồng tỉ lệ (blur/skeleton) để tránh popping khi ảnh tới.
- `loading="lazy"` chỉ dùng khi phần tử đã có kích thước cố định/ratio.
- Video/iframe: set `width/height` hoặc bọc container có `aspect-ratio`.

  ```html
  <div class="video"><iframe src="https://…" loading="lazy" title="…"></iframe></div>
  ```
  ```css
  .video { aspect-ratio: 16 / 9; }
  .video > iframe { width: 100%; height: 100%; border: 0; display: block; }
  ```

---

## 3) Quảng cáo, embed, widget bên thứ ba

- Định nghĩa slot có kích thước tối thiểu hoặc khung tỉ lệ; không để slot co về 0 rồi mở rộng.

  ```css
  .ad-slot { min-height: 250px; }
  ```

- Với kích thước động (responsive): dùng size mapping + placeholder tương ứng.
- Khi ad/iframe lỗi: hiển thị fallback cùng kích thước, không auto-collapse.
- Trì hoãn chèn widget ngoài viewport; nếu trong viewport, phải đặt chỗ trước.
- Sandbox script bên thứ ba trong container cố định; cấm tự ý đẩy DOM bên ngoài container.

---

## 4) Webfonts (nguồn CLS phổ biến)

- Dùng fallback có metrics tương tự; ưu tiên `font-display: optional` (hạn chế swap muộn). Nếu dùng `swap`, phải hiệu chỉnh metrics.
- Preload font quan trọng:

  ```html
  <link rel="preload" as="font" href="/fonts/Inter-var.woff2" type="font/woff2" crossorigin>
  ```

- Dùng CSS metrics override để khớp fallback với webfont:

  ```css
  @font-face {
    font-family: "Inter Var";
    src: url("/fonts/Inter-var.woff2") format("woff2");
    font-display: optional;
    ascent-override: 90%;
    descent-override: 22%;
    line-gap-override: 0%;
    size-adjust: 102%;
  }
  ```

- Tránh `@import` font trong CSS (nạp muộn gây FOUT/shift); dùng `<link rel="preload">` + `<link rel="stylesheet">` thẳng trong `<head>`.

---

## 5) Layout chung: header, banner, thanh thông báo

- Không chèn banner/toolbar mới phía trên nội dung đã render. Nếu bắt buộc, overlay bằng `position: fixed` thay vì đẩy layout.
- Header dính (sticky): đảm bảo chiều cao cố định từ đầu; không thay đổi cao/đệm sau khi render.
- Với thông báo cookie/toast: overlay hoặc dành sẵn không gian cố định.

---

## 6) Animation & interaction

- Chỉ animate `transform` và `opacity`; tránh animate `width`, `height`, `top`, `left`, `margin`, `padding`.
- Di chuyển phần tử bằng `translate` thay cho `top/left`.
- Trạng thái hover/active không làm đổi độ cao dòng hay đẩy phần tử xung quanh.

---

## 7) Kỹ thuật CSS chống shift

- Tránh nhảy do scrollbar: dùng

  ```css
  html { scrollbar-gutter: stable both-edges; }
  ```

- Tối ưu render lười: `content-visibility` luôn kèm `contain-intrinsic-size` để đặt chỗ.

  ```css
  .card {
    content-visibility: auto;
    contain-intrinsic-size: 300px 200px; /* ước lượng hợp lý */
  }
  ```

- Dùng `contain` phù hợp để cô lập layout khi cần.
- Inline critical CSS để tránh FOUC; tránh nạp CSS quan trọng quá muộn.

---

## 8) SPA/SSR/Hydration

- SSR và CSR phải render cùng cấu trúc; cấm chèn thêm node trên client ngoài dữ liệu.
- Dành sẵn `min-height`/skeleton cho component dữ liệu động để giữ layout trước khi fetch xong.
- Khi điều hướng route: giữ chiều cao container ổn định; tránh chèn phần tử trên đầu sau khi trang đã hiển thị.
- Virtual list: đặt chiều cao cell có thể dự đoán; overscan vừa đủ để tránh popping ở rìa viewport.

---

## 9) Mẫu JS cần tránh

- “Đo rồi set” kích thước sau khi ảnh/ads tải xong (gây 2 lần layout). Thay vào đó xác định kích thước ngay từ HTML/CSS.
- Inject CSS muộn qua JS cho phần tử trong viewport (gây reflow). Preload/inline CSS quan trọng.
- Chèn node vào đầu container sau render mà không do người dùng tương tác.

---

## 10) Mobile, viewport, thanh địa chỉ

- Dùng `100svh`/`dvh` thay cho `100vh` với layout full‑screen để ổn định khi thanh địa chỉ ẩn/hiện.
- Sử dụng `env(safe-area-inset-*)` đúng cách với thiết bị có tai thỏ để tránh đẩy layout bất ngờ.

---

## 11) Kiểm thử và giám sát

- Dev: bật Layout Shift Regions trong Chrome DevTools Performance để xem vùng bị shift.
- Lab: chạy Lighthouse/PageSpeed Insights; theo dõi CLS riêng cho từng route.
- RUM: thu thập `web-vitals` trên thực tế người dùng, thiết lập cảnh báo nếu CLS p75 ≥ 0.1.

  ```js
  import { onCLS } from 'web-vitals';
  onCLS(({ value, id }) => {
    // Gửi về analytics của bạn, kèm route, userAgent, network
  });
  ```

---

## 12) Checklist áp dụng

- Ảnh/iframe/video có `width/height` hoặc `aspect-ratio` tương ứng.
- Ads/widgets có slot cố định hoặc placeholder; không auto-collapse.
- Font: preload, `font-display: optional` (hoặc `swap` + metrics override), tránh `@import`.
- CSS: `scrollbar-gutter: stable`; inline critical; tránh render CSS quan trọng muộn.
- UI động: skeleton/min-height khớp layout cuối cùng.
- Animation: chỉ `transform`/`opacity`.
- SPA/hydration: SSR = CSR; không chèn trên đầu nội dung đã render.
- `content-visibility` kèm `contain-intrinsic-size` hợp lý.

---

## 13) Checklist review PR

- [ ] Tất cả `<img>` có `width` + `height` thực hoặc lớp có `aspect-ratio` đúng tỉ lệ ảnh.
- [ ] Tất cả `iframe`/media có kích thước cố định hoặc container ratio.
- [ ] Mọi ad/embed có slot/cỡ tối thiểu và fallback không collapse.
- [ ] Không có animation thay đổi layout (kích thước/vị trí) trong viewport ban đầu.
- [ ] Webfont được preload và có chiến lược `font-display`; nếu `swap`, đã có metrics override.
- [ ] Không có CSS quan trọng bị nạp muộn hoặc thông qua `@import` gây FOUC.
- [ ] Các component dữ liệu động có skeleton/min-height giữ chỗ.
- [ ] Điều hướng route không chèn phần tử mới phía trên nội dung đã render.
- [ ] Đã kiểm tra Layout Shift Regions và không còn shift ngoài tương tác người dùng.

---

## Phụ lục: snippet mẫu nhanh

- Ảnh responsive an toàn CLS

  ```html
  <img
    srcset="/img/pic-640.jpg 640w, /img/pic-1280.jpg 1280w"
    sizes="(max-width: 768px) 100vw, 768px"
    src="/img/pic-1280.jpg"
    width="1280"
    height="853"
    alt="Ảnh minh hoạ" />
  ```

- Container video responsive

  ```html
  <div class="video"><iframe src="…" title="…" loading="lazy"></iframe></div>
  ```
  ```css
  .video { aspect-ratio: 16 / 9; max-width: 100%; }
  .video > iframe { width: 100%; height: 100%; border: 0; display: block; }
  ```

- Header cố định không đẩy layout

  ```css
  .app { padding-top: 64px; }
  .app-header { position: fixed; inset: 0 0 auto 0; height: 64px; }
  ```

---

Cập nhật tài liệu này khi có thay đổi kiến trúc, thư viện UI, hoặc khi hệ thống RUM phát hiện nguồn CLS mới.

