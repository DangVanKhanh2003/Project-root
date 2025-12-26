# Hướng Dẫn Tích Hợp Base Root Cho Project Mới

Hướng dẫn từng bước để tích hợp `@downloader/core` package vào project mới.

---

## 📋 Tổng Quan

Package `@downloader/core` cung cấp các utilities và styles dùng chung cho tất cả các apps trong monorepo. Khi tạo project mới, bạn cần tích hợp package này để tái sử dụng code thay vì viết lại từ đầu.

---

## 🚀 Bước 1: Cài Đặt Package

### 1.1 Thêm dependency vào project

- Mở file `package.json` của project mới
- Thêm `@downloader/core` vào phần `dependencies`
- Giá trị: `"workspace:*"` (để link với workspace trong monorepo)

### 1.2 Cài đặt dependencies

- Chạy lệnh install package manager (pnpm/npm/yarn)
- Verify package đã được link đúng trong `node_modules/@downloader/core`

---

## 📦 Bước 2: Import JavaScript Utilities

### 2.1 Format Processing Utilities

**Khi nào dùng:**
- Khi cần xử lý format data từ API
- Khi cần map raw data sang chuẩn format
- Khi cần filter/extract specific format

**Cách import:**
- Import từ path: `@downloader/core/utils`
- Các functions: `mapFormat`, `extractFormat`, `processFormatArray`

**Use case:**
- Xử lý response từ API extract/convert
- Transform format data trước khi render UI
- Filter formats theo quality/type

### 2.2 Link Validation Utility

**Khi nào dùng:**
- Sau khi download thành công, cần check link có hết hạn không
- Trước khi trigger download lại
- Implement "regenerate link" feature

**Cách import:**
- Import từ path: `@downloader/core/utils`
- Function: `isLinkExpired`

**Logic:**
- Pass vào timestamp của lúc complete conversion
- Function check xem đã quá 25 phút chưa
- Return true/false

### 2.3 Download Stream Utility (iOS Strategy)

**Khi nào dùng:**
- Khi detect iOS device
- Khi file size ≤ 150MB
- Khi cần download vào RAM trước rồi mới save

**Cách import:**
- Import từ path: `@downloader/core/utils`
- Function: `downloadStreamToRAM`

**Parameters cần truyền:**
- URL của file cần download
- Callback function cho progress updates
- AbortSignal để handle cancel

**Return:**
- Blob object chứa file data trong RAM

### 2.4 Ripple Effect Utility

**Khi nào dùng:**
- Khi muốn thêm animation ripple cho buttons
- Material Design effect khi click

**Cách import:**
- Import từ path: `@downloader/core/utils`
- Function: `addRippleEffect`

**Cách dùng:**
- Select button element bằng querySelector
- Pass element vào function
- Effect tự động add khi user click

### 2.5 YouTube Helper Utilities

**Khi nào dùng:**
- Validate URL có phải YouTube không
- Extract video ID từ URL
- Generate fake data để show UI ngay lập tức

**Cách import:**
- Import từ path: `@downloader/core/utils/youtube`
- Các functions: `isYouTubeUrl`, `extractYouTubeVideoId`, `generateFakeYouTubeData`

**Flow gợi ý:**
1. User paste URL → validate bằng `isYouTubeUrl`
2. Nếu valid → extract ID bằng `extractYouTubeVideoId`
3. Generate fake data bằng `generateFakeYouTubeData` → show UI ngay
4. Call API để fetch real data → replace fake data

### 2.6 Shared Constants

**Khi nào dùng:**
- Cần timeout cho API requests
- Cần expiry time cho cache
- Cần threshold cho iOS stream size

**Cách import:**
- Import từ path: `@downloader/core/constants`
- Các functions: `getTimeout`, `getExpiryTime`, `getIOSStreamMaxSize`

**Available constants:**
- API timeouts cho từng operation (extract, convert, polling...)
- Expiry times (static data, download links)
- iOS stream max size (150MB)

---

## 🎨 Bước 3: Import CSS Styles

### 3.1 Ripple Effect Styles

**Quan trọng:**
- CSS phải được import **TRƯỚC** các component styles của app
- Có 2 cách import (chọn 1):

**Cách 1: Import trong CSS file chính**
- Mở file CSS entry point (vd: `src/styles/index.css`)
- Thêm import statement ở **đầu file**
- Path: `@downloader/core/styles/ripple-effect.css`
- Syntax: `@import` directive

**Cách 2: Import trong TypeScript entry point**
- Mở file TS entry point (vd: `src/main.ts`)
- Thêm import statement ở **đầu file**, trước các imports khác
- Path: `@downloader/core/styles/ripple-effect.css`
- Syntax: ES6 import

**Kiểm tra:**
- Dev server tự động hot-reload CSS
- Check browser DevTools → Elements → Styles
- Verify class `.ripple` có xuất hiện

### 3.2 Customize Ripple Effect (Optional)

**Nếu muốn thay đổi màu sắc/animation:**
- Viết CSS override trong app styles
- Target class: `.ripple`
- Properties có thể customize:
  - `background-color`: màu của ripple
  - `animation-duration`: tốc độ animation
  - `transform: scale(...)`: size của ripple

---

## ✅ Bước 4: Best Practices

### 4.1 Thứ tự import

**CSS:**
1. Core styles từ `@downloader/core` (đầu tiên)
2. Reset/Base styles của app
3. Component styles của app
4. Page-specific styles

**TypeScript:**
1. Core utilities từ `@downloader/core`
2. Local utilities của app
3. Components
4. Styles

### 4.2 Error Handling

**Khi dùng async utilities (downloadStreamToRAM):**
- Luôn wrap trong try-catch
- Check error type (AbortError vs network error)
- Show user-friendly error messages
- Cleanup resources (revoke blob URLs, abort controllers)

**Khi dùng validation utilities:**
- Validate input trước khi process
- Fallback values cho edge cases
- Log errors cho debugging

### 4.3 Performance Tips

**Tree-shaking:**
- Chỉ import functions thực sự cần dùng
- Không import toàn bộ package
- Vite/Webpack sẽ tự động remove unused code

**Lazy loading:**
- Utilities nặng (download-stream) có thể lazy import
- Dùng dynamic import nếu chỉ cần trong specific scenarios

---

## 🐛 Bước 5: Troubleshooting

### 5.1 Lỗi: "Module not found"

**Nguyên nhân:**
- Package chưa được install
- Workspace link bị broken
- TypeScript paths config sai

**Cách fix:**
1. Re-install dependencies
2. Check node_modules có symbolic link đúng không
3. Verify tsconfig.json có paths mapping

### 5.2 Lỗi: CSS không load / Ripple không hoạt động

**Nguyên nhân:**
- Chưa import CSS
- Import order sai (CSS app load trước core CSS)
- Dev server chưa restart

**Cách fix:**
1. Verify import statement syntax đúng
2. Check import order (core CSS phải đầu tiên)
3. Restart dev server
4. Clear browser cache
5. Check browser DevTools → Network → CSS file có load không

### 5.3 Lỗi: TypeScript type errors

**Nguyên nhân:**
- TypeScript chưa build
- tsconfig paths không đúng
- IDE cache cũ

**Cách fix:**
1. Build TypeScript project
2. Restart TypeScript server trong IDE
3. Check tsconfig.json có include packages/core không

### 5.4 Lỗi: "Cannot resolve @downloader/core/styles/..."

**Nguyên nhân:**
- Package.json exports chưa config CSS paths
- Vite config chưa resolve CSS từ packages

**Cách fix:**
1. Check packages/core/package.json có exports cho styles không
2. Verify path mapping đúng
3. Restart dev server

---

## 📚 Bước 6: Example Workflow

### Workflow tạo project mới sử dụng core

**Setup:**
1. Tạo folder mới trong `apps/`
2. Copy `package.json` template từ app khác
3. Thêm `@downloader/core` dependency
4. Install dependencies

**Import utilities:**
1. Tạo file `src/main.ts`
2. Import core CSS ở đầu file
3. Import app styles
4. Import các utilities cần dùng

**Implement features:**
1. YouTube URL validation → dùng `isYouTubeUrl`
2. Extract video ID → dùng `extractYouTubeVideoId`
3. Show instant UI → dùng `generateFakeYouTubeData`
4. Download files → dùng `downloadStreamToRAM` (iOS)
5. Check link expiry → dùng `isLinkExpired`
6. Add button effects → dùng `addRippleEffect`

**Testing:**
1. Build project
2. Test trên browser
3. Test ripple effect
4. Test download flow
5. Test link expiry

---

## 📝 Lưu Ý Quan Trọng

### Dependencies

**Không được:**
- Modify code trong `@downloader/core` từ app
- Copy code từ core về app
- Duplicate utilities

**Nên:**
- Luôn import từ `@downloader/core`
- Nếu cần customize → create wrapper function trong app
- Report bugs/missing features để update core

### CSS Architecture

**Core styles:**
- Minimal CSS, chỉ cần thiết
- Dễ dàng override từ app
- Không conflict với app styles

**App styles:**
- Override core styles nếu cần
- Thêm app-specific styles
- Maintain consistent naming

### TypeScript Support

**Type safety:**
- Core có full TypeScript definitions
- Import types nếu cần
- IDE auto-completion hoạt động

---

## 🔗 Tài Liệu Liên Quan

- Phase 1 Refactor Document: `docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md`
- Master Refactor Plan: `docs/refactor/MASTER_REFACTOR_DOC.md`
- Core Package Source: `packages/core/src/`

---

## 📞 Hỗ Trợ

**Nếu gặp vấn đề:**
1. Check troubleshooting section trước
2. Review existing apps (ytmp3-clone-4, ytmp3-clone-3) làm reference
3. Check git history để xem cách migration được thực hiện

**Cập nhật document:**
- Document này sẽ được update khi có utilities mới
- Check git log để xem changes

---

**Phiên bản:** Phase 1 - December 2025
**Last updated:** CSS extraction completed - All 4 apps migrated
