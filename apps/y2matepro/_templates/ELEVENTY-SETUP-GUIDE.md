# Eleventy Setup Guide - Kinh Nghiệm & Lessons Learned

> **Lưu ý**: Document này KHÔNG chứa code. Chỉ tập trung vào concepts, workflow, và lessons learned từ thực tế triển khai.

## Tổng Quan Setup

### Mục Tiêu Ban Đầu
- Chuyển đổi static HTML files sang Eleventy templates
- Tách riêng content (i18n data) và structure (templates)
- Hỗ trợ đa ngôn ngữ (multilingual)
- SEO-friendly URLs
- Maintainable architecture

### Quyết Định Thiết Kế

#### 1. Template Engine: Nunjucks
**Tại sao chọn Nunjucks?**
- Syntax gần với HTML, dễ học
- Powerful features: inheritance, filters, macros
- Good community support

**Alternatives đã xem xét**:
- Liquid: Quá hạn chế cho logic phức tạp
- EJS: Syntax ít clean hơn
- Handlebars: Thiếu built-in filters

#### 2. I18n Strategy: Modular Data Files
**Quyết định**: Tách shared data và page-specific data

**Lý do**:
- DRY principle: Navigation/footer dùng chung
- Scalability: Thêm ngôn ngữ mới chỉ cần add JSON files
- Content editing: Non-developers có thể edit JSON

**Rejected approach**: Monolithic i18n file
- Quá lớn, khó maintain
- Merge conflicts khi nhiều người edit
- Không tận dụng được Eleventy data cascade

#### 3. Directory Structure
**Input**: `_templates/` (convention với underscore)
**Output**: `_11ty-output/` rồi copy vào root

**Tại sao không output trực tiếp vào root?**
- Safety: Tránh overwrite files quan trọng
- Flexibility: Có thể verify output trước khi deploy
- Build process control: Custom copy logic per page

## Quá Trình Setup - Step by Step

### Phase 1: Basic Setup ✅

**Bước đầu**:
1. Install Eleventy package
2. Tạo config file `.eleventy.cjs`
3. Define input/output directories
4. Setup basic template với layout

**Challenges gặp phải**:
- **CommonJS vs ES Modules confusion**: Package.json có `"type": "module"` nhưng Eleventy config phải dùng `.cjs`
- **Passthrough copy**: Phải config để copy static assets (images, CSS, JS)

**Lesson learned**:
- Đọc kỹ Eleventy docs về file extensions
- Test với một template đơn giản trước khi scale

### Phase 2: Data Architecture 🔄

**Ban đầu**: Một file `en.json` chứa tất cả content

**Vấn đề**:
- File quá lớn (>2000 lines)
- Khó tìm kiếm và edit
- Không reusable

**Refactor thành**:
- `_data/i18n/base.json` - Shared data
- `_data/pages/{pageName}/en.json` - Page-specific data

**Implementation challenge**:
- Eleventy data cascade hiểu sai ban đầu
- Nghĩ rằng phải dùng pagination để generate multilingual
- Thực tế: Global data + computed data đơn giản hơn nhiều

**Lesson learned**:
- KISS principle (Keep It Simple, Stupid)
- Eleventy data cascade rất powerful, đừng overthink
- Test incremental: Một page trước, rồi scale

### Phase 3: Multilingual Setup ⚠️

**Plan ban đầu**: English + Vietnamese

**Thử nghiệm với Pagination**:
- Mục tiêu: Một template generate cả EN và VI versions
- Dùng `eleventyComputed` để dynamic permalink
- Dùng pagination để loop qua languages

**Kết quả**: FAILED ❌

**Lý do thất bại**:
- Permalink được evaluate trước computed data
- Pagination với dynamic permalinks tạo duplicate errors
- Eleventy v3 có breaking changes về permalink resolution

**Attempts đã thử**:
1. Front matter với Nunjucks template strings → Failed
2. `.11tydata.js` với CommonJS → ES Module error
3. `.11tydata.js` với ES Module → Vẫn duplicate permalinks
4. Conditional permalink trong front matter → Không evaluate đúng

**Solution cuối cùng**:
- Tạo separate template files (index.njk, index-vi.njk)
- Mỗi file có permalink riêng
- Accept duplication code để tránh complexity

**Lesson learned**:
- Pagination trong Eleventy không phải silver bullet
- Đôi khi code duplication tốt hơn over-engineering
- Nếu approach phức tạp quá, tìm cách đơn giản hơn

### Phase 4: URL Strategy 🎯

**Requirement**:
- English pages: Root directory (`/`, `/youtube-to-mp4`)
- Vietnamese pages: `/vi/` subdirectory
- No `.html` extensions trong SEO tags
- Clean canonical URLs

**Challenges**:

#### Challenge 1: `.html` Extension in URLs
**Vấn đề**: Eleventy `page.url` includes `.html`

**Giải pháp thử**:
- Custom collection với URL transformation → Too complex
- Eleventy transform plugin → Overkill
- **Final solution**: Nunjucks filter `| replace('.html', '')`

**Why this works**:
- Simple, readable
- Applied at template level
- No config overhead

#### Challenge 2: `/index` in Homepage URL
**Vấn đề**: `https://y2matepro.com/index` thay vì `https://y2matepro.com/`

**Giải pháp**: Chain filters
- First: Remove `.html`
- Then: Replace `/index` với `/`

**Lesson learned**: Nunjucks filters rất powerful, dùng chain filters cho transformations

#### Challenge 3: Multilingual URL Logic
**Vấn đề ban đầu**: Conditional logic cho Vietnamese tạo URLs như `/vi/pages/vi/`

**Root cause**:
- Permalink là `/pages/vi/index.html`
- Conditional thêm `/vi/` prefix
- Kết quả: Double language code

**Giải pháp**:
- Đơn giản hóa: English only trước
- Remove conditional logic
- Future-proof: Sẵn sàng cho multilingual nhưng không implement ngay

**Lesson learned**:
- Don't implement features you don't need yet (YAGNI)
- URL structure cần plan kỹ từ đầu
- Test URLs trong mọi scenario (homepage, subpages, with/without trailing slash)

### Phase 5: Whitespace Control 🎨

**Vấn đề phát hiện**: HTML output có 8 dòng trống ở đầu

**Root cause**:
- Nunjucks tags (set, comments) tạo newlines
- Front matter cũng contribute vào whitespace
- Layout file có nhiều logic ở đầu

**Giải pháp**:
- Dùng `{%-` thay vì `{%` (strip whitespace trước)
- Dùng `-%}` thay vì `%}` (strip whitespace sau)
- Áp dụng cho set variables và comments

**Khi nào dùng whitespace control**:
- ✅ Set variables ở đầu template
- ✅ Comments không cần trong output
- ✅ Logic blocks (if/for) khi không cần spacing
- ❌ Content blocks (để giữ formatting)

**Lesson learned**:
- HTML whitespace matters cho SEO và performance
- Whitespace control là must-have, không phải nice-to-have
- Update AI prompts ngay để avoid lặp lại sai lầm

### Phase 6: SEO Tags Optimization 🔍

**Requirements**:
- Canonical URLs
- hreflang tags (future multilingual)
- Open Graph tags
- Schema.org markup
- No duplicate language references

**Mistakes made**:

#### Mistake 1: Hardcoded `dir="ltr"`
**Sai lầm**: Luôn set direction thành LTR cho non-RTL languages

**Vấn đề**:
- HTML spec default là LTR rồi
- Redundant attribute
- Tăng HTML size không cần thiết

**Fix**: Chỉ add `dir="rtl"` khi language là Arabic/Hebrew

#### Mistake 2: Vietnamese og:locale:alternate
**Sai lầm**: Giữ Vietnamese locale alternate tag khi đã remove VI support

**Vấn đề**:
- Misleading search engines
- Promise language version không tồn tại
- Có thể impact crawl budget

**Fix**: Remove tất cả VI references khỏi SEO tags

#### Mistake 3: Language Map cho Unused Languages
**Sai lầm**: Giữ full language map (en, vi, es, fr, de, ja, ar, he) khi chỉ dùng EN

**Đánh giá**: Actually okay
- Minimal overhead
- Future-proof
- Easy to enable languages sau này

**Decision**: Keep language map, chỉ remove specific tags

**Lesson learned**:
- SEO tags consistency rất quan trọng
- Verify actual output HTML, không chỉ tin templates
- Search console có thể catch những errors này

### Phase 7: Build Scripts & Automation ⚙️

**Evolution của build process**:

**Version 1**: Manual build + manual copy
- Quá nhiều bước
- Easy to forget files
- Không scalable

**Version 2**: Single script build + copy all
- Better nhưng copy files không cần
- Slow khi project lớn

**Version 3**: Selective copy per page
- Chỉ copy files cần thiết
- Update script khi add page mới
- Balance giữa automation và control

**Lesson learned**:
- Build process evolution theo project size
- Documentation quan trọng cho build scripts
- AI prompts nên include build script updates

## Sai Lầm Lớn Nhất & Bài Học

### Top 5 Mistakes

#### 1. Over-Engineering Multilingual từ Đầu
**Mistake**: Cố implement full multilingual setup khi chưa cần

**Impact**:
- Wasted time với pagination approach
- Complex code khó debug
- Delayed actual feature development

**Better approach**:
- English only first, validate structure
- Add multilingual khi có actual requirement
- Keep architecture multilingual-ready nhưng không implement hết

#### 2. Không Test Whitespace Ngay
**Mistake**: Focus vào functionality, bỏ qua HTML output quality

**Impact**:
- Discovered late (8 empty lines)
- Phải update lại tất cả templates và prompts
- Potential SEO impact nếu deploy

**Better approach**:
- Check HTML output từ template đầu tiên
- Set standards từ đầu
- Include whitespace check trong verification

#### 3. Tin Vào Eleventy Pagination Quá Mức
**Mistake**: Nghĩ pagination solve mọi multilingual problems

**Impact**:
- Multiple failed attempts
- Frustration và time waste
- Complex debugging

**Better approach**:
- Read community experiences trước
- Prototype nhỏ trước khi commit
- Accept simpler solutions

#### 4. Không Có URL Naming Convention Rõ Ràng
**Mistake**: Mix giữa `.html` extensions và clean URLs

**Impact**:
- Inconsistent SEO tags
- User confusion
- Extra work để fix sau

**Better approach**:
- Define URL strategy từ đầu
- Document conventions
- Verify mọi URL type (internal, canonical, hreflang, OG)

#### 5. AI Prompts Không Update Kịp Thời
**Mistake**: Fix issues trong code nhưng quên update prompts

**Impact**:
- New pages repeat old mistakes
- Inconsistency across pages
- More rework

**Better approach**:
- Treat prompts như code
- Update prompts ngay khi có changes
- Version control cho prompts

## Best Practices Rút Ra

### 1. Start Simple, Iterate
- Begin với one language, one page
- Validate architecture
- Scale gradually

### 2. Data Structure Matters
- Invest time trong data modeling
- Modular > Monolithic
- Think about content editors, not just developers

### 3. URL Strategy First
- Plan URLs trước khi code
- Consider SEO implications
- Test all URL variations

### 4. Whitespace is Important
- Clean HTML output from day 1
- Use whitespace control consistently
- Verify output, not just templates

### 5. Documentation is Code
- Document decisions và rationale
- Update docs khi architecture changes
- README for future self (và team)

### 6. SEO Tags Consistency
- Verify all meta tags
- No contradictory information
- Test với SEO tools

### 7. Build Process Evolution
- Start manual để hiểu process
- Automate incrementally
- Document build steps

## When to Use Eleventy

### Good Fit ✅
- Static content sites
- Marketing pages
- Documentation sites
- Multilingual content sites
- SEO-focused projects
- Projects cần build-time optimization

### Not Ideal ❌
- Highly dynamic content
- Real-time data requirements
- Complex client-side interactions
- Projects cần server-side rendering
- When team không familiar với static site generators

## Alternatives Considered

### Next.js
**Pros**:
- Full React ecosystem
- Great DX
- ISR và SSR options

**Cons**:
- Overkill cho static content
- Heavier runtime
- More complex setup

**Why not chosen**: Project không cần React, static HTML đủ

### Gatsby
**Pros**:
- Rich plugin ecosystem
- GraphQL data layer
- Good for complex data

**Cons**:
- Slower build times
- GraphQL learning curve
- Over-engineered for needs

**Why not chosen**: Simpler solution needed

### Plain HTML + Templating
**Pros**:
- Maximum simplicity
- No build step

**Cons**:
- Manual content management
- No i18n support
- Repetitive code

**Why not chosen**: Không scale được với nhiều pages

## Future Considerations

### Nếu Project Scale Lớn

#### Consider:
1. **Content Management**: Headless CMS integration
2. **Image Optimization**: Eleventy Image plugin
3. **Search**: Client-side search (Pagefind, Lunr.js)
4. **Analytics**: Build-time analytics integration
5. **A/B Testing**: Build multiple variants

#### Watch Out For:
1. **Build Times**: Có thể chậm khi >1000 pages
2. **Memory Usage**: Large data files impact build
3. **CI/CD**: Need robust build pipeline

### Nếu Add Multilingual

#### Recommendations:
1. Start với 1 language mới (Vietnamese)
2. Validate URL structure works
3. Test SEO tags cho mọi language
4. Consider language switcher UX
5. Plan cho language fallbacks

#### Avoid:
1. Auto-translation (quality issues)
2. Complex language detection
3. Mixed language content
4. Incomplete translations

## Checklist Cho Project Mới

### Setup Phase
- [ ] Install Eleventy
- [ ] Define input/output directories
- [ ] Choose template engine
- [ ] Setup basic layout
- [ ] Test với one page
- [ ] Verify HTML output quality

### Data Architecture
- [ ] Plan data structure (shared vs. page-specific)
- [ ] Create sample data files
- [ ] Test data cascade
- [ ] Document data schema
- [ ] Plan for i18n (nếu cần)

### URL Strategy
- [ ] Define permalink conventions
- [ ] Plan SEO URLs format
- [ ] Test URL transformations
- [ ] Verify canonical URLs
- [ ] Check hreflang setup (nếu multilingual)

### Template Development
- [ ] Create base layout
- [ ] Build reusable components (header, footer)
- [ ] Implement whitespace control
- [ ] Add SEO tags
- [ ] Test responsive design

### Build Process
- [ ] Setup build scripts
- [ ] Add copy automation
- [ ] Create verification steps
- [ ] Document build process
- [ ] Test CI/CD integration

### Quality Checks
- [ ] No empty lines at start
- [ ] No unrendered variables
- [ ] Clean URLs (no .html in SEO tags)
- [ ] Proper whitespace
- [ ] Valid HTML
- [ ] SEO tags complete
- [ ] Accessibility checked

### Documentation
- [ ] README with overview
- [ ] Setup guide (this doc)
- [ ] Data schema documentation
- [ ] Build process documentation
- [ ] Troubleshooting guide

## Kết Luận

Eleventy là tool tốt cho project này, nhưng success phụ thuộc vào:

1. **Planning**: URL strategy, data structure, build process
2. **Simplicity**: Resist over-engineering
3. **Testing**: Verify output, không chỉ tin templates
4. **Documentation**: Cho future self và team
5. **Iteration**: Start simple, improve dần

Biggest lesson: **Đừng cố làm mọi thứ perfect từ đầu**. Ship working version, learn từ usage, iterate based on real needs.

Remember: Code có thể refactor, nhưng architectural decisions khó thay đổi sau. Invest time upfront trong planning.
