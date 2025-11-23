# B3: Click Convert Button & Show Modal

## Tổng Quan

Tài liệu này mô tả flow hoàn chỉnh từ khi user click nút "Convert" trên format item đến khi modal hiện và xử lý conversion.

## Mục Tiêu

- Ghép logic click convert button với việc show modal
- Xử lý đầy đủ các states: EXTRACTING → CONVERTING → SUCCESS/ERROR/EXPIRED
- Scope: Chỉ YouTube (không có social media platforms khác)

---

## 1. Yêu Cầu HTML

### 1.1 Container cho Modal

Thêm element `#progressBarWrapper` vào `index.html` - đây là wrapper cho conversion modal:

```html
<!-- Conversion Modal Wrapper -->
<div id="progressBarWrapper" class="conversion-modal-wrapper"></div>
```

**Vị trí đặt**: Cuối `<body>`, trước các script tags.

### 1.2 Các Elements Đã Có Sẵn

- `.btn-convert` - Nút convert trên mỗi format item
- `#downloadOptionsContainer` - Container chứa format options
- `.quality-item` - Mỗi format item row

---

## 2. CSS Requirements

### 2.1 Import CSS

Đảm bảo `conversion-modal.css` được import trong main styles:

```
/src/styles/reusable-packages/conversion-modal/conversion-modal.css
```

### 2.2 CSS Classes Chính

Modal sử dụng các classes sau:

| Class | Mô tả |
|-------|-------|
| `.conversion-modal-wrapper` | Overlay backdrop |
| `.conversion-modal-content` | Container chính của modal |
| `.conversion-modal-header` | Header với title và close button |
| `.conversion-modal-body` | Body với state-specific content |
| `.conversion-modal-footer` | Footer với social share icons |
| `.conversion-state--extracting` | State khi đang extract |
| `.conversion-state--converting` | State khi đang convert |
| `.conversion-state--success` | State khi thành công |
| `.conversion-state--error` | State khi lỗi |
| `.conversion-state--expired` | State khi link hết hạn |

---

## 3. Architecture Flow

### 3.1 Luồng Tổng Quan

```
User Click "Convert" Button
         ↓
download-rendering.ts: handleDownloadClick()
         ↓
Dynamic import convert-logic-v2.ts
         ↓
startConversion() được gọi
         ↓
Modal open với state EXTRACTING
         ↓
API call: api.downloadYouTube()
         ↓
Modal transition → CONVERTING (với progress bar)
         ↓
Strategy execution (Polling/Direct/Stream)
         ↓
Modal transition → SUCCESS / ERROR / EXPIRED
```

### 3.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    download-rendering.ts                     │
│  - attachDownloadListeners() - event delegation             │
│  - handleDownloadClick() - entry point                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ dynamic import
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    convert-logic-v2.ts                       │
│  - startConversion() - main orchestrator                    │
│  - extractFormat() - API calls                              │
│  - cancelConversion() - abort handling                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ uses
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    conversion-modal.ts                       │
│  - ConversionModal class                                    │
│  - open(), close(), transition methods                      │
│  - Event dispatch (cancel, download, retry)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ events
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                  conversion-controller.ts                    │
│  - initConversionController()                               │
│  - Event listeners: cancel, download, retry, modal-closed   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Chi Tiết Implementation

### 4.1 Entry Point: handleDownloadClick

**File**: `download-rendering.ts` (line 735-789)

Flow:
1. Get `formatId` từ button `data-format-id`
2. Check nếu là YouTube URL
3. Extract format data từ state
4. Dynamic import `convert-logic-v2.ts`
5. Call `startConversion()` với params

### 4.2 Main Orchestrator: startConversion

**File**: `convert-logic-v2.ts` (line 47-123)

Params interface:
```typescript
interface ConversionParams {
  formatId: string;
  formatData: FormatData;
  videoTitle: string;
  videoUrl: string;
}
```

Flow:
1. Setup AbortController
2. Initialize task state via `setConversionTask()`
3. Open modal với state EXTRACTING
4. Call `extractFormat()` - API call
5. Determine routing strategy
6. Transition modal → CONVERTING
7. Create and execute strategy
8. Handle result (SUCCESS/ERROR)

### 4.3 Modal States

**File**: `conversion-modal.ts`

| State | Description | UI |
|-------|-------------|-----|
| `EXTRACTING` | Phase 1 - Đang lấy download URL | Spinner, no progress bar |
| `CONVERTING` | Phase 2 - Đang convert/download | Progress bar với animation |
| `SUCCESS` | Hoàn thành | Download button |
| `ERROR` | Lỗi xảy ra | Error message + Retry button |
| `EXPIRED` | Link hết hạn (25 phút) | Expired message + Retry button |

### 4.4 Event System

Modal dispatch các custom events lên window:

| Event | Khi nào | Detail |
|-------|---------|--------|
| `conversion:modal-opened` | Modal mở | formatId, status, videoTitle |
| `conversion:modal-closed` | Modal đóng | formatId |
| `conversion:cancel` | User click cancel/X | formatId |
| `conversion:download` | User click download | formatId, downloadUrl |
| `conversion:retry` | User click retry | formatId, previousError |

### 4.5 Controller Event Handling

**File**: `conversion-controller.ts`

Init function được gọi 1 lần để wire events:

```typescript
initConversionController()
```

Event handlers:
- `handleCancelEvent` → `cancelConversion()`
- `handleDownloadEvent` → `handleDownloadClick(formatId)`
- `handleRetryEvent` → Re-trigger `startConversion()`
- `handleModalClosedEvent` → `clearSocialMediaCache()` (chỉ social media)

---

## 5. Integration Checklist

### 5.1 HTML Setup

- [ ] Thêm `<div id="progressBarWrapper"></div>` vào index.html
- [ ] Đảm bảo element nằm cuối body

### 5.2 CSS Verification

- [ ] conversion-modal.css được import
- [ ] progress-bar.css được import (nếu cần)

### 5.3 JavaScript Initialization

- [ ] `initConversionController()` được gọi trong app init
- [ ] `attachDownloadListeners()` được gọi sau render format options

### 5.4 Assets

Social icons đã có sẵn tại `/public/assest/social-icon/`:
- facebook.svg
- whats_app.png
- x-circal.png
- reddit.png
- linkedin.png

---

## 6. Testing Scenarios

### 6.1 Happy Path

1. User click nút "Convert" trên format item
2. Modal mở với EXTRACTING state (spinner)
3. Modal transition sang CONVERTING (progress bar)
4. Modal transition sang SUCCESS
5. User click "Download Now"
6. File được download

### 6.2 Error Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| API timeout | Modal → ERROR với message |
| Network error | Modal → ERROR với "Network error" |
| User click cancel | Modal đóng, conversion abort |
| User press Escape | Modal đóng |
| Click overlay | Pulse animation (không đóng) |

### 6.3 Expired Link

1. User convert thành công
2. Đợi > 25 phút
3. User click "Download Now" lần nữa
4. Modal → EXPIRED với option Retry

---

## 7. Code Reference

### Files Liên Quan

| File | Purpose |
|------|---------|
| `download-rendering.ts` | Entry point khi click button |
| `convert-logic-v2.ts` | Main conversion orchestrator |
| `conversion-modal.ts` | Modal UI class |
| `conversion-controller.ts` | Event wiring |
| `conversion-state.ts` | State management |
| `progress-bar-manager.ts` | Progress bar logic |

### Key Functions

| Function | File | Description |
|----------|------|-------------|
| `handleDownloadClick` | download-rendering.ts:735 | Entry point |
| `startConversion` | convert-logic-v2.ts:47 | Main orchestrator |
| `extractFormat` | convert-logic-v2.ts:160 | API call |
| `getConversionModal` | conversion-modal.ts:689 | Get singleton |
| `initConversionController` | conversion-controller.ts:102 | Init events |

---

## 8. Notes

### 8.1 Singleton Pattern

ConversionModal sử dụng singleton:
```typescript
let modalInstance: ConversionModal | null = null;

export function getConversionModal(): ConversionModal {
  if (!modalInstance) {
    modalInstance = new ConversionModal('#progressBarWrapper');
  }
  return modalInstance;
}
```

### 8.2 Abort Handling

- AbortController được tạo cho mỗi conversion
- Khi user cancel, `abortController.abort()` được gọi
- API calls listen trên `abortSignal`

### 8.3 Strategy Pattern

Conversion sử dụng strategy pattern cho các routing khác nhau:
- PollingStrategy: Khi API trả về progressUrl
- StaticDirectStrategy: Khi có direct URL
- IOSRamStrategy: Cho iOS devices
- OtherStreamStrategy: Cho streaming download

---

## 9. Troubleshooting

### Modal không hiện

1. Check `#progressBarWrapper` tồn tại trong DOM
2. Check CSS `visibility` và `opacity`
3. Console log trong `ConversionModal.open()`

### Progress bar không chạy

1. Verify `transitionToConverting()` được gọi
2. Check `ProgressBarManager` initialization
3. Verify `.conversion-progress` element exists

### Events không fire

1. Verify `initConversionController()` được gọi
2. Check event listeners trong DevTools
3. Verify events bubble lên window
