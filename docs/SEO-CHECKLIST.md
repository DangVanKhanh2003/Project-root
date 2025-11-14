# SEO Checklist — Full (Project + Per Page)

Use this checklist to audit before release. Items are tailored to this static Vite multi‑page build (index + platform pages) and are safe to keep under version control.

## Core Files (Project)

- `public/robots.txt`: mở crawl CSS/JS/img; khai báo `Sitemap: https://yt1s.cx/sitemap.xml`.
- `public/sitemap.xml`: liệt kê mọi URL quan trọng; nếu đa ngôn ngữ, thêm `xhtml:link` hreflang 2 chiều + `x-default`.
- Biểu tượng & thương hiệu: `public/favicon.ico`, thư mục `public/favicons/*` (16/32/48/96, 180, 512), og-image 1200×630.
- Server config: .htaccess/nginx bật HTTPS + HTTP/2, 301 canonical (www/non‑www, trailing slash), Gzip/Brotli, Cache-Control, MIME chuẩn, CSP cơ bản.
- PWA: `public/manifest.json` (name, icons, maskable, start_url, theme_color).
- Trang lỗi: `public/404.html` (tùy chọn thêm 410 cho URL xóa).
- AI: `public/llms.txt` (hoặc `ai.txt`) nêu rõ bot được phép (GPTBot, Claude-Web, PerplexityBot, Google‑Extended…), liên hệ, phạm vi.

## URL & Canonical Policy

- Chọn 1 chuẩn duy nhất: non‑www; trailing slash.
- Tất cả biến thể bắt buộc 301 về URL chuẩn; canonical tự tham chiếu trên mỗi trang.

## Mỗi Trang: Phần HEAD (Bắt Buộc)

- Meta cốt lõi: `<title>` duy nhất (50–60 ký tự); `<meta name="description">` (150–160 ký tự); `<meta name="robots" content="index, follow">` cho trang indexable; charset/viewport đầy đủ.
- Canonical: `<link rel="canonical" href="https://yt1s.cx/path/">`.
- Hreflang: đầy đủ 2 chiều + x-default nếu đa ngôn ngữ.
- Open Graph/Twitter: `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image(+width/height/alt)`, `og:locale`; `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- Icon: `<link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon">` + PNG 16/32/48/96, `apple-touch-icon`, `theme-color`.
- Hiệu năng: preload/modulepreload cho JS/CSS quan trọng; preconnect DNS nơi cần; `type="module"` và `defer` cho JS không critical.

## Structured Data (JSON‑LD)

- Site-wide: `Organization` (name, url, logo ImageObject, sameAs social); `WebSite` (+SearchAction nếu có search nội bộ thực sự).
- Trang công cụ/dịch vụ: `SoftwareApplication` hoặc `WebApplication` (name, url, description, applicationCategory, operatingSystem, offers.price=0, featureList).
- Điều hướng: `BreadcrumbList` trên mọi landing/hub/cluster.
- Content hỗ trợ rich results: `FAQPage` cho Q&A thật; `HowTo` khi có hướng dẫn; `Article/BlogPosting` cho bài viết; `VideoObject/ImageObject` khi có media chính.
- Lưu ý: JSON hợp lệ (không trailing comma); không lặp loại schema vô lý.

## Mỗi Trang: Phần BODY (Nội Dung & Semantics)

- Cấu trúc: 1 thẻ `<h1>` duy nhất bám sát intent; H2/H3 phân mục rõ ràng.
- TL;DR: đoạn tóm tắt 3–5 ý đầu trang (AI/SGE dễ trích).
- FAQ ngắn (2–4 câu trả lời dứt khoát) + HowTo 3–5 bước khi phù hợp.
- Internal links theo cụm (hub → cluster; cluster ↔ cluster liên quan); breadcrumb HTML (ARIA).
- Cập nhật: hiển thị ngày cập nhật/chỉnh sửa; tác giả/đơn vị chịu trách nhiệm khi cần (E‑E‑A‑T).

## Ảnh & Media

- Ảnh: WebP/AVIF; `srcset/sizes`; `width/height` cố định; `alt` mô tả; `loading="lazy"` cho ảnh ngoài viewport; ảnh LCP dùng `fetchpriority="high"`/`decoding="async"`.
- Video/Audio: transcript/captions nếu quan trọng; poster ảnh tối ưu.

## Hiệu Năng & Core Web Vitals

- Mục tiêu: LCP < 2.5s; CLS < 0.1; INP < 200ms.
- CSS/JS: inline critical CSS; split & minify; purgeCSS; tree‑shaking; tránh JS blocking.
- Cache: Gzip/Brotli; Cache-Control lâu cho assets băm hash; `immutable`; ETag; CDN cache.

## Indexing & Crawl Hygiene

- Không chặn CSS/JS/Image trong robots; tránh chuỗi redirect; đúng status code (200/301/404/410).
- `noindex` cho trang mỏng/utility (kết quả tìm nội bộ, faceted không tối ưu).
- Kiểm soát tham số URL (GSC Parameter nếu cần).

## Đa Ngôn Ngữ

- Cấu trúc `/vi/`, `/en/`…; `<html lang="...">`; nội dung dịch bản địa + từ khóa phù hợp; `og:locale` theo ngôn ngữ; hreflang 2 chiều + x-default.

## AI SEO (AI Overviews/SGE, LLM Crawlers)

- `llms.txt` tại root: quy định allowed bots, scope, crawl‑delay, contact.
- Mẫu nội dung “dễ trích”: TL;DR, list bullet “điểm chính”, Q&A, HowTo, bảng thông số.
- Schema hỗ trợ: FAQPage, HowTo, BreadcrumbList, Organization.sameAs.
- Nội dung chính có sẵn trong HTML đầu (không phụ thuộc JS để hiển thị text trọng tâm).

---

## Project-specific notes

- Set your production domain once, then update all `https://yt1s.cx` occurrences in:
  - Canonical tags in `*.html`
  - `public/sitemap.xml`
  - `public/robots.txt`
  - JSON‑LD (`Organization.url`, `WebSite.url`, Breadcrumb `item`)
- Favicon set: place real files under `public/favicons/` per `public/favicons/README.md`.
- Server redirects: enforce non‑www + trailing slash at the edge (Cloudflare/NGINX/Apache).
- Consider adding CSP (script-src 'self' 'unsafe-inline' 'unsafe-eval' https://15.235.216.178:8088) then harden.

## Quick per‑page audit map

- Home (`index.html`): canonical `/`, OG image `assest/img-social/info-youtube.jpg`, `SoftwareApplication` + `FAQPage`, `Organization`, `WebSite`.
- YouTube (`youtube-downloader.html`): canonical `/youtube-downloader/`, OG image `info-youtube.jpg`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`.
- TikTok (`tiktok-downloader.html`): canonical `/tiktok-downloader/`, OG image `info-tiktok.jpg`, `BreadcrumbList`.
- Instagram (`instagram-downloader.html`): canonical `/instagram-downloader/`, OG image `info-instagram.jpg`, `FAQPage`, `BreadcrumbList`.
- Facebook (`facebook-downloader.html`): canonical `/facebook-downloader/`, OG image `info-facebook.jpg`, `FAQPage`, `BreadcrumbList`.
- X (`x-downloader.html`): canonical `/x-downloader/`, OG image `info-x.jpg`, `BreadcrumbList`.
- YouTube to MP3 (`youtube-to-mp3.html`): canonical `/youtube-to-mp3/`, OG image `info-youtube.jpg`, `BreadcrumbList`.
- YouTube to MP4 (`youtube-to-mp4.html`): canonical `/youtube-to-mp4/`, OG image `info-youtube.jpg`, `BreadcrumbList`.
- Shorts (`youtube-short-downloader.html`): canonical `/youtube-short-downloader/`, OG image `info-youtube.jpg`, `BreadcrumbList`.
- Legal: `privacy-policy.html`, `terms-of-service.html` set `noindex, follow`, canonical to their own slugs, OG basic.
