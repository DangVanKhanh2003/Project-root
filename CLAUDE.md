# CLAUDE.md

File này cung cấp hướng dẫn cho Claude Code (claude.ai/code) khi làm việc với code trong repository này.

**🚨 QUAN TRỌNG: Trước khi thực hiện bất kỳ task nào, PHẢI đọc `docs/task-workflow.md` (1 lần/conversation). Không được code ngay lập tức.**

## Tổng Quan Dự Án

Đây là một ứng dụng web để tải xuống nội dung đa phương tiện (video, hình ảnh, âm thanh) từ các nền tảng mạng xã hội bao gồm YouTube, Facebook, TikTok, Instagram, và X (Twitter). Dự án ưu tiên thiết kế mobile-first, tối ưu hóa hiệu suất, và kiến trúc sạch.

## Tech Stack

Dự án sử dụng công nghệ web chuẩn với kiến trúc hiện đại:

- **HTML5**: Semantic markup và modern web standards
- **CSS3**: Mobile-first responsive design với advanced features (Grid, Flexbox, Custom Properties)
- **JavaScript (ES6+)**: Vanilla JavaScript với ES modules, dynamic imports, và modern syntax

**Không sử dụng frameworks** - dự án được xây dựng hoàn toàn bằng vanilla web technologies để đảm bảo hiệu suất tối ưu và kiểm soát hoàn toàn code base.

## Kiến Trúc & Cấu Trúc File

```
/src/
  /pages/           # Các trang HTML (index.html)
  /script/          # Các module JavaScript
    main.js         # Entry point - dynamic imports downloader UI
    /features/      # Các module logic UI (một module cho mỗi tính năng)
      /downloader/  # Chức năng download cốt lõi
    /libs/          # Các thư viện logic nghiệp vụ (không thao tác DOM)
      /downloader-lib-standalone/  # Thư viện download cốt lõi
  /styles/          # CSS được tổ chức theo mục đích
    reset.css       # Chuẩn hóa browser
    base.css        # Design tokens, typography, layout primitives
    common.css      # Header, footer, navbar, shared utilities
    /critical/      # Critical CSS cho initial render (inlined)
      hero.css      # Critical styles cho hero section
    /features/      # CSS đặc thù cho từng tính năng (lazy-loaded)
      section-shared.css    # Shared section styles (.section-header, utilities)
      hero-interactive.css  # Hero interactions và animations
      platforms.css         # Platforms section styling
      features-section.css  # Features section styling
      how-to.css           # How-to section styling
      faq.css              # FAQ section styling
/public/            # Static assets
```

## Lệnh Development

Dự án này sử dụng vanilla JavaScript với ES6 modules, dynamic imports, và Vite làm build system.

### Chạy Ứng Dụng

**Option 1 - Vite Development Server (Khuyến nghị):**
```bash
npm install
npm run dev
```

**Option 2 - Local HTTP Server (Để tải module):**
```bash
python -m http.server 8000
# Truy cập http://localhost:8000/src/pages/index.html
```

**Option 3 - Direct Browser (Chức năng hạn chế):**
- Mở `src/pages/index.html` trực tiếp trong browser
- Lưu ý: ES6 modules có thể không hoạt động đúng cách nếu không có server

### Lệnh Build
```bash
npm run build        # Production build tới dist/
npm run preview      # Preview production build
```

### Chất Lượng Code
- Tuân theo các hướng dẫn kiến trúc trong `docs/priciple.md` và `guild.md`
- **LUÔN LUÔN kiểm tra `learned.md`** trước khi bắt đầu bất kỳ task nào
- Đảm bảo tất cả các file CSS tuân theo cấu trúc media query bắt buộc

## Kiến Trúc CSS (QUAN TRỌNG)

### NGUYÊN TẮC MOBILE-FIRST LÀ SỐ 1 (QUAN TRỌNG NHẤT)

**🔥 QUY TẮC VÀNG: LUÔN LUÔN XÂY DỰNG MOBILE TRƯỚC TIÊN 🔥**

#### Yêu Cầu Mobile-First Nghiêm Ngặt
- **TẤT CẢ CSS phải là mobile-first**: Chỉ sử dụng `@media (min-width: ...)`
- **KHÔNG BAO GIỜ sử dụng `@media (max-width: ...)`** (bị cấm hoàn toàn)
- **XÂY DỰNG CHO MOBILE TRƯỚC** - thiết kế từ 350px trở lên
- **Progressive Enhancement**: Tăng cường từ mobile lên desktop/2K/4K
- Sử dụng design tokens từ `base.css`, không bao giờ hardcode values
- Mọi file CSS PHẢI có header responsive breakpoints đầy đủ (bao gồm 2K, 4K)

#### Workflow Mobile-First Bắt Buộc
1. **Bắt đầu với Extra Small Mobile (0-350px)**
2. **Thiết kế cho Small Mobile (351-599px)**
3. **Mở rộng lên Tablet (600-839px)**
4. **Tinh chỉnh cho Desktop (840-1239px)**
5. **Tối ưu cho Wide Desktop (1240-1919px)**
6. **Điều chỉnh cho 2K Display (1920-2559px)**
7. **Hoàn thiện cho 4K+ Display (2560px+)**

### Cấu Trúc File CSS Bắt Buộc
Mọi file CSS phải bắt đầu với cấu trúc chính xác này:

```css
/* =========================================================
   Responsive Breakpoints (BẮT BUỘC CHO MỌI FILE)
   ---------------------------------------------------------
   • Extra Small Mobile (0–350px)
   • Small Mobile (351–599px)
   • Medium (Tablet) – 600–839px
   • Expanded (Desktop) – 840–1239px
   • Large (Wide Desktop) – 1240–1919px
   • Extra Large (2K) – 1920–2559px
   • Ultra Large (4K) – 2560px+
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

@media (min-width: 1240px) and (max-width: 1919px) {
  /* Large Wide Desktop rules here */
}

@media (min-width: 1920px) and (max-width: 2559px) {
  /* Extra Large 2K Display rules here */
}

@media (min-width: 2560px) {
  /* Ultra Large 4K+ Display rules here */
}

/* ======= Base Style (Common for all devices) ======= */
```

### Tổ Chức CSS

**Tổ chức cấp file:**
- **`reset.css`**: Chỉ chuẩn hóa browser
- **`base.css`**: Design tokens, typography scale, container layout, Material 3 system
- **`common.css`**: **Header và footer styles** (shared across all pages)
- **`critical/`**: Critical CSS cấp section cho above-the-fold content (navbar, hero)
- **`features/`**: Feature CSS cấp section cho interactions và lazy-loaded content

**Quy tắc nội dung CSS:**
- **Critical CSS**: Layout, colors, typography cho above-the-fold content
- **Feature CSS**: Animations, hover states, interactions (lazy-loaded)
- **BEM naming** với feature prefixes: `.dl-hero__title`, `.faq-item--open`
- **Không nested selectors** sâu hơn 3 levels
- **Không `!important`** (trừ các trường hợp đặc biệt được documented)

### 🚨 CRITICAL CSS SEPARATION - QUY TẮC QUAN TRỌNG NHẤT 🚨

**⚡ ĐƯỜNG DẪN CRITICAL CSS:** `/Users/macos/Documents/work/downloader/project3/src/styles/critical/`

#### Quy Tắc Critical CSS (BẮT BUỘC TUÂN THỦ)

**CSS NÀO PHẢI VÀO `/src/styles/critical/`:**
- ✅ **Tất cả styles cho LẦN VIEW ĐẦU TIÊN** (above-the-fold)
- ✅ **Layout chính** (header, hero section, navigation)
- ✅ **Typography cơ bản** hiển thị ngay khi tải trang
- ✅ **Colors và backgrounds** cho vùng nhìn thấy đầu tiên
- ✅ **Loading states** và skeletons
- ✅ **Critical animations** (fade-in đầu trang)

**CSS NÀO KHÔNG ĐƯỢC VÀO CRITICAL:**
- ❌ **Hover effects** và interactive states
- ❌ **Animations phức tạp** (scroll-triggered)
- ❌ **Below-the-fold content** (footer, sections dưới)
- ❌ **Modal/popup styles**
- ❌ **Print styles**

#### Chiến Lược Tách File CSS
**`/src/styles/critical/`** (Inline trong `<head>`)
- `hero.css` - Hero section layout, colors, typography
- `header.css` - Navigation, logo, critical header styles
- `loading.css` - Loading spinners, skeletons

**`/src/styles/features/`** (Lazy-loaded)
- `hero-interactive.css` - Hero animations, hover effects
- `platforms.css` - Platforms section (below-the-fold)
- `features-section.css` - Features section styling
- `how-to.css` - How-to section styling
- `faq.css` - FAQ section styling
- `section-shared.css` - Shared utilities cho lazy sections

#### Chiến Lược Tải CSS
1. **Critical CSS** → Inline ngay trong `<head>` (≤ 10KB)
2. **Feature CSS** → Dynamic import khi scroll vào viewport
3. **Section CSS** → Lazy-load với IntersectionObserver
4. **Interactive CSS** → Chỉ load khi user interaction

## Performance Budgets (ĐƯỢC THỰC THI)

| Metric | Giới Hạn |
|--------|-----------|
| Critical CSS (inline) | ≤ 10KB |
| Initial JS (main + entry) | ≤ 70KB gzip |
| Unused CSS per page | ≤ 2KB |
| LCP | ≤ 2.5s |
| CLS | < 0.1 |
| TBT | ≤ 200ms |

**PRs sẽ bị từ chối nếu vượt quá các budget này.**

## Hướng Dẫn JavaScript

### 🧩 JAVASCRIPT MODULARIZATION - TÁCH MODULE CHO DỄ MAINTAIN

#### Nguyên Tắc Tách Module (BẮT BUỘC)
- **MỖI TÍNH NĂNG = MỘT MODULE RIÊNG** - không gộp chung
- **SINGLE RESPONSIBILITY** - mỗi module chỉ làm một việc
- **CLEAR BOUNDARIES** - phân chia rõ ràng giữa UI logic và business logic
- **EASY TESTING** - mỗi module có thể test độc lập
- **MAINTAINABLE** - dễ sửa đổi mà không ảnh hưởng module khác

#### Cấu Trúc Module Chi Tiết
**Entry Point:**
- `main.js`: Entry point động imports các page-specific modules
- `environment.js`: Quản lý cấu hình tập trung (API, features, timeouts)
- `utils.js`: Các utility functions được chia sẻ

**Feature Modules (`features/`):**
- **Một module cho MỖI UI feature**, mỗi cái exports `init()` function
- `downloader/` - Core download functionality (MVC pattern)
  - `downloader-ui.js` - Orchestrator/initializer
  - `state.js` - Model (state management)
  - `ui-renderer.js` - View (DOM rendering)
  - `input-form.js` - Controller (event handling)
  - `download-rendering.js` - Search results view

**Business Logic (`libs/`):**
- **Logic nghiệp vụ thuần túy**, không thao tác DOM
- `downloader-lib-standalone/` - Core download library
  - `service.js` - API communication
  - `httpClient.js` - HTTP abstraction
  - `normalizers.js` - Data standardization
  - `captcha.js` - CAPTCHA handling
  - `progressBar.js` - Progress UI component

#### Module Guidelines
- **ES6 modules độc quyền**, không CommonJS hoặc UMD
- **Named exports**, tránh default exports
- **Dynamic imports** cho code splitting
- **Clear dependencies** - không circular imports

### Cấu Hình Environment

**`src/script/environment.js`** tập trung tất cả cấu hình ứng dụng:

```javascript
// Các phương thức cấu hình có sẵn:
getApiBaseUrl()              // API base URL dựa trên environment
getTimeout(operation)        // Timeout values cho các operations khác nhau
isFeatureEnabled(feature)    // Feature flags
getCaptchaConfig()          // CAPTCHA provider settings
isDev(), isProd()           // Environment checks
```

**Cấu hình bao gồm**:
- API endpoints và timeouts
- Feature flags (suggestions, playlist support, etc.)
- CAPTCHA settings (Cloudflare/Google)
- Development mode settings (verbose logging, API mocking)
- App metadata (name, version)

### Kiến Trúc MVC (QUAN TRỌNG)

Tính năng downloader implements **Model-View-Controller** pattern cho code dễ maintain:

```
state.js (Model) ←→ ui-renderer.js (View)
      ↑                     ↑
input-form.js (Controller) →┘
```

**Model (`src/script/features/downloader/state.js`)**:
- Single source of truth cho UI state
- Quản lý: inputType, loading states, errors, suggestions, results
- Cung cấp immutable state access qua `getState()`
- State updates trigger registered view callbacks
- Initial state shape:
```javascript
{
  inputType: 'url' | 'keyword',
  isLoading: boolean,
  error: string | null,
  suggestions: string[],
  showSuggestions: boolean,
  showPasteButton: boolean,
  showClearButton: boolean,
  results: object[],
  resultsLoading: boolean,
  viewingItem: { id, title } | null
}
```

**View (`src/script/features/downloader/ui-renderer.js`)**:
- Duy trì DOM element references
- Pure rendering functions không có business logic
- Responds tới state changes qua `render()` method
- Separate views: main renderer + `download-rendering.js` cho search results

**Controller (`src/script/features/downloader/input-form.js`)**:
- Xử lý user events (input, click, paste, clear)
- Calls business logic qua service layer
- Updates model state qua `setState()`
- Quản lý debouncing (suggestions) và async operations

**Orchestrator (`src/script/features/downloader/downloader-ui.js`)**:
- Connects M-V-C components trong `init()` function
- Registers state change callbacks
- Sets up additional UI features (scroll, navbar)

### Kiến Trúc Download Flow
1. User inputs URL trong main interface
2. Controller (`input-form.js`) captures input
3. Controller calls `downloader-lib-standalone` service layer
4. Library components:
   - `service.js`: API communication với backend
   - `httpClient.js`: HTTP abstraction layer
   - `normalizers.js`: Data standardization
   - `captcha.js`: CAPTCHA handling
   - `progressBar.js`: Download progress UI
5. Data flows qua normalizers để update state
6. State changes trigger view re-renders

## Các Điểm Tích Hợp Chính

### API Backend Communication
- Module `service.js` xử lý tất cả backend API calls
- Các service methods có sẵn:
  - `extractMedia(url)` - Extract video information từ URL
  - `searchTitle(keyword)` - Search videos theo keyword
  - `extractPlaylist(url)` - Get playlist videos
  - `convert(params)` - Convert media formats
  - `checkTask(taskId)` - Check conversion task status
  - `getSuggestions(query)` - Get search suggestions
- Backend API phân tích URLs và trả về download options
- Data flows qua normalizers trước khi reach UI components

### Error Handling
- Network errors → User-friendly messages trong UI
- Invalid URLs → Input validation + error state
- API errors → Caught và displayed với fallback options
- CAPTCHA workflow → Modal + retry logic
- Tất cả errors tự động clear khi user input mới

### Layered Architecture

**Strict Separation of Concerns**:
```
UI Layer (src/features/) - Có thể manipulate DOM
  ↓ calls
Business Logic Layer (src/libs/) - Pure functions, không DOM
  ↓ calls
API Layer (src/libs/.../remote/) - HTTP communication
  ↓ calls
Backend API
```

**Quy tắc**:
- `features/` modules CÓ THỂ touch DOM
- `libs/` modules KHÔNG THỂ import bất cứ thứ gì DOM-related
- Communication flows unidirectionally downward
- Data normalization xảy ra ở API layer trước khi reach UI

## Yêu Cầu Code Style

### CSS
- Tuân theo mobile-first responsive breakpoints chính xác như specified
- Sử dụng design tokens từ `base.css` cho tất cả values
- Implement section-level CSS splitting (critical vs features)
- Không cascade sâu hơn 3 selectors

### JavaScript
- Mỗi module nên có single responsibility
- Export named functions, tránh default exports
- Sử dụng dynamic imports cho code splitting
- Không jQuery dependencies

#### Code Comment Policy (BẮT BUỘC)
- **KHÔNG comment trong quá trình implementation**: Focus vào logic và functionality
- **CHỈ comment SAU KHI review code xong**: Claude sẽ hỏi user về list functions cần comment
- **Follow `/docs/comment-guidelines.md`**: Sử dụng format 6 tag chuẩn cho function comments
- **KHI SỬA CODE mà thay đổi logic**: BẮT BUỘC phải cập nhật lại comments của đoạn code đó cho đúng với logic mới
- **Code không có comments**: KHÔNG cần thêm comments mới trừ khi được confirm trong comment review phase
- **Đảm bảo comment accuracy**: Comments phải phản ánh chính xác logic hiện tại, không được outdated hoặc misleading

## Quality Checklist

Trước khi submit bất kỳ PR nào, đảm bảo:

### 🔥 MANDATORY CHECKS (BẮT BUỘC)
- [ ] **BẮT BUỘC: Đọc `docs/task-workflow.md` (1 lần/conversation) trước task đầu tiên**
- [ ] **BẮT BUỘC: Follow workflow 7 bước từ analysis đến code review**
- [ ] **BẮT BUỘC: Đọc `docs/learned.md`, `docs/cls-guidelines.md`, và `docs/comment-guidelines.md` trước khi bắt đầu work**
- [ ] **KHÔNG CODE NGAY**: Phải phân tích, research, và get user confirm trước**
- [ ] **MOBILE-FIRST**: Thiết kế từ 350px trước, rồi progressive enhancement
- [ ] **CRITICAL CSS**: Tất cả above-the-fold CSS phải trong `/src/styles/critical/`
- [ ] **MODULE SEPARATION**: Mỗi tính năng = một module riêng

### 📱 RESPONSIVE & CSS
- [ ] CSS file có ĐẦY ĐỦ responsive breakpoints header (bao gồm 2K, 4K)
- [ ] Mobile-first approach được sử dụng (chỉ `min-width`)
- [ ] Không có `max-width` media queries
- [ ] Design tokens được sử dụng, không hardcoded values
- [ ] Critical/feature CSS separation đúng quy tắc
- [ ] Styles cho lần view đầu tiên phải trong `/critical/`
- [ ] Interactive styles phải trong `/features/`

### ⚡ PERFORMANCE & STRUCTURE
- [ ] Performance budgets không bị vượt quá
- [ ] Critical CSS ≤ 10KB (inline trong head)
- [ ] JS modules properly export `init()` function
- [ ] Không có circular dependencies
- [ ] Dynamic imports được sử dụng cho code splitting

### 🔧 TECHNICAL
- [ ] Không có console errors/warnings
- [ ] Accessibility basics được cover (focus, contrast, labels)
- [ ] CLS guidelines được tuân theo (images có width/height, không layout-shifting animations)
- [ ] Animation effects có proper triggers (scroll reveal, etc.)

### 📐 2K/4K SUPPORT
- [ ] Layout hoạt động tốt trên 2K displays (1920-2559px)
- [ ] Layout hoạt động tốt trên 4K displays (2560px+)
- [ ] Typography scaling phù hợp cho màn hình lớn

## Learning và Mistake Prevention (QUAN TRỌNG)

**⚡ LƯU Ý: Đọc workflow file CHỈ 1 LẦN trong mỗi conversation. Nếu đã đọc trong conversation hiện tại rồi thì KHÔNG cần đọc lại.**

### 🚨 MANDATORY WORKFLOW - KHÔNG BAO GIỜ CODE NGAY LẬP TỨC 🚨

**TRƯỚC KHI thực hiện BẤT KỲ task nào, bạn PHẢI:**

1. **ĐỌC WORKFLOW FILE (1 LẦN/CONVERSATION):**
   - **BẮT BUỘC đọc `/Users/macos/Documents/work/downloader/project3/docs/task-workflow.md`**
   - **CHỈ CẦN ĐỌC 1 LẦN** trong conversation hiện tại
   - **NẾU ĐÃ ĐỌC RỒI** trong conversation này thì KHÔNG cần đọc lại
   - **MỖI CONVERSATION MỚI** thì phải đọc lại

2. **TUÂN THỦ QUY TRÌNH 7 BƯỚC:**
   - **KHÔNG BAO GIỜ CODE NGAY** - luôn phân tích và research trước
   - **CHỜ USER CONFIRM** ở mỗi phase quan trọng
   - Đảm bảo chất lượng cao và tránh waste time

### Mandatory File Reading Trước KHI Thực Hiện BẤT KỲ Hành Động Nào
**SAU KHI đã follow workflow, bạn PHẢI đọc bốn file quan trọng này:**

2. **`/Users/macos/Documents/work/downloader/project3/docs/learned.md`**
   - Chứa lessons learned từ debugging CSS lazy-loading và animation effects
   - Quan trọng để hiểu scroll reveal animations và CSS loading patterns
   - Phải được review để tránh lặp lại các problems đã solved

3. **`/Users/macos/Documents/work/downloader/project3/docs/cls-guidelines.md`**
   - Chứa comprehensive rules để prevent Cumulative Layout Shift (CLS)
   - Target: CLS p75 < 0.1 trên tất cả pages
   - Quan trọng để maintain performance budgets và user experience
   - Chứa 13 sections detailed anti-CLS practices và PR review checklist

4. **`/Users/macos/Documents/work/downloader/project3/docs/comment-guidelines.md`**
   - Function comment standards với format 6 tag chuẩn (WHY, CONTRACT, PRE, POST, EDGE, USAGE)
   - Quy tắc KHÔNG comment trong quá trình implementation, chỉ comment sau review
   - AI-ready commenting practices cho maintainability

**Những file này là MANDATORY reading - không có ngoại lệ. Failure to follow workflow và read these files sẽ dẫn đến preventable mistakes.**

### Additional Learned.md Checking
- **CŨNG check `learned.md` ở project root** cho bất kỳ additional lessons nào
- Review tất cả relevant lessons learned từ previous work trong codebase này
- Apply learned patterns và tránh documented pitfalls

### Mistake Documentation Protocol
- **Khi bất kỳ mistake nào xảy ra**, nó PHẢI được documented trong appropriate `learned.md`
- **LUÔN LUÔN xin phép user** trước khi write tới `learned.md`
- Document mistake, nguyên nhân, và solution cho future reference
- Include context về tại sao mistake xảy ra để prevent recurrence

## 🎯 Bài Học Quan Trọng: Tránh Inline Styles - Mobile-First CSS Architecture

### Vấn Đề Phổ Biến: Inline Styles Trong JavaScript

**❌ KHÔNG BAO GIỜ LÀM:**
```javascript
// ❌ SAI - Inline styles trong JavaScript
function renderMessage(status, message) {
    return `
        <div class="message">
            <p style="color: #666; font-size: 14px;">${message}</p>
            <pre style="font-size: 12px; max-height: 200px; overflow: auto;">...</pre>
        </div>
    `;
}
```

**✅ ĐÚNG - CSS Classes với Mobile-First:**
```javascript
// ✅ ĐÚNG - Chỉ sử dụng CSS classes
function renderMessage(status, message) {
    return `
        <div class="content-message message--${status}">
            <p class="message-text">${message}</p>
            <pre class="debug-data">...</pre>
        </div>
    `;
}
```

### Nguyên Tắc Mobile-First CSS Architecture

**🔥 QUY TẮC VÀNG: True Mobile-First CSS Structure**

**❌ SAI - Media Queries Ở Cuối File:**
```css
/* ❌ WRONG - All base styles first, media queries at end */
.message-text { font-size: 0.8125rem; }
.debug-data { font-size: 0.6875rem; }
.result-title { font-size: 0.8125rem; }

/* All media queries clustered at end - BAD! */
@media (min-width: 351px) {
  .message-text { font-size: 0.875rem; }
  .debug-data { font-size: 0.75rem; }
  .result-title { font-size: 0.875rem; }
}
```

**✅ ĐÚNG - Component-Based Mobile-First:**
```css
/* ✅ CORRECT - Each component với immediate responsive variants */

/* ======= MESSAGE TEXT ======= */
.message-text {
  font-size: 0.8125rem; /* Mobile base */
  padding: 12px;
}

@media (min-width: 351px) {
  .message-text {
    font-size: 0.875rem;
    padding: 14px;
  }
}

@media (min-width: 840px) {
  .message-text {
    font-size: 0.9375rem;
    padding: 20px;
  }
}

/* ======= DEBUG DATA ======= */
.debug-data {
  font-size: 0.6875rem; /* Mobile base */
  max-height: 100px;
}

@media (min-width: 840px) {
  .debug-data {
    font-size: 0.8125rem;
    max-height: 150px;
  }
}
```

### Tại Sao Inline Styles Là Sai?

**❌ Problems với Inline Styles:**
- **Không Responsive**: Không thể dùng media queries
- **Hard to Maintain**: Phải edit JavaScript để change styles
- **Performance Hit**: Không được cached như CSS files
- **Violates Separation**: Mixing presentation với logic
- **No Design System**: Không reusable, inconsistent spacing/colors

**✅ Benefits của CSS Classes:**
- **Mobile-First Ready**: Complete responsive control
- **Maintainable**: Edit styles qua CSS, không touch JavaScript
- **Performance**: CSS caching, lazy loading support
- **Design System**: Consistent tokens, reusable patterns
- **Clean Architecture**: Clear separation of concerns

### Implementation Best Practices

**📁 File Organization:**
```
/src/styles/features/
  ├── content-messages.css  # Message system styles
  ├── hero-interactive.css  # Hero interactions
  └── platforms.css        # Platform cards
```

**🎨 CSS Class Naming:**
```css
/* Component-based naming */
.content-message          # Base component
.message--error          # Status modifier
.message--warning        # Status modifier
.message-text            # Element
.debug-data              # Utility component
.placeholder-subtitle    # Descriptive utility
```

**📱 Breakpoint Progression:**
```css
/* Always start mobile-first */
Base: 0-350px     → Smallest phones
351px+            → Small phones
600px+            → Tablets
840px+            → Desktop
1240px+           → Large desktop
1920px+           → 2K displays
2560px+           → 4K displays
```

### 🚨 Critical Workflow

**Khi Code UI Components:**

1. **❌ KHÔNG**: Write inline styles
2. **✅ CÓ**: Create CSS classes với mobile-first approach
3. **❌ KHÔNG**: Hardcode sizes/colors trong JavaScript
4. **✅ CÓ**: Use design tokens và responsive breakpoints
5. **❌ KHÔNG**: Mix presentation logic với business logic
6. **✅ CÓ**: Clean separation - CSS handles all styling

**Example Complete Implementation:**
```javascript
// ✅ CLEAN: JavaScript chỉ structure và logic
function renderVideoInfo(data) {
    return `
        <div class="content-data video-info">
            <div class="info-placeholder">
                <p>📹 Video Information</p>
                <p class="placeholder-subtitle">Video formats display - to be implemented</p>
                <pre class="debug-data">${JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    `;
}
```

```css
/* ✅ RESPONSIVE: CSS handles all visual presentation */
.placeholder-subtitle {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  line-height: 1.4;
}

@media (min-width: 840px) {
  .placeholder-subtitle {
    font-size: 0.8125rem;
  }
}

@media (min-width: 2560px) {
  .placeholder-subtitle {
    font-size: 0.9375rem;
  }
}
```

**Result**: Maintainable, responsive, performant code với clean architecture.

## Các Cân Nhắc Đặc Biệt

- Đây là content downloader application - đảm bảo tất cả functionality respects platform terms of service
- CAPTCHA integration có thể required cho certain platforms
- Performance is critical do mobile-first focus
- Kiến trúc supports future migration tới Vite build system
- **THEME POLICY**: Project chỉ có 1 theme duy nhất - KHÔNG implement theme switching, dark mode, hoặc multiple themes


## Note
- Đừng commit và push code nếu tôi chưa confirm
# Project Configuration Note
- The root entry point for the application is . Do not use the root .
