# PROMPT: Tạo UI Clone cho YouTube Downloader

## Mục đích của prompt này
Prompt này cung cấp tài liệu chi tiết để AI tạo UI clone cho website tải video/audio từ YouTube. UI có thể thay đổi design nhưng **PHẢI** giữ nguyên các ID, class, và cấu trúc element quan trọng để JavaScript có thể hoạt động.

---

## 1. TỔNG QUAN PROJECT

### Project là gì?
- **Loại**: Website tải video/audio từ YouTube
- **Chức năng chính**: Chuyển đổi và tải YouTube video sang MP3/MP4
- **Định dạng hỗ trợ**:
  - Audio: MP3 (128/192/320kbps), FLAC, WAV, M4A, Opus, OGG
  - Video: MP4 (1080p đến 144p), WebM, MKV

### Tech Stack
- HTML5, CSS3, JavaScript/TypeScript (ES6+)
- Vanilla JavaScript (không framework)
- Mobile-first responsive design

---

## 2. CẤU TRÚC TRANG (Page Sections)

Trang web gồm các phần theo thứ tự từ trên xuống:

### 2.1 Header (Cố định trên cùng)
- Logo website
- Navigation links (desktop)
- Language selector dropdown
- Mobile menu button (hamburger)

### 2.2 Mobile Drawer (Menu mobile - ẩn mặc định)
- Logo
- Close button
- Menu items
- Language selector

### 2.3 Hero Section
- Badge/label nhỏ (ví dụ: "Free YouTube Converter")
- Tiêu đề chính (H1) có chứa format động (MP3/MP4)
- Subtitle mô tả ngắn

### 2.4 Download Form (QUAN TRỌNG NHẤT)
- Input field nhập URL YouTube
- Nút Paste/Clear
- Suggestion dropdown (hiển thị khi gõ)
- Format toggle (MP3 / MP4)
- Quality dropdown (thay đổi theo format)
- Nút Convert/Submit
- Khu vực hiển thị lỗi

### 2.5 Result View (Hiện sau khi convert)
- Thumbnail video
- Thông tin video (title, channel, duration)
- Metadata (format, quality, size)
- Nút Download
- Nút Back/Reset
- Progress bar (khi đang xử lý)

### 2.6 SEO Content Section
- Heading (H2)
- Nội dung prose về website
- Có thể chứa hướng dẫn sử dụng

### 2.7 FAQ Section
- Tiêu đề FAQ
- Grid các câu hỏi/trả lời
- Mỗi item có question và answer

### 2.8 Footer
- Logo
- Navigation links
- Legal links
- Copyright

---

## 3. FORM DOWNLOAD - CẤU TRÚC BẮT BUỘC

### 3.1 Cấu trúc HTML Form

```html
<form id="downloadForm" class="form-container">

  <!-- INPUT GROUP -->
  <div class="input-group">
    <div class="input-wrapper" id="input-wrapper">

      <!-- URL INPUT - BẮT BUỘC -->
      <input
        type="text"
        id="videoUrl"
        class="video-input"
        placeholder="Paste YouTube link here..."
        autocomplete="off"
      >

      <!-- ACTION BUTTONS -->
      <div class="input-actions">
        <button
          type="button"
          id="input-action-button"
          class="btn-paste"
          data-action="paste"
        >
          <!-- Paste Icon (hiển thị khi input trống) -->
          <svg class="paste-icon">...</svg>
          <span class="btn-state--paste">Paste</span>

          <!-- Clear Icon (ẩn mặc định, hiện khi có text) -->
          <svg class="clear-icon hidden">...</svg>
          <span class="btn-state--clear hidden">Clear</span>
        </button>
      </div>

    </div>

    <!-- SUGGESTION DROPDOWN -->
    <div id="suggestion-container" class="suggestion-container">
      <!-- JS sẽ render suggestions ở đây -->
    </div>
  </div>

  <!-- FORMAT SELECTOR -->
  <div id="format-selector-container">
    <div class="format-selector-wrapper">
      <div class="format-selector">

        <!-- FORMAT TOGGLE (MP3/MP4) -->
        <div class="format-toggle">
          <button type="button" class="format-btn" data-format="mp3">MP3</button>
          <button type="button" class="format-btn" data-format="mp4">MP4</button>
        </div>

        <!-- QUALITY DROPDOWNS -->
        <div class="quality-wrapper">
          <div class="quality-dropdown-wrapper">

            <!-- AUDIO QUALITY - BẮT BUỘC -->
            <select
              id="quality-select-mp3"
              class="quality-select quality-select--mp3"
              data-quality-select
            >
              <option value="mp3-128" selected>MP3 - 128kbps</option>
              <option value="mp3-192">MP3 - 192kbps</option>
              <option value="mp3-320">MP3 - 320kbps</option>
              <option value="ogg">OGG</option>
              <option value="wav">WAV - Lossless</option>
              <option value="opus">Opus</option>
              <option value="m4a">M4A</option>
            </select>

            <!-- VIDEO QUALITY - BẮT BUỘC -->
            <select
              id="quality-select-mp4"
              class="quality-select quality-select--mp4"
              data-quality-select
            >
              <option value="mp4-1080">MP4 - 1080p</option>
              <option value="mp4-720" selected>MP4 - 720p</option>
              <option value="mp4-480">MP4 - 480p</option>
              <option value="mp4-360">MP4 - 360p</option>
              <option value="mp4-240">MP4 - 240p</option>
              <option value="mp4-144">MP4 - 144p</option>
              <option value="webm">WEBM</option>
              <option value="mkv">MKV</option>
            </select>

            <div class="select-arrow"><!-- Dropdown arrow icon --></div>
          </div>
        </div>

        <!-- CONVERT BUTTON -->
        <button type="submit" class="btn-convert">
          <span>Convert</span>
          <svg><!-- Arrow icon --></svg>
        </button>

      </div>
    </div>
  </div>

  <!-- ERROR MESSAGE -->
  <div id="error-message" class="error-message">
    <!-- JS sẽ render error ở đây -->
  </div>

</form>
```

### 3.2 Các ID BẮT BUỘC (JavaScript phụ thuộc)

| ID | Element | Mô tả |
|---|---|---|
| `downloadForm` | `<form>` | Form chính, xử lý submit |
| `videoUrl` | `<input>` | Input nhập URL YouTube |
| `input-wrapper` | `<div>` | Wrapper của input |
| `input-action-button` | `<button>` | Nút Paste/Clear |
| `suggestion-container` | `<div>` | Container cho suggestion dropdown |
| `format-selector-container` | `<div>` | Container cho format selector |
| `quality-select-mp3` | `<select>` | Dropdown chọn quality audio |
| `quality-select-mp4` | `<select>` | Dropdown chọn quality video |
| `error-message` | `<div>` | Hiển thị lỗi |

### 3.3 Các CLASS BẮT BUỘC (JavaScript phụ thuộc)

| Class | Element | Mô tả |
|---|---|---|
| `format-btn` | `<button>` | Nút toggle MP3/MP4 |
| `format-btn.active` | - | State active của format button |
| `quality-select` | `<select>` | Dropdown quality chung |
| `quality-select--mp3` | `<select>` | Dropdown quality cho audio |
| `quality-select--mp4` | `<select>` | Dropdown quality cho video |
| `btn-paste` | `<button>` | Nút paste/clear |
| `paste-icon` | `<svg>` | Icon paste |
| `clear-icon` | `<svg>` | Icon clear |
| `btn-state--paste` | `<span>` | Text "Paste" |
| `btn-state--clear` | `<span>` | Text "Clear" |
| `hidden` | any | Utility class ẩn element |
| `video-input` | `<input>` | Input URL styling |
| `btn-convert` | `<button>` | Nút convert |

### 3.4 Data Attributes BẮT BUỘC

| Attribute | Element | Giá trị | Mô tả |
|---|---|---|---|
| `data-format` | `<html>` | `"mp3"` hoặc `"mp4"` | Format hiện tại |
| `data-format` | `.format-btn` | `"mp3"` hoặc `"mp4"` | Giá trị của button |
| `data-action` | `#input-action-button` | `"paste"` hoặc `"clear"` | Trạng thái nút |
| `data-quality-select` | `<select>` | (không giá trị) | Marker cho JS |

---

## 4. RESULT VIEW - CẤU TRÚC

```html
<!-- View container -->
<div id="search-view" class="view-container view-input">
  <!-- Input form ở đây (hidden khi có result) -->
</div>

<div id="result-view" class="view-container view-result">
  <div id="content-area" class="result-content">

    <!-- Video Card -->
    <div class="video-card">
      <div class="thumbnail-wrapper">
        <img class="thumbnail" src="..." alt="...">
        <span class="duration">3:45</span>
      </div>

      <div class="video-details">
        <h3 class="video-title">Video Title</h3>
        <p class="video-channel">Channel Name</p>

        <div class="video-meta">
          <span class="meta-tag">
            <span class="meta-label">Format:</span>
            <span class="meta-value accent">MP3</span>
          </span>
          <span class="meta-tag">
            <span class="meta-label">Quality:</span>
            <span class="meta-value">320kbps</span>
          </span>
          <span class="meta-tag">
            <span class="meta-label">Size:</span>
            <span class="meta-value">4.5 MB</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-area">
      <div class="download-buttons">
        <button class="btn-download">Download</button>
        <button class="btn-reset">Back</button>
      </div>

      <!-- Progress Bar (khi đang xử lý) -->
      <div class="status-bar">
        <div class="progress-fill"></div>
        <span class="status-text">Converting...</span>
        <div class="status-spinner">
          <div class="spinner"></div>
        </div>
      </div>
    </div>

  </div>
</div>
```

### 4.1 ID Result View

| ID | Element | Mô tả |
|---|---|---|
| `search-view` | `<div>` | Container view input |
| `result-view` | `<div>` | Container view kết quả |
| `content-area` | `<div>` | Nội dung động (JS render) |

### 4.2 Class Result View

| Class | Mô tả |
|---|---|
| `view-container` | Container chung cho view |
| `view-input` | View nhập liệu |
| `view-result` | View kết quả |
| `view-result.active` | View kết quả đang active |
| `hidden-state` | State ẩn (animation) |
| `video-card` | Card thông tin video |
| `thumbnail-wrapper` | Wrapper ảnh thumbnail |
| `thumbnail` | Ảnh thumbnail |
| `duration` | Badge thời lượng |
| `video-details` | Container chi tiết |
| `video-title` | Tiêu đề video |
| `video-channel` | Tên kênh |
| `video-meta` | Container metadata |
| `meta-tag` | Tag metadata đơn |
| `meta-label` | Label của meta |
| `meta-value` | Giá trị của meta |
| `meta-value.accent` | Giá trị được highlight |
| `action-area` | Khu vực action buttons |
| `download-buttons` | Container các nút |
| `download-buttons.active` | State active |
| `btn-download` | Nút download |
| `btn-reset` | Nút quay lại |
| `status-bar` | Progress bar container |
| `progress-fill` | Fill của progress |
| `status-text` | Text trạng thái |
| `status-spinner` | Container spinner |
| `spinner` | Spinner animation |

---

## 5. HEADER - CẤU TRÚC

```html
<header id="main-header" class="header-container">
  <a href="/" class="logo">
    <span class="logo-text">YTMP3</span>
  </a>

  <!-- Desktop Navigation -->
  <nav class="desktop-nav">
    <div class="nav-links">
      <a href="/" class="nav-link active">Home</a>
      <a href="/about" class="nav-link">About</a>
      <a href="/faq" class="nav-link">FAQ</a>
    </div>

    <div class="nav-divider"></div>

    <!-- Language Selector -->
    <div class="lang-selector">
      <button class="lang-button">EN</button>
      <div class="lang-dropdown">
        <button class="lang-option active" data-lang="en">English</button>
        <button class="lang-option" data-lang="es">Español</button>
        <!-- ... more languages -->
      </div>
    </div>
  </nav>

  <!-- Mobile Menu Button -->
  <button id="mobile-menu-btn" class="mobile-menu-btn">
    <!-- Hamburger icon -->
  </button>
</header>
```

### 5.1 ID Header

| ID | Element | Mô tả |
|---|---|---|
| `main-header` | `<header>` | Header chính |
| `mobile-menu-btn` | `<button>` | Nút mở menu mobile |

---

## 6. MOBILE DRAWER - CẤU TRÚC

```html
<div id="mobile-drawer" class="mobile-drawer">
  <div id="mobile-drawer-content" class="drawer-content">

    <div class="drawer-header">
      <a href="/" class="drawer-logo">YTMP3</a>
      <button id="close-drawer-btn" class="close-drawer-btn">
        <!-- Close icon -->
      </button>
    </div>

    <nav class="drawer-menu">
      <a href="/" class="drawer-sublink">Home</a>
      <a href="/about" class="drawer-sublink">About</a>
      <div class="drawer-divider"></div>
      <a href="/faq" class="drawer-sublink">FAQ</a>
    </nav>

    <!-- Language in Drawer -->
    <div class="drawer-lang-selector">
      <button class="drawer-lang-button">English</button>
      <div class="drawer-lang-dropdown">
        <button class="drawer-lang-option active">English</button>
        <button class="drawer-lang-option">Español</button>
      </div>
    </div>

  </div>
</div>
```

### 6.1 ID Mobile Drawer

| ID | Element | Mô tả |
|---|---|---|
| `mobile-drawer` | `<div>` | Container drawer |
| `mobile-drawer-content` | `<div>` | Content wrapper |
| `close-drawer-btn` | `<button>` | Nút đóng drawer |

### 6.2 Class Mobile Drawer

| Class | Mô tả |
|---|---|
| `mobile-drawer` | Container drawer |
| `mobile-drawer.open` | State mở drawer |
| `drawer-content` | Nội dung drawer |
| `drawer-header` | Header drawer |
| `drawer-logo` | Logo trong drawer |
| `close-drawer-btn` | Nút đóng |
| `drawer-menu` | Menu container |
| `drawer-sublink` | Menu item |
| `drawer-divider` | Divider |

---

## 7. HERO SECTION - CẤU TRÚC

```html
<section class="hero-section">
  <div class="decorative-glow"></div>

  <div class="hero-container">
    <div class="hero-card">

      <div id="hero-header" class="hero-header">
        <span class="badge">Free YouTube Converter</span>
        <h1>
          YouTube to
          <span id="title-format" class="title-accent">MP3</span>
          Converter
        </h1>
        <p class="hero-subtitle">
          Convert and download YouTube videos to MP3 or MP4 for free.
        </p>
      </div>

      <!-- Download Form đặt ở đây -->

    </div>
  </div>
</section>
```

### 7.1 ID Hero

| ID | Element | Mô tả |
|---|---|---|
| `hero-header` | `<div>` | Header của hero (có thể ẩn) |
| `title-format` | `<span>` | Text format động (MP3/MP4) |

### 7.2 Class Hero

| Class | Mô tả |
|---|---|
| `hero-section` | Section chính |
| `decorative-glow` | Hiệu ứng glow trang trí |
| `hero-container` | Container |
| `hero-card` | Card chính |
| `hero-header` | Header |
| `hero-header.hidden-state` | State ẩn header |
| `badge` | Badge nhỏ |
| `title-accent` | Text được highlight |
| `hero-subtitle` | Subtitle |

---

## 8. FAQ SECTION - CẤU TRÚC

```html
<section id="faq" class="faq-section">
  <h2 class="faq-title">
    <span class="faq-icon">?</span>
    Frequently Asked Questions
  </h2>

  <div class="faq-grid">
    <div class="faq-item">
      <h3 class="faq-question">How do I download YouTube videos?</h3>
      <p class="faq-answer">
        Simply paste the YouTube video URL into the input field...
      </p>
    </div>

    <!-- More FAQ items -->
  </div>
</section>
```

---

## 9. FOOTER - CẤU TRÚC

```html
<footer class="footer-container">
  <a href="/" class="footer-logo">YTMP3</a>

  <nav class="footer-nav">
    <a href="/about" class="footer-link">About</a>
    <a href="/contact" class="footer-link">Contact</a>
    <a href="/faq" class="footer-link">FAQ</a>
  </nav>

  <div class="footer-links">
    <a href="/privacy-policy" class="footer-link">Privacy Policy</a>
    <a href="/terms-of-use" class="footer-link">Terms of Use</a>
  </div>

  <p class="footer-copyright">
    &copy; 2024 YTMP3. All rights reserved.
  </p>
</footer>
```

---

## 10. UTILITY CLASSES

| Class | Mô tả |
|---|---|
| `container` | Container chung với padding |
| `max-w-5xl` | Max width 1024px |
| `max-w-4xl` | Max width 896px |
| `hidden` | display: none |
| `hidden-view` | display: none !important |
| `fade-in` | Animation fade in |
| `hidden-state` | Animation ẩn |
| `active` | State active |
| `scrolled` | Header đã scroll |
| `open` | Drawer mở |
| `show` | Hiển thị (error, etc) |
| `loading` | State loading |

---

## 11. RESPONSIVE BREAKPOINTS

```
- Mobile first (< 640px)
- Small tablet (640px - 767px)
- Tablet (768px - 1023px)
- Desktop (1024px+)

Quan trọng:
- 360px: Điện thoại nhỏ
- 480px: Điện thoại thường
- 640px: Tablet nhỏ
- 768px: Tablet
- 800px: Format selector chuyển layout
- 1024px: Desktop
```

---

## 12. TRẠNG THÁI UI (States)

### 12.1 Input States
- **Empty**: Hiện nút Paste, ẩn nút Clear
- **Has Value**: Ẩn nút Paste, hiện nút Clear
- **Loading**: Hiện spinner, disable input
- **Error**: Hiện error message

### 12.2 Format States
- **MP3 Selected**:
  - `.format-btn[data-format="mp3"]` có class `active`
  - `#quality-select-mp3` visible
  - `#quality-select-mp4` hidden
  - `<html data-format="mp3">`

- **MP4 Selected**:
  - `.format-btn[data-format="mp4"]` có class `active`
  - `#quality-select-mp4` visible
  - `#quality-select-mp3` hidden
  - `<html data-format="mp4">`

### 12.3 View States
- **Input View**: `#search-view` visible, `#result-view` hidden
- **Result View**: `#search-view` có class `hidden-state`, `#result-view` có class `active`

---

## 13. TỔNG HỢP ID BẮT BUỘC TOÀN TRANG

```
#main-header
#mobile-menu-btn
#mobile-drawer
#mobile-drawer-content
#close-drawer-btn
#hero-header
#title-format
#search-view
#downloadForm
#input-wrapper
#videoUrl
#input-action-button
#suggestion-container
#format-selector-container
#quality-select-mp3
#quality-select-mp4
#error-message
#result-view
#content-area
#about
#faq
```

---

## 14. YÊU CẦU KHI TẠO UI CLONE

### PHẢI tuân thủ:
1. Giữ nguyên tất cả ID được liệt kê ở mục 13
2. Giữ nguyên các class có tương tác với JavaScript
3. Giữ nguyên data-attributes (data-format, data-action, data-quality-select)
4. Giữ nguyên cấu trúc lồng của form download
5. Giữ nguyên các option values trong select dropdown

### ĐƯỢC thay đổi:
1. Màu sắc, typography, spacing
2. Layout (miễn giữ nguyên cấu trúc element)
3. Border radius, shadows, effects
4. Icons, images
5. Animations, transitions
6. Thêm class mới cho styling
7. Nội dung text (placeholder, labels)

### KHÔNG được:
1. Xóa hoặc đổi tên các ID bắt buộc
2. Thay đổi cấu trúc lồng của form
3. Xóa các class được JavaScript sử dụng
4. Thay đổi option values trong select
5. Xóa data-attributes

---

## 15. VÍ DỤ SỬ DỤNG PROMPT

Khi yêu cầu AI tạo UI clone, bạn có thể nói:

> "Tạo UI clone cho YouTube downloader với design mới (ví dụ: dark theme với màu chủ đạo tím). Tham khảo tài liệu UI-CLONE-PROMPT.md để biết các ID, class, và cấu trúc element bắt buộc. UI mới phải đẹp hơn nhưng giữ nguyên tất cả identifiers để JavaScript hoạt động."

---

*Document version: 1.0*
*Generated for: YTMP3.my YouTube Downloader*
