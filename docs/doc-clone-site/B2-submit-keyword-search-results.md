# B2: Hướng Dẫn Triển Khai Submit Keyword & Search Results

## 📋 Bối Cảnh & Tiên Quyết

### Những Gì Đã Hoàn Thành

**Phase B1 - Copy/Paste Button:**
- ✅ HTML structure với IDs cho JavaScript hooks (`downloadForm`, `videoUrl`, `input-action-button`)
- ✅ Input wrapper và paste/clear button
- ✅ CSS styling cho button với 7 responsive breakpoints
- ✅ Logic layer sẵn sàng và hoạt động

**Phase Clone HTML/CSS:**
- ✅ Hero section với search form
- ✅ Container system và responsive layout
- ✅ Design token system trong `base.css`

**Trạng Thái Hiện Tại:**
- Form submission logic đã hoàn chỉnh 100%
- Skeleton loading system đã sẵn sàng
- Search result card components đã ready
- CSS files đã có đầy đủ (`skeleton.css`, `search-results.css`)
- Infinite scroll logic đã implement

### Hiểu Về Nền Tảng

**QUAN TRỌNG: Đọc Để Hiểu Context (Đừng Lạc Vào Chi Tiết)**

Trước khi bắt đầu, bạn nên ĐỌC (nhưng không phân tích sâu) file này để hiểu approach tổng thể:
- **`/Users/macos/Documents/work/downloader/Project-root/docs/doc-clone-site/project-clone-guide.md`**

**Tại sao đọc nó?**
- Hiểu mobile-first CSS methodology
- Hiểu design token system
- Hiểu responsive breakpoint structure

**Quan trọng:** Task của bạn là thêm SEARCH FUNCTIONALITY, không phải clone UI có sẵn.

**Những gì cần extract:**
- CSS variable naming conventions
- Container system patterns
- Mobile-first breakpoint structure (7 levels)

**Những gì BỎ QUA:**
- Cloning workflow chi tiết
- Extraction techniques

---

## 🎯 Tổng Quan Task: Submit Keyword & Search Results

### Chúng Ta Đang Xây Gì?

**Flow hoàn chỉnh:**
1. User gõ keyword vào input
2. User nhấn Enter hoặc click button Submit
3. Hiển thị **12 skeleton cards** (loading state)
4. Gọi API search
5. Hiển thị **grid results** với real video cards
6. Enable **infinite scroll** để load more results

### Thông Số Thiết Kế

**Quyết Định Thiết Kế (Đã Confirm):**
- **Grid Layout:** 2 columns mobile → 3 tablet → 4 desktop
- **Max Width:** 100% width (full container, không limit 1100px/1600px)
- **Spacing:** Giữa hero và results - no extra spacing (liền kề)
- **Card Design:** Theo CSS có sẵn, no shadows
- **Infinite Scroll:** Enable ngay (logic có sẵn)
- **CSS Location:** Reuse `skeleton.css` và `search-results.css`

### Tổng Quan Kiến Trúc

**Logic Layer (Đã Hoàn Chỉnh 100%):**

**A. Form Submission (`input-form.ts`):**
- `handleSubmit()` - Xử lý form submit
- Detect input type: URL vs keyword
- Keyword → `showLoading('list')` → `handleSearch()`
- URL → `showLoading('detail')` → `handleExtractMedia()`

**B. Search Logic (`input-form.ts`):**
- `handleSearch(keyword)` - Call API searchV2
- Transform data → VideoData format
- Save pagination cho load more
- Call `renderResults()`

**C. Rendering (`content-renderer.ts`):**
- `showLoading('list')` - 12 skeleton cards
- `renderResults()` - Render grid cards
- `handleLoadMore()` - Infinite scroll
- Event delegation cho card clicks

**D. Components:**
- `createSkeletonCard()` - TypeScript component
- `createSearchResultCard()` - TypeScript component
- CSS styling complete

**Logic mong đợi gì từ HTML:**
```
#downloadForm - Form element (đã có từ B1)
#videoUrl - Input element (đã có từ B1)
#search-results-section - Section container (MỚI)
#search-results-container - Grid container (MỚI)
#content-area - Video detail area (đã có)
```

---

## 🛠️ Các Bước Triển Khai

### Bước 1: Thêm HTML Structure cho Search Results

**File cần sửa:** `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/index.html`

**Vị trí hiện tại (khoảng line 193):**
```
</section> <!-- Đóng y2mate-download-pro -->
<div id="content-area"></div>
<section class="y2mate-content-pro d-flex">
```

**Những gì cần thêm:**

**1. Thêm Search Results Section SAU hero section, TRƯỚC content-area:**

Thêm section mới với structure:
- Section ID: `search-results-section`
- Section class: `search-results-section` (để styling)
- Initial style: `display: none;` (ẩn mặc định)
- Wrapper div với class `container` (reuse existing container system)
- Container ID: `search-results-container` (để JavaScript render vào)

**Thứ tự HTML sau khi thêm:**
```
1. Hero section (y2mate-download-pro) - có form submit
2. Search Results Section (MỚI THÊM) - render search cards
3. Content Area (content-area) - render video details
4. About Section (y2mate-content-pro) - about content
5. Các sections khác...
```

**Lưu Ý Quan Trọng:**
- Section phải có `display: none;` ban đầu
- JavaScript sẽ toggle `display: block` khi có results
- Không thêm bất kỳ content nào bên trong container (JavaScript sẽ render)

---

### Bước 2: Verify CSS Imports

**File cần check:** `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/main.ts`

**Verify các imports này tồn tại:**

Check xem đã import:
1. `skeleton.css` - Skeleton loading system
2. `search-results.css` - Search results grid styling

**Vị trí import (trong phần reusable packages):**
```
Sau các imports sections CSS
Trong phần: // Import reusable packages CSS
```

**Nếu chưa có - thêm imports:**
- Import path: `./styles/reusable-packages/skeleton/skeleton.css`
- Import path: `./styles/reusable-packages/search-results/search-results.css`

**Thứ tự import khuyến nghị:**
```
1. Reset CSS
2. Base CSS (design tokens)
3. Common CSS (header, footer)
4. Sections CSS (hero, content, etc.)
5. Reusable packages CSS (skeleton, search-results, suggestions, modals)
```

---

### Bước 3: Custom CSS để Override Max-Width

**File cần sửa:** `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/styles/reusable-packages/search-results/search-results.css`

**Vấn đề:**
CSS hiện tại limit max-width:
- Desktop: `max-width: 1100px`
- 4K: `max-width: 1600px`

**Yêu cầu:**
- Grid phải `width: 100%` (full container width, không limit)

**Giải pháp:**

Tìm các media queries có `max-width` trên `.search-results-grid`:
- Line ~98: Desktop (840px+)
- Line ~111: Wide Desktop (1240px+)
- Line ~118: 2K (1920px+)
- Line ~124: 4K (2560px+)

**Override max-width:**
- Xóa hoặc comment out `max-width: 1100px` và `max-width: 1600px`
- Hoặc set `max-width: 100%`
- Giữ nguyên `margin: 0 auto` (để center grid trong container)

**Lưu ý:**
- Không xóa grid-template-columns
- Không xóa gap settings
- Chỉ sửa max-width

---

### Bước 4: Remove Card Shadow (Optional Customization)

**File cần sửa:** `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/styles/reusable-packages/search-results/search-results.css`

**Vấn đề:**
CSS có shadow cho cards:
- `.search-result-card` có `box-shadow` property
- Hover có `box-shadow` property

**Yêu cầu:**
- Không dùng shadow

**Giải pháp:**

Tìm `.search-result-card` (khoảng line 145-153):
- Xóa hoặc comment out `box-shadow: var(--pkg-search-results-card-shadow);`

Tìm `.search-result-card:hover` (khoảng line 249-252):
- Xóa hoặc comment out `box-shadow: var(--pkg-search-results-card-shadow-hover);`

**Lưu ý:**
- Giữ nguyên các properties khác (border-radius, transition, transform)
- Chỉ remove shadow

---

### Bước 5: Verify Submit Event Handling

**File để check:** `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/input-form.ts`

**Logic đã có (KHÔNG CẦN SỬA):**

**Event listeners (line 325-329):**
```
form.addEventListener('submit', handleSubmit);
input.addEventListener('input', handleInput);
input.addEventListener('keydown', handleKeyDown);
```

**Submit flow (line 624-696):**
1. User nhấn Enter → Form submit event
2. User click button → Form submit event
3. `handleSubmit()` được trigger
4. Detect input type (`state.inputType`)
5. Keyword → `showLoading('list')` + `handleSearch()`

**Bạn chỉ cần verify:**
- Form có `id="downloadForm"` (từ B1)
- Submit button có `type="submit"`
- Event listeners đã được attach trong `initInputForm()`

---

### Bước 6: Hiểu Search Flow & Skeleton Loading

**Flow chi tiết:**

**1. User Submit Keyword:**
```
User nhấn Enter hoặc click Submit
  ↓
handleSubmit() triggered
  ↓
state.inputType === 'keyword'
  ↓
showLoading('list') - Hiển thị 12 skeleton cards
  ↓
Scroll to appropriate position (mobile vs desktop)
  ↓
handleSearch(keyword) - Call API
```

**2. Show Skeleton (`content-renderer.ts` line 307-333):**
```
showLoading('list') called
  ↓
Create 12 skeleton cards using createSkeletonCard()
  ↓
Render vào #search-results-container
  ↓
Set #search-results-section display: block
  ↓
Hide #content-area
```

**Skeleton structure:**
- 12 cards grid (responsive 2-4 columns)
- Mỗi card có: thumbnail skeleton, title lines, channel line, metadata
- Shimmer animation (1.0s linear infinite)

**3. API Response & Render Results:**
```
API returns data
  ↓
Transform to VideoData[] format
  ↓
Save pagination data (nextPageToken, hasNextPage)
  ↓
renderResults(videos) called
  ↓
Generate HTML cards using createSearchResultCard()
  ↓
Replace skeleton với real cards
  ↓
Setup event delegation cho card clicks
```

**4. Card Click Handling:**
```
User clicks card
  ↓
handleSearchResultClick() triggered (event delegation)
  ↓
Extract videoId từ data-video-id
  ↓
Show detail skeleton
  ↓
Update input với YouTube URL
  ↓
Submit form để extract video
```

---

### Bước 7: Hiểu Infinite Scroll / Load More

**Logic đã có (`content-renderer.ts` line 109-238):**

**Setup (line 109-153):**
```
setupInfiniteScroll() called trong initContentRenderer()
  ↓
Attach scroll listener với requestAnimationFrame throttling
  ↓
Monitor distance từ viewport bottom đến grid bottom
  ↓
Trigger load more khi distance <= threshold
```

**Threshold responsive:**
- Mobile: 600px
- Desktop: 800px
(Defined trong shared utils)

**Load More Flow (line 159-238):**
```
Distance threshold reached
  ↓
Guards check:
  - loadMoreCount < 2 (max 2 lần)
  - hasNextPage === true
  - isLoadingMore === false
  ↓
Append 12 skeleton cards to grid
  ↓
Call API với nextPageToken
  ↓
Receive new results
  ↓
Remove skeleton cards
  ↓
Append real cards
  ↓
Update pagination state
```

**HTML Requirements (KHÔNG CẦN THÊM GÌ):**
- Grid đã có class `search-results-grid`
- JavaScript tự động monitor scroll
- Không cần sentinel element hay load more button

**Error Handling:**
- API fail → Remove skeleton cards
- Rollback loadMoreCount
- User có thể scroll lại để retry

---

### Bước 8: Testing Checklist

**Sau khi implementation, verify:**

**A. HTML Structure:**
- [ ] `#search-results-section` tồn tại
- [ ] `#search-results-container` tồn tại
- [ ] Section có `display: none` ban đầu
- [ ] Section nằm đúng vị trí (sau hero, trước content-area)
- [ ] Container có class `container` (reuse styling)

**B. CSS Imports:**
- [ ] `skeleton.css` được import trong main.ts
- [ ] `search-results.css` được import trong main.ts
- [ ] Import order đúng (sau sections, trong packages)

**C. CSS Customization:**
- [ ] Grid max-width removed (width: 100%)
- [ ] Card shadows removed
- [ ] Grid layout responsive: 2-3-4 columns
- [ ] Gap spacing correct

**D. Functional Tests - Submit:**
- [ ] Gõ keyword + Enter → skeleton xuất hiện
- [ ] Click submit button → skeleton xuất hiện
- [ ] 12 skeleton cards hiển thị trong grid
- [ ] Shimmer animation hoạt động
- [ ] Scroll behavior đúng (mobile vs desktop)

**E. Functional Tests - Results:**
- [ ] API trả về → skeleton bị replace bằng real cards
- [ ] Grid layout responsive đúng
- [ ] Thumbnail images load
- [ ] Title, channel, metadata hiển thị
- [ ] Duration badge hiển thị
- [ ] Card hover effect hoạt động (no shadow)

**F. Functional Tests - Card Click:**
- [ ] Click card → detail skeleton xuất hiện
- [ ] Input được update với YouTube URL
- [ ] Search results KHÔNG bị clear (preserved)
- [ ] Form auto-submit để extract video

**G. Functional Tests - Infinite Scroll:**
- [ ] Scroll gần cuối grid → skeleton cards append
- [ ] API call tự động trigger
- [ ] New cards append to grid
- [ ] Max 2 load more operations
- [ ] Scroll smooth, không jank

**H. Edge Cases:**
- [ ] Empty results → message hiển thị
- [ ] API error → error message hiển thị
- [ ] No internet → graceful failure
- [ ] Rapid scrolling không duplicate requests
- [ ] Clear input → results vẫn preserved

---

## 🚨 Vấn Đề Thường Gặp & Giải Pháp

### Vấn Đề 1: Skeleton Không Hiển Thị

**Triệu chứng:** Submit keyword nhưng không thấy skeleton loading

**Nguyên nhân có thể:**
- `#search-results-section` không tồn tại
- `#search-results-container` không tồn tại
- CSS không load (skeleton.css chưa import)
- Section vẫn `display: none`

**Giải pháp:**
- Verify IDs chính xác (case-sensitive)
- Check console cho errors
- Inspect element xem section có display:block không
- Verify CSS imports trong main.ts

---

### Vấn Đề 2: Grid Layout Bị Vỡ

**Triệu chứng:** Cards không align đúng, layout lộn xộn

**Nguyên nhân có thể:**
- CSS grid không apply
- Container class thiếu
- Breakpoints không trigger
- Max-width chưa remove

**Giải pháp:**
- Check `.search-results-grid` có grid-template-columns
- Verify responsive breakpoints trigger
- Use DevTools resize để test breakpoints
- Ensure max-width: 100% (hoặc removed)

---

### Vấn Đề 3: Cards Không Clickable

**Triệu chứng:** Click card không trigger action

**Nguyên nhân có thể:**
- Event delegation không setup
- Missing `data-video-id` attribute
- JavaScript error block event listener
- Card CSS có `pointer-events: none`

**Giải pháp:**
- Verify `handleSearchResultClick` được attach
- Check console errors
- Inspect card element có `data-video-id` và `data-video-title`
- Remove `pointer-events: none` nếu có

---

### Vấn Đề 4: Infinite Scroll Không Hoạt Động

**Triệu chứng:** Scroll đến cuối nhưng không load more

**Nguyên nhân có thể:**
- `setupInfiniteScroll()` không được call
- Grid không có class `search-results-grid`
- Pagination data không save (hasNextPage = false)
- LoadMoreCount đã reach limit (>= 2)

**Giải pháp:**
- Check `initContentRenderer()` được call
- Verify grid có correct class
- Check console log cho pagination data
- Test với keyword có nhiều results (>20 videos)

---

### Vấn Đề 5: Search Results Bị Clear Khi Click Card

**Triệu chứng:** Click video card → search results biến mất

**Nguyên nhân:**
- Logic đúng phải PRESERVE results khi click card
- Flag `isFromListItemClick` phải được set

**Verify logic:**
- `handleSearchResultClick()` set `setIsFromListItemClick(true)`
- `hideSearchResultsSection()` check flag này
- Nếu flag = true → KHÔNG hide/clear results

**Giải pháp:**
- Verify flag được set correctly
- Check `hideSearchResultsSection()` có early return
- Test: click card → results vẫn visible phía dưới video detail

---

### Vấn Đề 6: CSS Shimmer Animation Không Chạy

**Triệu chứng:** Skeleton cards tĩnh, không có shimmer effect

**Nguyên nhân:**
- CSS animation không define
- `@keyframes shimmer` missing
- Browser có `prefers-reduced-motion`
- CSS file không load

**Giải pháp:**
- Verify `skeleton.css` imported
- Check `@keyframes shimmer` tồn tại
- Test browser không có reduced motion setting
- Inspect element xem animation property có applied

---

## 📚 Tóm Tắt File References

**Files cần ĐỌC (context only):**
- `/docs/doc-clone-site/project-clone-guide.md` - Mobile-first methodology

**Files cần SỬA:**
1. `/apps/y2matepro/index.html` - Thêm search results section
2. `/apps/y2matepro/src/main.ts` - Verify CSS imports
3. `/apps/y2matepro/src/styles/reusable-packages/search-results/search-results.css` - Remove max-width, remove shadows

**Files để THAM KHẢO (không sửa):**
- `/apps/y2matepro/src/features/downloader/logic/input-form.ts` - Submit & search logic
- `/apps/y2matepro/src/features/downloader/ui-render/content-renderer.ts` - Rendering logic
- `/apps/y2matepro/src/ui-components/search-result-card/skeleton-card.ts` - Skeleton component
- `/apps/y2matepro/src/ui-components/search-result-card/search-result-card.ts` - Card component
- `/apps/y2matepro/src/styles/reusable-packages/skeleton/skeleton.css` - Skeleton styling

---

## 🎯 Tiêu Chí Hoàn Thành

Implementation hoàn tất khi:

✅ **HTML Structure:**
- `#search-results-section` tồn tại với `display: none` ban đầu
- `#search-results-container` tồn tại bên trong section
- Section có class `search-results-section` cho styling
- Container có class `container` cho responsive wrapper
- Vị trí đúng: sau hero, trước content-area

✅ **CSS Setup:**
- `skeleton.css` được import trong main.ts
- `search-results.css` được import trong main.ts
- Grid max-width removed (width: 100%)
- Card shadows removed
- Import order correct

✅ **Functionality - Submit:**
- Nhấn Enter trigger submit
- Click button trigger submit
- Skeleton 12 cards xuất hiện
- Shimmer animation hoạt động
- Scroll behavior correct

✅ **Functionality - Results:**
- API data render thành cards
- Grid responsive (2-3-4 columns)
- Cards hiển thị đầy đủ (thumbnail, title, metadata)
- Hover effects hoạt động
- No shadows

✅ **Functionality - Interactions:**
- Click card → show video detail
- Search results preserved
- Input updated với URL
- Auto-submit để extract video

✅ **Functionality - Infinite Scroll:**
- Scroll trigger load more automatically
- Skeleton append khi loading
- New cards append to grid
- Max 2 load more operations
- Smooth scroll, no jank

✅ **Quality:**
- No console errors
- Responsive trên tất cả breakpoints
- Mobile-first approach
- Clean code, no breaking changes

---

## 💡 Ghi Chú Bổ Sung

### Về Logic Fake Data vs Real Search

**Quan trọng hiểu:**

Project này CHỈ support **YouTube downloader**.

**Khi submit KEYWORD:**
- Call `api.searchV2(keyword)` → Tìm YouTube videos
- Trả về danh sách videos từ YouTube
- Render grid cards với real thumbnails, titles, metadata
- Click card → Extract YouTube video (có thể fake data instant UI)

**Khi submit URL:**
- Nếu YouTube URL → Fake data instant (như đã implement)
- Nếu non-YouTube → Call API extract

**Search results KHÔNG PHẢI fake data:**
- API search thực sự call YouTube search
- Results là real videos
- Chỉ video detail (sau khi click) mới có fake data strategy (YouTube only)

---

### Về Empty State & Error Handling

**Empty State:**
- `renderMessage('No videos found', 'info')`
- Hiển thị text message trong `#content-area`
- Search results section bị hide
- User có thể submit keyword mới

**Error State:**
- Network error → `renderMessage(errorMsg, 'error')`
- API error → Same behavior
- Hiển thị trong `#content-area`
- Không có retry button (user tự submit lại)

**Loading Timeout:**
- Không có timeout handling hiện tại
- API request dựa vào browser default timeout
- User có thể refresh page nếu stuck

---

### Về Responsive Grid Behavior

**Mobile (0-599px):**
- 2 columns grid
- Gap: 10px (package-root CSS variable)
- Title: 1 line clamp
- Metadata: Hidden (không hiển thị views/date)

**Tablet (600-839px):**
- 3 columns grid
- Gap: larger (từ CSS variable)
- Title: 2 lines clamp
- Metadata: Visible

**Desktop (840px+):**
- 4 columns grid
- Gap: same as tablet
- Title: 2 lines clamp
- Metadata: Visible
- Width: 100% (full container, no max-width)

**Container System:**
- Reuse existing `.container` class từ common.css
- Container có padding responsive
- Section full-width background

---

### Về Card Click Behavior - Preserve Results

**Critical UX Pattern:**

Khi user click vào search result card:
1. Search results PHẢI preserved (không clear)
2. Video detail hiển thị trong `#content-area`
3. Search results section vẫn visible
4. User có thể scroll xuống xem video detail
5. User có thể scroll lên để click card khác

**Implementation:**
- `isFromListItemClick` flag control behavior
- `hideSearchResultsSection()` check flag trước khi hide
- Chỉ hide khi direct URL submit (không qua card click)

---

### Về Infinite Scroll Performance

**Optimization đã có:**
- RequestAnimationFrame throttling (no jank)
- Passive scroll listener (better performance)
- Intersection check optimized (chỉ check khi cần)
- Max 2 operations limit (prevent spam)

**No Manual Load More Button:**
- Pure infinite scroll
- Automatic trigger
- No UI button needed
- Skeleton cards là loading indicator

---

## 🔄 Bước Tiếp Theo Sau Khi Hoàn Thành

Sau khi B2 hoàn tất, các tasks tiếp theo:

1. **B3: Video Detail Display** - Show download options khi submit URL
2. **B4: Convert Modal** - Popup cho format conversion
3. **B5: Download Progress** - Progress bar và download handling
4. **B6: Additional Features** - Suggestions dropdown, etc.

Mỗi task sẽ có implementation guide riêng.

---

## ❓ Câu Hỏi & Troubleshooting

**Common Questions:**

**Q: Tại sao cần 2 containers (#search-results-section và #search-results-container)?**
A: Section để show/hide toàn bộ search area. Container để render cards vào. Clean separation.

**Q: Grid width 100% có bị quá rộng trên desktop không?**
A: Không, vì có `.container` wrapper với max-width và padding. Grid tự adapt.

**Q: Infinite scroll có conflict với footer không?**
A: Không, vì monitor grid bottom, không phải page bottom. Footer không ảnh hưởng.

**Q: Có cần loading spinner ngoài skeleton không?**
A: Không, skeleton cards chính là loading indicator. No extra spinner needed.

**Q: Search results có bị clear khi clear input không?**
A: Không tự động clear. Results preserved cho đến khi submit mới hoặc refresh page.

---

**Chúc bạn triển khai thành công! Logic đã sẵn sàng, chỉ cần HTML structure và CSS verification.** 🚀
