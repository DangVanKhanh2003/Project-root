# JSON-LD Checklist cho SSVID

## 1. Cấu trúc cơ bản

- [x] Sử dụng `@graph` array để chứa nhiều entities
- [x] Mỗi entity phải có `@type` và `@id`
- [x] `@id` format: `{canonicalUrl}#{fragment}` (vd: `https://ytmp4.gg/#organization`)

## 2. Entity Relationship Graph

```
Organization (#organization)
       ↑ publisher (trách nhiệm nội dung)
WebSite (#website)
       ↑ isPartOf (thuộc về)
WebPage (#webpage)
       ── about ──► SoftwareApplication (#application)
```

**Giải thích:**
- `publisher`: Quan hệ trách nhiệm nội dung (KHÔNG phải cha-con)
- `isPartOf`: Quan hệ thuộc về
- `about`: Trang này nói về tool nào

## 3. Trang chủ Root (EN)

- [x] **Organization**: Định nghĩa 1 lần duy nhất
  - `name`, `url`, `logo`, `contactPoint`
- [x] **WebSite**: Định nghĩa 1 lần duy nhất
  - `publisher` → `#organization`
- [x] **WebPage**: Có `isPartOf` → `#website`, `about` → `#application`
- [x] **SoftwareApplication**: `name` = H1 (hero.title)

## 4. Trang chủ ngôn ngữ khác

- [x] **WebPage**: `isPartOf` → `#website`, `about` → `#application`
- [x] **SoftwareApplication**: `name` = H1 (hero.title theo ngôn ngữ)
- [x] KHÔNG định nghĩa lại Organization/WebSite

## 5. Trang con (Tool Pages)

- [x] **WebPage**:
  - `isPartOf` → `{site.url}/#website`
  - `about` → `#application` (có cả `@type` và `@id`)
- [x] **SoftwareApplication**:
  - `name` = H1 (hero.title - KHÔNG dùng SEO title)
  - `publisher` → `{site.url}/#organization`

## 6. Reference Rules

| Property | Cách dùng | Ý nghĩa |
|----------|-----------|---------|
| `isPartOf` | Chỉ cần `@id` | Thuộc về entity nào |
| `about` | Cần cả `@type` + `@id` | Trang nói về entity nào |
| `publisher` | Chỉ cần `@id` | Ai chịu trách nhiệm nội dung |

## 7. Optional Entities

- [x] **FAQPage**: `isPartOf` → `#webpage`
- [x] **HowTo**: `isPartOf` → `#webpage`

## 8. Validation

- [ ] Test với [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test với [Schema.org Validator](https://validator.schema.org/)
- [ ] Kiểm tra JSON syntax hợp lệ
- [ ] Đảm bảo không có trailing commas

## Quick Reference

```json
// WebPage
{
  "@type": "WebPage",
  "@id": "{url}#webpage",
  "name": "{hero.title}",  // ← H1 title, giống SoftwareApplication
  "isPartOf": { "@id": "{site}/#website" },
  "about": { "@type": "SoftwareApplication", "@id": "{url}#application" },
  "inLanguage": "{lang}"
}

// SoftwareApplication
{
  "@type": "SoftwareApplication",
  "@id": "{url}#application",
  "name": "{hero.title}",  // ← H1, KHÔNG phải SEO title
  "publisher": { "@id": "{site}/#organization" },
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
```

## Name Property Rules

| Entity | `name` source | Lý do |
|--------|---------------|-------|
| Organization | "SSVID" (fixed) | Brand name |
| WebSite | "SSVID" (fixed) | Site name |
| WebPage | `hero.title` (H1) | Tên trang/tool cụ thể |
| SoftwareApplication | `hero.title` (H1) | Tên tool cụ thể |

## SSVID Data Structure

**Lưu ý**: SSVID sử dụng cấu trúc data khác với y2matepro:

```javascript
// SSVID HowTo path:
pageData.overview.howTo.title
pageData.overview.howTo.steps[].title
pageData.overview.howTo.steps[].description

// Y2MatePro HowTo path:
pageData.instructions.title
pageData.instructions.steps[] // array of strings
```
