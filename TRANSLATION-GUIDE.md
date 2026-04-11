# Translation Guide - Internal Links Handling

## ✅ Kết luận: Hệ thống ĐÃ XỬ LÝ internal links tự động

**Bạn KHÔNG CẦN thay đổi internal links khi dịch!**

## Cách hoạt động

Hệ thống sử dụng Nunjucks filter `localizeLinks` (định nghĩa trong `.eleventy.cjs`) để tự động xử lý internal links:

```javascript
// Filter trong .eleventy.cjs (line 136-157)
eleventyConfig.addFilter('localizeLinks', function(str, lang) {
  if (!str || !lang || lang === 'en') return str;

  // Tự động thêm /${lang}/ vào internal links
  return str.replace(/href="\/([^"]*?)"/g, function(match, path) {
    // Bỏ qua external links
    if (path.startsWith('http') || path.startsWith('mailto') || path.startsWith('#')) {
      return match;
    }

    // Bỏ qua links đã có language prefix
    const pathStart = path.split('/')[0];
    if (langCodes.includes(pathStart)) {
      return match;
    }

    // Thêm language prefix
    return `href="/${lang}/${path}"`;
  });
});
```

## Template usage

```njk
{# In template files (index.njk, youtube-to-flac.njk, etc.) #}
<p>{{ page.content.intro1 | localizeLinks(lang) | safe }}</p>
<p>{{ faq.answer | localizeLinks(lang) | safe }}</p>
```

## Ví dụ cụ thể

### ✅ ĐÚNG - Trong JSON files (giữ nguyên như tiếng Anh):

**English (`en.json`):**
```json
{
  "answer": "For lossless, choose <a href=\"/youtube-to-flac-converter\">FLAC</a>."
}
```

**German (`de.json`):**
```json
{
  "answer": "Für verlustfrei wählen Sie <a href=\"/youtube-to-flac-converter\">FLAC</a>."
}
```

**Arabic (`ar.json`):**
```json
{
  "answer": "للجودة بدون فقدان، اختر <a href=\"/youtube-to-flac-converter\">FLAC</a>."
}
```

### 🔄 Kết quả sau khi render:

- **English page (`/`):**
  ```html
  For lossless, choose <a href="/youtube-to-flac-converter">FLAC</a>.
  ```

- **German page (`/de/`):**
  ```html
  Für verlustfrei wählen Sie <a href="/de/youtube-to-flac-converter">FLAC</a>.
  ```

- **Arabic page (`/ar/`):**
  ```html
  للجودة بدون فقدان، اختر <a href="/ar/youtube-to-flac-converter">FLAC</a>.
  ```

### ❌ SAI - KHÔNG làm thế này:

```json
{
  "answer": "Für verlustfrei wählen Sie <a href=\"/de/youtube-to-flac-converter\">FLAC</a>."
}
```

❌ Lý do: Template system sẽ thêm prefix hai lần → `/de/de/youtube-to-flac-converter` (SAI!)

## Quy tắc khi dịch

### ✅ LUÔN LUÔN giữ nguyên:

1. **Internal links** (bắt đầu bằng `/`):
   - `/youtube-to-flac-converter`
   - `/youtube-to-m4a-converter`
   - `/youtube-to-mp3-320kbps-converter`
   - `/youtube-to-wav-converter`
   - `/`

2. **HTML tags**:
   - `<a href="...">`, `</a>`
   - `<strong>`, `</strong>`
   - Bất kỳ HTML tag nào khác

3. **Technical terms**:
   - YTMP3, MP3, FLAC, WAV, M4A, AAC
   - 320kbps, 128kbps, 256kbps
   - iOS, Android, Windows, macOS
   - YouTube, iTunes, Apple Music

### 📝 CHỈ dịch:

1. **Nội dung văn bản** bên trong tags
2. **Ý nghĩa câu** phù hợp với ngôn ngữ đích
3. **Giữ nguyên tone** chuyên nghiệp, thân thiện

## URL Structure trong Production

```
Root (English):
├── /                              → Homepage
├── /youtube-to-flac-converter     → FLAC page
├── /youtube-to-m4a-converter      → M4A page
└── /youtube-to-mp3-320kbps-converter

German (/de/):
├── /de/                           → Homepage
├── /de/youtube-to-flac-converter
├── /de/youtube-to-m4a-converter
└── /de/youtube-to-mp3-320kbps-converter

Arabic (/ar/):
├── /ar/                           → Homepage
├── /ar/youtube-to-flac-converter
├── /ar/youtube-to-m4a-converter
└── /ar/youtube-to-mp3-320kbps-converter
```

## Code Reference

**Filter location:** `apps/ytmp3.my/.eleventy.cjs` (line 136-157)

**Template usage:**
- `apps/ytmp3.my/_templates/pages/index.njk` (line 124, 127, 130, 157)
- `apps/ytmp3.my/_templates/pages/youtube-to-flac.njk`
- `apps/ytmp3.my/_templates/pages/youtube-to-m4a.njk`
- `apps/ytmp3.my/_templates/pages/youtube-to-mp3-320kbps.njk`
- `apps/ytmp3.my/_templates/pages/youtube-to-wav.njk`

## Tóm tắt

✅ **GIỮ NGUYÊN** internal links trong JSON như tiếng Anh
✅ **HỆ THỐNG TỰ ĐỘNG** thêm language prefix khi render
✅ **KHÔNG CẦN** thay đổi bất cứ điều gì về URLs
✅ **CHỈ DỊCH** nội dung văn bản

---

**Cập nhật:** 2026-01-16
**Người viết:** Claude Code Analysis
