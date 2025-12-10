# Conversion Modal Architecture - Technical Documentation

## Mục Lục
1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc Phân Tầng](#2-kiến-trúc-phân-tầng)
3. [Luồng Dữ Liệu](#3-luồng-dữ-liệu)
4. [5 Routing Cases](#4-5-routing-cases)
5. [Progress Tracking System](#5-progress-tracking-system)
6. [Module Ngoài](#6-module-ngoài-external-dependencies)
7. [Sai Lầm & Bài Học](#7-sai-lầm--bài-học)
8. [Lưu Ý Khi Refactor](#8-lưu-ý-khi-refactor)

---

## 1. Tổng Quan Hệ Thống

### 1.1 Mục Đích

Conversion Modal System xử lý việc download video/audio từ YouTube. Hệ thống phải xử lý nhiều tình huống khác nhau dựa trên:

- **Platform**: iOS, Windows, hay các platform khác
- **Format**: MP3 (audio) hay MP4 (video)
- **File Size**: Nhỏ (≤150MB) hay lớn (>150MB)
- **API Status**: `static` (link trực tiếp) hay `stream` (cần server xử lý)

### 1.2 Vấn Đề Cần Giải Quyết

Mỗi tổ hợp platform/format/size có cách xử lý khác nhau:
- iOS Safari không hỗ trợ download stream lớn trực tiếp
- Windows cần server merge video+audio cho MP4
- File nhỏ có thể download vào RAM trước
- File lớn cần polling API để theo dõi tiến trình server

### 1.3 Giải Pháp: Strategy Pattern

Thay vì một file monolithic với nhiều if/else, hệ thống sử dụng **Strategy Pattern**:
- Mỗi tình huống có một Strategy class riêng
- Controller chọn Strategy phù hợp dựa trên điều kiện
- Các Strategy share interface chung qua Base class

---

## 2. Kiến Trúc Phân Tầng

### 2.1 Tổng Quan 5 Tầng

```
┌─────────────────────────────────────────────┐
│           USER INTERFACE LAYER              │
│  Download Card → Modal → Progress Display   │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│           ORCHESTRATION LAYER               │
│  convert-logic.js → ConversionController    │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│            STRATEGY LAYER                   │
│  BaseStrategy → 4 Concrete Strategies       │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│         PROGRESS TRACKING LAYER             │
│  PollingProgressTracker / RAMProgressTracker│
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│          EXTERNAL MODULES LAYER             │
│  API Service / Polling Manager / State      │
└─────────────────────────────────────────────┘
```

### 2.2 Tầng 1: User Interface Layer

**Thành phần:**
- Download Card: Nút download trên UI chính
- Conversion Modal: Popup hiển thị tiến trình
- Progress Display: Text hiển thị % hoặc MB

**Trách nhiệm:**
- Nhận user click events
- Hiển thị trạng thái conversion
- Cập nhật progress text real-time

**File liên quan:**
- `conversion-modal.js`: Modal component

### 2.3 Tầng 2: Orchestration Layer

**Thành phần:**
- `convert-logic.js`: Entry point, public API
- `ConversionController.js`: Điều phối toàn bộ flow

**Trách nhiệm của convert-logic.js:**
- Export public functions cho UI gọi
- Lấy format data từ global state
- Khởi tạo Controller

**Trách nhiệm của ConversionController:**
- Mở modal ở đúng trạng thái
- Gọi Extract API
- Phát hiện routing case
- Chọn và khởi tạo Strategy phù hợp
- Điều phối communication giữa Modal và Strategy
- Xử lý cancel/abort

### 2.4 Tầng 3: Strategy Layer

**Thành phần:**
- `BaseStrategy.js`: Abstract base class
- `StaticDirectStrategy.js`: Case 1
- `IOSRamStrategy.js`: Case 2
- `PollingStrategy.js`: Case 3 & 4
- `OtherStreamStrategy.js`: Case 5

**Trách nhiệm của BaseStrategy:**
- Định nghĩa interface chung (method `execute()`)
- Cung cấp helper methods cho subclasses
- Lưu trữ common references (controller, extractResult, formatData)

**Trách nhiệm của Concrete Strategies:**
- Implement logic cụ thể cho từng case
- Quản lý progress tracking riêng
- Gọi các helper methods từ base class

### 2.5 Tầng 4: Progress Tracking Layer

**Thành phần:**
- `PollingProgressTracker.js`: Cho polling cases
- `RAMProgressTracker.js`: Cho RAM download
- `polling-progress-mapper.js`: Tính toán % hiển thị

**Trách nhiệm:**
- Theo dõi tiến trình download/conversion
- Map API progress sang display progress
- Đảm bảo progress không đi lùi
- Cung cấp text hiển thị phù hợp

### 2.6 Tầng 5: External Modules Layer

**Thành phần:**
- `downloader-lib-standalone/`: Business logic library
- `concurrent-polling.js`: Polling manager singleton
- `state.js`: Global state management

**Đặc điểm quan trọng:**
- Đây là các module KHÔNG nên modify khi refactor
- Chỉ gọi public API của chúng
- Tách biệt hoàn toàn với UI layer

---

## 3. Luồng Dữ Liệu

### 3.1 Luồng Chính: User Click → Download Ready

**Bước 1: User Interaction**
- User click download button trên card
- UI gọi `smartConvert(formatId)`

**Bước 2: Entry Point Processing**
- `convert-logic.js` nhận formatId
- Lấy formatData từ global state
- Xử lý format ID (case-insensitive, remove suffix)
- Khởi tạo ConversionController

**Bước 3: Controller Setup**
- Controller mở modal ở trạng thái EXTRACTING (spinner)
- Controller gọi Extract API với formatData

**Bước 4: Routing Decision**
- Extract API trả về response
- Controller phân tích response + platform + format + size
- Controller quyết định routing case (1-5)

**Bước 5: Strategy Execution**
- Controller khởi tạo Strategy tương ứng
- Controller gọi `strategy.execute()`
- Strategy thực hiện logic riêng

**Bước 6: Progress Updates**
- Strategy cập nhật progress qua Controller
- Controller forward đến Modal
- Modal update DOM

**Bước 7: Completion**
- Strategy hoàn thành, gọi `showSuccess()`
- Modal hiển thị download button
- User click để download file

### 3.2 Luồng Format Data

Format data đi qua nhiều layers và có thể biến đổi:

**Nguồn gốc:** Global state `videoDetail.formats`
- Có thể là Array: `[{id, type, quality, ...}, ...]`
- Có thể là Object: `{mp4: [...], mp3: [...]}`

**Biến đổi Format ID:**
- UI có thể thêm suffix: `video|mp4|1080p|direct`
- State lưu không suffix: `video|mp4|1080p`
- Case có thể khác: `MP4` vs `mp4`

**Xử lý:**
- Flatten object thành array nếu cần
- Normalize ID (lowercase, remove suffix)
- Case-insensitive matching

### 3.3 Luồng Progress Update

**Từ API đến UI:**
1. API trả về raw progress (videoProgress, audioProgress)
2. ProgressTracker map sang display progress
3. Strategy gọi `_updateProgress(data)`
4. BaseStrategy forward đến Controller
5. Controller gọi `modal.updateProgressText()`
6. Modal update DOM element

**Quy tắc quan trọng:**
- Progress KHÔNG BAO GIỜ đi lùi
- Luôn set initial progress NGAY khi transition
- Mỗi format có mapping khác nhau (MP3 vs MP4)

---

## 4. 5 Routing Cases

### 4.1 Case 1: Static Direct Download

**Điều kiện:**
- Extract API trả về `status = 'static'`
- Link download trực tiếp, không cần server xử lý

**Luồng xử lý:**
- Skip CONVERTING phase hoàn toàn
- Transition thẳng từ EXTRACTING → SUCCESS
- Hiển thị download button ngay

**Progress:** Không có (instant)

**File xử lý:** `StaticDirectStrategy.js`

### 4.2 Case 2: iOS RAM Download

**Điều kiện:**
- Platform là iOS
- Format là MP3
- Size ≤ 150MB
- Status = 'stream'

**Luồng xử lý:**
- Giữ EXTRACTING phase trong khi stream connect (Double EXTRACTING trick)
- Download stream vào RAM (blob)
- Transition sang CONVERTING khi first chunk đến
- Hiển thị progress dạng MB
- Khi xong, show "Download from RAM" button

**Progress:** "Converting... 45.3 / 150.0 MB"

**Trick quan trọng:** Double EXTRACTING
- Giữ spinner trong khi đợi stream connect
- Tránh hiển thị "0 MB" bị stuck
- Chỉ transition khi có data thật

**File xử lý:** `IOSRamStrategy.js`

### 4.3 Case 3: iOS Large Stream Polling

**Điều kiện:**
- Platform là iOS
- MP4 (bất kỳ size) HOẶC MP3 > 150MB
- Status = 'stream'

**Luồng xử lý:**
- Transition sang CONVERTING ngay
- Poll progressUrl để lấy tiến trình từ server
- Server merge video + audio
- Khi có mergedUrl, show download button

**Progress:** 5 layers (chi tiết ở Section 5)

**File xử lý:** `PollingStrategy.js`

### 4.4 Case 4: Windows MP4 Stream Polling

**Điều kiện:**
- Platform là Windows
- Format là MP4
- Status = 'stream'

**Luồng xử lý:** Giống Case 3

**Lý do:** Windows cũng cần server merge video + audio cho MP4

**File xử lý:** `PollingStrategy.js` (shared với Case 3)

### 4.5 Case 5: Other Stream

**Điều kiện:**
- Platform KHÔNG phải iOS và KHÔNG phải Windows
- Status = 'stream'

**Luồng xử lý:**
- Brief CONVERTING phase (100ms delay)
- Transition sang SUCCESS
- Show download button với stream URL

**Progress:** Không có (gần như instant)

**Lý do:** Các platform khác (Mac, Linux, Android) hỗ trợ stream download tốt

**File xử lý:** `OtherStreamStrategy.js`

### 4.6 Bảng Tổng Hợp

| Case | Platform | Format | Size | Progress Type |
|------|----------|--------|------|---------------|
| 1 | Any | Any | Any | None (instant) |
| 2 | iOS | MP3 | ≤150MB | MB-based |
| 3 | iOS | MP4/MP3 | >150MB | %-based (polling) |
| 4 | Windows | MP4 | Any | %-based (polling) |
| 5 | Other | Any | Any | None (instant) |

---

## 5. Progress Tracking System

### 5.1 Hai Loại Progress

**MB-based (RAM Download):**
- Dùng cho iOS RAM download
- Hiển thị: "Converting... X / Y MB"
- Real-time từ fetch chunks

**Percentage-based (Polling):**
- Dùng cho server-side processing
- Hiển thị: "Processing... X%"
- Gồm fake progress + real API progress

### 5.2 Polling Progress: 5 Layers

**Layer 1: Initial Fake (0% → 5%)**
- Thời gian: 200ms
- Mục đích: Feedback ngay lập tức khi transition
- Trigger: Ngay sau transitionToConverting()

**Layer 2: no_download (5% → 10%)**
- Trigger: API trả về `status = 'no_download'`
- Hành vi: +1% mỗi lần poll, max 10%
- Mục đích: Show activity khi server chưa bắt đầu

**Layer 3: Real Progress (10% → 60/90%)**
- Trigger: API trả về videoProgress/audioProgress > 0
- MP4: Map sang 10% → 90%
- MP3: Map sang 10% → 60%
- Công thức: `10 + (apiProgress / 100) × range`

**Layer 4: Merging (60/90% → 95%)**
- Trigger: Cả video và audio đều 100%
- MP4: Instant (merge rất nhanh)
- MP3: Time-based fake progress (merge chậm)

**Layer 5: Complete (95% → 100%)**
- Trigger: API trả về mergedUrl
- Animation nhanh 100ms đến 100%
- Sau đó show download button

### 5.3 Mapping Progress cho MP3 vs MP4

**Cả MP4 và MP3 dùng cùng công thức:**
- Processing phase: 10% → 95% (85% range)
- Công thức: `displayPercent = 10 + (apiPercent / 100) * 85`

**Khác biệt ở Merging phase:**
- **MP4:** Merging instant (<500ms), không cần fake progress
- **MP3:** Merging chậm (60-150s), cần time-based fake progress từ 60% → 95%

### 5.4 Quy Tắc Quan Trọng

1. **Progress không bao giờ đi lùi**
   - Luôn check: newProgress > currentProgress
   - Nếu API trả về progress nhỏ hơn → giữ nguyên

2. **Set initial text ngay lập tức**
   - Ngay sau transition, set "Preparing... 0%"
   - Không để empty state dù chỉ 1 giây

3. **Sync progress giữa tracker và mapper**
   - Khi no_download phase kết thúc ở 10%
   - Real progress phase phải biết bắt đầu từ 10%

---

## 6. Module Ngoài (External Dependencies)

### 6.1 downloader-lib-standalone

**Vị trí:** `src/script/libs/downloader-lib-standalone/`

**Vai trò:** Business logic layer, KHÔNG có DOM manipulation

**Key exports:**
- `createVerifiedService()`: Tạo API service instance
- `downloadStreamToRAM()`: Download stream vào blob
- `findFormatById()`: Tìm format trong constants

**API methods quan trọng:**
- `service.extractV2_stream()`: Gọi extract API
- `service.pollProgress()`: Poll progress URL

**Tại sao tách riêng:**
- Pure business logic, test được độc lập
- Reuse ở project khác
- Clean separation of concerns

### 6.2 ConcurrentPollingManager

**Vị trí:** `src/script/features/downloader/concurrent-polling.js`

**Vai trò:** Singleton quản lý tất cả polling operations

**Key features:**
- Max 5 concurrent polls
- Poll interval: 1 giây
- Auto timeout: 10 phút
- Cleanup on page unload

**Cách access:** Qua getter function `getPollingManager()`

**Tại sao dùng Singleton:**
- Kiểm soát concurrent requests
- Tránh memory leaks từ multiple intervals
- Centralized cleanup

### 6.3 State Management

**Vị trí:** `src/script/features/downloader/state.js`

**Vai trò:** Global state cho conversion tasks

**Key functions:**
- `setConversionTask()`: Tạo task mới
- `updateConversionTask()`: Update task
- `getConversionTask()`: Lấy task data

**State shape của một task:**
- state: Converting / Success / Failed / Canceled
- downloadUrl: URL để download
- ramBlob: Blob nếu download vào RAM
- filename: Tên file
- formatData: Original format data

### 6.4 Quy Tắc Quan Trọng

**KHÔNG modify external modules khi refactor conversion:**
- Chỉ gọi public API
- Nếu cần feature mới, thêm vào module đó riêng
- Test module đó riêng lẻ

---

## 7. Sai Lầm & Bài Học

### 7.1 Nhầm V1 vs V2 Architecture

**Mô tả:** Implement V1 polling flow (gọi convert API → poll checkTask) trong khi project dùng V2 (extract API đã trả về progressUrl)

**Hậu quả:** API 400 errors, logic không hoạt động

**Bài học:**
- LUÔN đọc file backup trước khi implement
- Hiểu rõ API contract hiện tại
- Không assume dựa trên tên function

### 7.2 Import Path Sai Số Level

**Mô tả:** Import từ strategies/ folder thiếu 1 level `../`

**Hậu quả:** Build fail, module not found

**Bài học:**
- Đếm kỹ folder levels
- Build ngay sau mỗi import change
- Path từ strategies/ đến libs/ là 4 levels: `../../../../`

### 7.3 formats Object vs Array

**Mô tả:** Assume `videoDetail.formats` là array, nhưng có thể là object

**Hậu quả:** TypeError: formats.find is not a function

**Bài học:**
- Check data type trước khi dùng methods
- Handle cả object và array cases
- Log data structure khi debug

### 7.4 Case Sensitivity trong Format ID

**Mô tả:** Exact match format ID fail vì case khác nhau

**Hậu quả:** Format not found dù ID đúng

**Bài học:**
- Normalize ID trước khi compare (lowercase)
- Handle suffix như `|direct`
- ID có thể biến đổi qua các layers

### 7.5 UI Delay - Empty Progress Text

**Mô tả:** Transition sang CONVERTING nhưng không set initial text, đợi 1s cho polling response

**Hậu quả:** User thấy empty progress 1 giây

**Bài học:**
- Set initial text NGAY sau transition
- Không để empty states
- User perception matters

### 7.6 Singleton Access Pattern Sai

**Mô tả:** Import class và gọi static method thay vì import getter function

**Hậu quả:** TypeError: getInstance is not a function

**Bài học:**
- Check export type trước khi import
- Đọc file export để biết đúng pattern

### 7.7 Missing Base Class Methods

**Mô tả:** Strategy gọi method không tồn tại trong base class

**Hậu quả:** TypeError: not a function

**Bài học:**
- Check base class trước khi gọi protected methods
- Thêm method vào base class nếu nhiều strategies cần

---

## 8. Lưu Ý Khi Refactor

### 8.1 Trước Khi Bắt Đầu

- Đọc file backup để hiểu logic cũ
- Đọc API documentation để hiểu data flow
- Map dependencies giữa các modules
- Identify external modules (không modify)
- Check feature flags trong environment.js

### 8.2 Trong Quá Trình Refactor

- Build thường xuyên để catch import errors sớm
- Test từng strategy riêng lẻ
- Log data structures khi không chắc chắn
- Preserve old code trong backup file
- Không delete code trước khi test code mới

### 8.3 Checklist Trước Khi Hoàn Thành

- [ ] Tất cả 5 routing cases đã test
- [ ] Progress hiển thị đúng cho mỗi case
- [ ] Cancel/abort hoạt động
- [ ] Error handling hoạt động
- [ ] Không có console errors
- [ ] Build succeeds
- [ ] Memory leaks checked (blob cleanup, interval cleanup)

### 8.4 Common Gotchas

1. **Async timing**: Đợi transition hoàn tất trước khi update UI
2. **Cleanup on unmount**: Clear intervals, abort controllers
3. **State corruption**: Check null trước khi access
4. **Event listener leaks**: Remove listeners on cleanup
5. **Blob memory**: Revoke URLs, null references sau khi dùng

### 8.5 Testing Strategy

**Test mỗi case thủ công:**

- Case 1 (Static): Tìm video có status='static', click download
- Case 2 (iOS RAM): Dùng iOS simulator, download MP3 nhỏ
- Case 3 (iOS Polling): iOS, download MP4 hoặc MP3 lớn
- Case 4 (Windows Polling): Windows, download MP4
- Case 5 (Other): Mac/Linux/Android, download stream

**Verify cho mỗi test:**
- Modal mở đúng phase
- Progress hiển thị đúng format
- Download button xuất hiện
- File download thành công
- Cancel hoạt động giữa chừng

---

## Appendix: Quick Reference

### A. File Locations

| File | Vai trò |
|------|---------|
| `convert-logic.js` | Entry point |
| `conversion/ConversionController.js` | Orchestrator |
| `conversion/routing.js` | Platform detection |
| `conversion/strategies/BaseStrategy.js` | Base class |
| `conversion/strategies/*Strategy.js` | Concrete strategies |
| `conversion/progress/*Tracker.js` | Progress tracking |
| `conversion-modal.js` | UI Modal |
| `concurrent-polling.js` | Polling manager |
| `state.js` | Global state |

### B. Modal States

| Status | Phase | Hiển thị |
|--------|-------|----------|
| CONVERTING | EXTRACTING | Spinner + "Extracting..." |
| CONVERTING | CONVERTING | Progress text |
| SUCCESS | - | Download button |
| ERROR | - | Error message + Retry |
| EXPIRED | - | Expired message + Retry |

### C. Strategy Selection

| Condition | Strategy |
|-----------|----------|
| status = 'static' | StaticDirectStrategy |
| iOS + MP3 + ≤150MB | IOSRamStrategy |
| iOS + (MP4 or >150MB) | PollingStrategy |
| Windows + MP4 | PollingStrategy |
| Other platform + stream | OtherStreamStrategy |

---
