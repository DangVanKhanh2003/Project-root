---
description: Workflow to implement Audio Track Dropdown feature for a new project
---

# Audio Track Dropdown - Quick Implementation Workflow

## Tổng quan
Triển khai dropdown chọn ngôn ngữ/audio track có thể tìm kiếm với cờ quốc gia SVG.

## Pre-requisites
- Đọc tài liệu đầy đủ tại: `.agent/docs/audio-track-dropdown-feature.md`

---

## Step 1: Tạo Languages Data
**Path:** `src/features/downloader/data/languages.ts`

Copy nội dung từ tài liệu. Điều chỉnh danh sách ngôn ngữ nếu cần.

---

## Step 2: Tạo Dropdown Logic
**Path:** `src/features/downloader/ui-render/dropdown-logic.ts`

Copy nội dung từ tài liệu.

---

## Step 3: Tìm tất cả templates cần sửa
```bash
# Tìm tất cả file có .quality-wrapper
grep -r "quality-wrapper" --include="*.njk" --include="*.html" _templates/ src/
```

---

## Step 4: Thêm HTML vào mỗi template
Trong mỗi file, tìm `quality-wrapper` và thêm `audio-dropdown-wrapper` SAU `quality-dropdown-wrapper`.

Xem HTML structure trong tài liệu.

---

## Step 5: Thêm CSS
**Path:** `src/styles/components/quality-select.css`

Append CSS từ tài liệu vào cuối file.

---

## Step 6: Cập nhật format-selector.css (nếu cần)
**Path:** `src/ui-components/format-selector/format-selector.css`

Đảm bảo có responsive CSS cho 800px breakpoint.

---

## Step 7: Initialize trong main.ts
Thêm import và gọi `initAudioDropdown()` trong `loadFeatures()`.

---

## Step 8: Copy SVG Flags
Đảm bảo folder `public/assest/flat-svg/` có các file SVG cờ quốc gia.

---

## Step 9: Test
- [ ] Desktop: icon + text hiển thị đầy đủ
- [ ] Mobile: chỉ icon, click để mở rộng
- [ ] Search hoạt động
- [ ] Keyboard (Escape) hoạt động
- [ ] Animation smooth

---

## Checklist
- [ ] languages.ts created
- [ ] dropdown-logic.ts created  
- [ ] ALL templates updated
- [ ] CSS added to quality-select.css
- [ ] format-selector.css updated (if needed)
- [ ] main.ts updated
- [ ] SVG flags copied
- [ ] Tested on desktop, tablet, mobile
