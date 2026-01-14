# YT Preview Card Skeleton - Test Guide

## 📋 Mục đích

File `test-skeleton.html` được tạo để test skeleton loading state của YT Preview Card component sau khi refactor vào `@downloader/ui-components`.

## 🚀 Cách sử dụng

### Option 1: Sử dụng Dev Server (Khuyến nghị)

```bash
# Từ thư mục y2mate-new-ux
npm run dev
```

Sau đó mở trình duyệt và truy cập:
```
http://localhost:5173/test-skeleton.html
```

### Option 2: Mở trực tiếp file

```bash
# Từ thư mục y2mate-new-ux
open test-skeleton.html
```

Hoặc kéo thả file vào trình duyệt.

## 🧪 Các Test Cases

### 1. **Default Skeleton State**
- Kiểm tra skeleton với cấu hình mặc định
- Verify shimmer animation hoạt động
- Check responsive design

### 2. **Multiple Skeletons (Grid Layout)**
- Test 4 skeleton cards trong grid layout
- Kiểm tra layout responsive trên mobile/tablet/desktop
- Verify animation đồng bộ

### 3. **Custom Skeleton Colors**
- Test CSS variables override
- Thử nghiệm với custom colors:
  - `--skeleton-base: #e3f2fd`
  - `--skeleton-shimmer: #bbdefb`

### 4. **Real Preview Card (For Comparison)**
- So sánh skeleton với preview card thực
- Kiểm tra CLS (Cumulative Layout Shift)
- Verify structure match

### 5. **Interactive Testing**
- **Show Skeleton**: Hiển thị skeleton state
- **Show Real Content**: Hiển thị content thực
- **Toggle State**: Chuyển đổi giữa skeleton và real content
- **Simulate Loading (3s)**: Mô phỏng loading thực tế

## ✅ Checklist Kiểm tra

### Visual Testing
- [ ] Skeleton hiển thị đúng structure
- [ ] Shimmer animation chạy mượt (1.5s loop)
- [ ] Không có layout shift khi chuyển từ skeleton sang real content
- [ ] Responsive design hoạt động đúng trên mobile/tablet/desktop

### CSS Variables
- [ ] `--skeleton-base` có thể override
- [ ] `--skeleton-shimmer` có thể override
- [ ] `--skeleton-title-height` có thể customize
- [ ] `--skeleton-format-height` có thể customize
- [ ] `--skeleton-author-height` có thể customize

### Animation
- [ ] Animation loop liên tục không giật lag
- [ ] Background gradient chạy từ phải qua trái
- [ ] Animation timing: 1.5s linear

### Responsive Design
- [ ] Desktop (>= 1024px): Full width thumbnail
- [ ] Tablet (768px - 1023px): Medium thumbnail
- [ ] Mobile (< 600px): Stack layout, centered content
- [ ] Small mobile (< 400px): Adjusted skeleton heights

## 🐛 Common Issues & Solutions

### Issue: Skeleton CSS không load
**Solution**: Đảm bảo file `yt-preview-card.css` tồn tại:
```
/src/styles/reusable-packages/yt-preview-card/yt-preview-card.css
```

### Issue: Animation không chạy
**Solution**: Check browser DevTools Console cho errors. Verify `@keyframes skeleton-loading` được định nghĩa.

### Issue: Layout shift khi chuyển từ skeleton sang real content
**Solution**: Kiểm tra heights của skeleton lines có match với real elements không.

## 📊 Expected Results

### Skeleton Structure
```html
<div class="yt-preview-card skeleton">
  <div class="yt-preview-thumbnail">
    <div class="skeleton-img"></div>
  </div>
  <div class="yt-preview-details">
    <div class="skeleton-line skeleton-title"></div>
    <div class="skeleton-line skeleton-format"></div>
    <div class="skeleton-line skeleton-author"></div>
  </div>
</div>
```

### Default Skeleton Heights
- **Title**: 22px (desktop), 21px (mobile), 19px (small mobile)
- **Format**: 26px (all sizes)
- **Author**: 18px (desktop), 17px (mobile), 16px (small mobile)

### Animation Specs
- **Duration**: 1.5s
- **Timing**: linear
- **Direction**: Right to left (200% → -200%)
- **Colors**:
  - Base: `#d7d7d7` (y2mate-new-ux uses `#f0f0f0`)
  - Shimmer: `#c7c7c7` (y2mate-new-ux uses `#e0e0e0`)

## 🔗 Related Files

- **Component**: `/packages/ui-components/src/PreviewCardSkeleton/index.ts`
- **CSS**: `/packages/ui-components/src/PreviewCardSkeleton/preview-card-skeleton.css`
- **Preview Card CSS**: `/apps/y2mate-new-ux/src/styles/reusable-packages/yt-preview-card/yt-preview-card.css`

## 📝 Notes

- Test file này sử dụng inline CSS skeleton để tránh dependency issues
- Trong production, skeleton CSS sẽ được import từ `@downloader/ui-components`
- Y2mate-new-ux sử dụng lighter skeleton colors so với các apps khác

## ✨ Next Steps

Sau khi verify skeleton hoạt động tốt:
1. Test trên các browsers khác nhau (Chrome, Firefox, Safari, Edge)
2. Test trên các devices thực (iPhone, iPad, Android)
3. Measure performance với Lighthouse
4. Deploy và test trên production environment
