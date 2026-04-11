# 🌍 Language Code vs Locale Code - Giải thích chi tiết

## TL;DR - Tóm tắt ngắn gọn

| Code Type | Format | Ví dụ | Dùng cho |
|-----------|--------|-------|----------|
| **Language Code** | 2 ký tự | `en`, `vi`, `ar` | HTML, URLs, JSON-LD |
| **Locale Code** | Full format | `en_US`, `vi_VN`, `ar_SA` | **CHỈ** Open Graph tags |

---

## 📖 Giải thích chi tiết

### 1️⃣ **Language Code** (2 ký tự)

**Format:** ISO 639-1 standard
- `en` - English
- `vi` - Tiếng Việt
- `ar` - Arabic
- `de` - German
- `ja` - Japanese
- ...

**Được sử dụng trong:**

#### ✅ HTML `lang` attribute
```html
<html lang="en">
<html lang="vi">
<html lang="ar">
```

#### ✅ URLs / Routing
```
/                    (English - default)
/vi/                 (Vietnamese)
/ar/                 (Arabic)
/vi/youtube-to-mp3   (Vietnamese page)
```

#### ✅ JSON-LD Schema.org
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "inLanguage": "en"      // ← 2 ký tự
}
```

#### ✅ `hreflang` tags
```html
<link rel="alternate" hreflang="en" href="..." />
<link rel="alternate" hreflang="vi" href="..." />
<link rel="alternate" hreflang="ar" href="..." />
```

---

### 2️⃣ **Locale Code** (Full format)

**Format:** `language_TERRITORY` (ISO 639-1 + ISO 3166-1)
- `en_US` - English (United States)
- `vi_VN` - Vietnamese (Vietnam)
- `ar_SA` - Arabic (Saudi Arabia)
- `de_DE` - German (Germany)
- `pt_BR` - Portuguese (Brazil)
- ...

**CHỈ được sử dụng trong:**

#### ✅ Open Graph `og:locale` tag
```html
<meta property="og:locale" content="en_US">
<meta property="og:locale" content="vi_VN">
<meta property="og:locale" content="ar_SA">
```

**Lý do:** Facebook/Open Graph **YÊU CẦU** format đầy đủ, không chấp nhận chỉ `en` hay `vi`.

---

## 🔧 Implementation trong base.njk

### Before (SAI):
```nunjucks
{%- set lang = 'vi' -%}

<!-- SAI: Dùng locale code cho JSON-LD -->
"inLanguage": "vi_VN"  ❌

<!-- SAI: Dùng language code cho OG -->
<meta property="og:locale" content="vi">  ❌
```

### After (ĐÚNG):
```nunjucks
{#- Language code: 2 chars -#}
{%- set langCode = lang or 'en' -%}

{#- Locale code: Full format -#}
{%- set localeMap = {
  en: 'en_US',
  vi: 'vi_VN',
  ar: 'ar_SA',
  ...
} -%}
{%- set ogLocale = localeMap[langCode] or 'en_US' -%}

<!-- ĐÚNG: HTML lang với 2 ký tự -->
<html lang="{{ langCode }}">  ✅

<!-- ĐÚNG: JSON-LD với 2 ký tự -->
"inLanguage": "{{ langCode }}"  ✅

<!-- ĐÚNG: Open Graph với full locale -->
<meta property="og:locale" content="{{ ogLocale }}">  ✅
```

---

## 📋 Mapping Table

Đây là bảng mapping trong `base.njk`:

```javascript
{%- set localeMap = {
  en: 'en_US',    // English (US)
  ar: 'ar_SA',    // Arabic (Saudi Arabia)
  bn: 'bn_BD',    // Bengali (Bangladesh)
  de: 'de_DE',    // German (Germany)
  es: 'es_ES',    // Spanish (Spain)
  fr: 'fr_FR',    // French (France)
  hi: 'hi_IN',    // Hindi (India)
  id: 'id_ID',    // Indonesian (Indonesia)
  it: 'it_IT',    // Italian (Italy)
  ja: 'ja_JP',    // Japanese (Japan)
  ko: 'ko_KR',    // Korean (Korea)
  ms: 'ms_MY',    // Malay (Malaysia)
  my: 'my_MM',    // Burmese (Myanmar)
  pt: 'pt_BR',    // Portuguese (Brazil)
  ru: 'ru_RU',    // Russian (Russia)
  th: 'th_TH',    // Thai (Thailand)
  tr: 'tr_TR',    // Turkish (Turkey)
  ur: 'ur_PK',    // Urdu (Pakistan)
  vi: 'vi_VN'     // Vietnamese (Vietnam)
} -%}
```

---

## ✅ Checklist - Đâu dùng gì?

### Language Code (`en`, `vi`, `ar`) - 2 ký tự

- [ ] `<html lang="{{ langCode }}">`
- [ ] URLs: `/vi/`, `/ar/`
- [ ] JSON-LD: `"inLanguage": "{{ langCode }}"`
- [ ] `<link rel="alternate" hreflang="{{ langCode }}">`
- [ ] `<meta itemprop="inLanguage" content="{{ langCode }}">`

### Locale Code (`en_US`, `vi_VN`, `ar_SA`) - Full format

- [ ] `<meta property="og:locale" content="{{ ogLocale }}">`
- [ ] **KHÔNG** dùng cho bất kỳ thứ gì khác!

---

## 🐛 Common Mistakes

### ❌ Sai:
```html
<!-- Dùng locale code cho HTML lang -->
<html lang="en_US">  ❌

<!-- Dùng locale code cho JSON-LD -->
"inLanguage": "vi_VN"  ❌

<!-- Dùng language code cho OG -->
<meta property="og:locale" content="vi">  ❌
```

### ✅ Đúng:
```html
<!-- Language code cho HTML lang -->
<html lang="en">  ✅

<!-- Language code cho JSON-LD -->
"inLanguage": "vi"  ✅

<!-- Locale code cho OG -->
<meta property="og:locale" content="vi_VN">  ✅
```

---

## 📚 Tham khảo

- **ISO 639-1** (Language codes): https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- **ISO 3166-1** (Country codes): https://en.wikipedia.org/wiki/ISO_3166-1
- **Open Graph Protocol**: https://ogp.me/#optional
- **Schema.org inLanguage**: https://schema.org/inLanguage

---

## 🎯 Tóm lại

1. **Language code (2 chars):** Dùng cho 99% trường hợp
2. **Locale code (full):** CHỈ dùng cho Open Graph `og:locale`
3. **base.njk đã fix đúng** với 2 biến:
   - `langCode` = `en`, `vi`, `ar` (2 chars)
   - `ogLocale` = `en_US`, `vi_VN`, `ar_SA` (full)

Không cần phải lo lắng gì nữa - hệ thống đã tự động xử lý đúng! ✅
