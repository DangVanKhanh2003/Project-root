# Conversion Progress Architecture - YouTube Download Flow

## Overview

Kiến trúc hiển thị progress cho quá trình convert và download video YouTube, được chia thành 2 phase rõ ràng với UI/UX tối ưu.

---

## 🏗️ Architecture: 2-Phase System

### Phase 1: EXTRACTING (Extract Metadata)

**Mục đích:** Gọi API để extract thông tin video (URL, size, format, etc.)

**UI Display:**
- ✅ Spinning circle animation
- ✅ Text: "Extracting..."
- ✅ Sub-text: "Preparing your download"
- ❌ KHÔNG có progress bar
- ❌ KHÔNG có percentage

**Duration:** Thường 1-3 giây

**Flow:**
1. User clicks "Convert" button
2. Modal mở với status = 'EXTRACTING'
3. Show spinning circle
4. Call extract API
5. Khi API trả về → transition sang Phase 2

---

### Phase 2: CONVERTING (Download/Process)

**Mục đích:** Download file hoặc polling conversion progress

**UI Display:**
- ❌ KHÔNG có spinning circle
- ✅ Progress bar
- ✅ Progress text (% hoặc MB/GB)
- ✅ Title: "Converting Video..."

**Duration:** Từ vài giây đến vài phút tùy file size

**Chia làm 2 sub-types:**

---

## 📊 Phase 2 Sub-Types

### Sub-Type 1: RAM Download (Direct Stream)

**Khi nào:** iOS stream file ≤150MB

**Hiển thị format:**
```
Downloading... 0 MB / 150 MB
Downloading... 13 MB / 150 MB
Downloading... 45 MB / 150 MB
Downloading... 150 MB / 150 MB
Download complete 100%
```

**Quy tắc hiển thị:**
- Hiển thị MB hoặc GB (tự động switch khi ≥1GB)
- KHÔNG hiển thị percentage (%)
- Số MB được làm tròn LÊN (Math.ceil)
- Total size: min = 1 MB
- Loaded size: có thể = 0 MB (khi mới bắt đầu)

**Progress calculation:**
- Real-time từ fetch stream
- Progress = (loaded / total) × 100
- Update mỗi khi nhận data chunk

**Fallback mechanism:**
1. Ưu tiên: content-length header từ fetch
2. Fallback: size từ extract API response
3. Nếu cả 2 = 0: Indeterminate mode (chỉ show loaded, không show total)

**Edge case - Indeterminate:**
```
Downloading... 13 MB
Downloading... 45 MB
Downloading... 150 MB
Download complete 100%
```

---

### Sub-Type 2: Polling Download (Server-side Processing)

**Khi nào:**
- iOS stream file >150MB
- Windows MP4 (bất kỳ size)
- Các format cần server convert

**Hiển thị format:**
```
Processing... 0%
Processing... 27%
Processing... 45%
Processing... 90%  (MP4) hoặc 60% (MP3)
Merging... 91%
Merging... 95%
Merging... 98%  (max, chờ API confirm)
Ready 100%  (khi có mergedUrl)
```

**Quy tắc hiển thị:**
- Hiển thị percentage (%)
- Text có dấu 3 chấm: "Processing..." hoặc "Merging..."
- KHÔNG hiển thị MB/GB

---

## 🎯 Polling Progress Algorithm

### Format-Specific Allocation

**MP4 (Video):**
- Processing phase: **90%** (0% → 90%)
- Merging phase: **10%** (90% → 98% max)
- Rationale: MP4 container muxing rất nhanh (<500ms)

**MP3 (Audio):**
- Processing phase: **60%** (0% → 60%)
- Merging phase: **40%** (60% → 98% max)
- Rationale: MP3 audio encoding chậm (60-150s tùy file size)

### Processing Phase (Real API Progress)

**Calculation:**
- Input: videoProgress, audioProgress từ API
- Weighted average: (videoProgress × 80%) + (audioProgress × 20%)
- Map to display: weightedProgress × processingWeight

**For MP4:**
- API progress 0-100% → Display 0-90%
- Example: API 50% → Display 45%

**For MP3:**
- API progress 0-100% → Display 0-60%
- Example: API 50% → Display 30%

**Transition condition:**
- Khi videoProgress ≥ 100% AND audioProgress ≥ 100%
- → Chuyển sang Merging phase

### Merging Phase (Estimated Progress)

**Algorithm:**
- Time-based animation (không dựa trên API)
- Easing function: easeOutCubic for smooth feel
- Formula: progress = 1 - (1 - t)³

**Duration calculation (MB-based):**

**MP4:**
- Duration = 500ms (instant, không cần estimate)

**MP3:**
- File 150-250MB: 60 seconds
- File 250-450MB: 100 seconds
- File 450MB+: 150 seconds

**Progress range:**

**MP4:**
- 90% → 98% trong ~500ms
- Cap at 98% until mergedUrl received

**MP3:**
- 60% → 98% trong 60-150s (tùy file size)
- Cap at 98% until mergedUrl received

**Max Progress Cap:**
- KHÔNG BAO GIỜ vượt quá 98% nếu chưa có mergedUrl
- CHỈ nhảy lên 100% khi API trả về mergedUrl
- Rationale: Đảm bảo user biết quá trình chưa hoàn thành

---

## ✨ UI/UX Enhancements

### Smooth Animation

**Vấn đề:** Progress nhảy cóc từ 27% lên 45% làm user shock

**Giải pháp:** Tween animation

**Mechanism:**
- Khi có update progress mới: animate từ current → target
- Duration = (targetProgress - currentProgress) × 30ms
- Max duration = 1000ms
- Easing: easeOutCubic
- Cancel animation cũ nếu có update mới

**Behavior:**
- Forward progress: smooth animation
- Backward/same progress: no animation (instant update)

**Example:**
```
Current: 27%
New target: 45%
Delta: 18%
Animation: 540ms (18 × 30)
Visual: 27% → 28% → 29% → ... → 45% (smooth)
```

### Text Formatting

**Polling:**
- Format: `Processing... 27%`
- Có dấu 3 chấm (...)
- Có space trước %

**RAM Download (known total):**
- Format: `Downloading... 13 MB / 150 MB`
- KHÔNG có %
- Space trước unit (MB/GB)

**RAM Download (unknown total):**
- Format: `Downloading... 13 MB`
- KHÔNG có total
- KHÔNG có %

**Completion:**
- Polling: `Ready 100%`
- RAM: `Download complete 100%`

### Size Display Rules

**Rounding:**
- Sử dụng Math.ceil (làm tròn LÊN)
- 13.2 MB → 14 MB
- 0.8 MB → 1 MB

**Minimum values:**
- Total size: min = 1 MB hoặc 1 GB
- Loaded size: có thể = 0 MB

**Unit switching:**
- < 1 GB: hiển thị MB
- ≥ 1 GB: hiển thị GB
- Auto detect và switch cho cả loaded và total

**Examples:**
- 0 bytes loaded: `0 MB`
- 500 KB loaded: `1 MB` (rounded up)
- 13.7 MB loaded: `14 MB`
- 1.2 GB loaded: `2 GB`

---

## 🔄 State Transitions

### Modal States

1. **EXTRACTING**
   - Spinning circle active
   - No progress bar
   - Text: "Extracting..."

2. **CONVERTING**
   - No spinning circle
   - Progress bar active
   - Text: "Converting Video..."
   - Sub-states: Processing/Downloading → Merging/Complete

3. **SUCCESS**
   - No animations
   - Download button visible
   - Text: "Ready to Download"

4. **ERROR**
   - No animations
   - Error message
   - Retry button

5. **EXPIRED**
   - No animations
   - Expiry message
   - Re-convert button

### Transition Flow

```
User clicks Convert
    ↓
Open modal → EXTRACTING
    ↓
Call extract API
    ↓
Extract complete → CONVERTING
    ↓
Determine route:
    ├─ Static/Direct → Direct download (no modal update)
    ├─ iOS ≤150MB → RAM download (show MB progress)
    ├─ iOS >150MB → Polling (show % progress)
    └─ Windows MP4 → Polling (show % progress)
    ↓
Progress reaches 100%
    ↓
Transition to SUCCESS
    ↓
Show download button
```

---

## 🔧 Technical Implementation Notes

### ProgressBarManager API

**Phase 2 Methods:**

**For RAM download:**
- `startDownloadingPhase(options)` - Initialize with totalSize
- Auto-update via callback: `onProgress(loaded, total)`
- Display format: MB/GB without %

**For Polling:**
- `startPollingPhase()` - Initialize at 0%
- `updatePollingProgress(progress, statusText)` - Update with smooth animation
- `completePollingPhase(callback)` - Animate to 100%

**Removed methods (old API):**
- `startExtractPhase()` - Không còn dùng
- `completeExtractToFull()` - Không còn dùng
- `resumeToDownloadPhase()` - Không còn dùng

### ConversionModal API

**New methods:**
- `transitionToConverting()` - Chuyển từ EXTRACTING sang CONVERTING
- Tự động initialize progress bar khi transition

**States:**
- `EXTRACTING` - Phase 1
- `CONVERTING` - Phase 2
- `SUCCESS`, `ERROR`, `EXPIRED` - End states

### PollingProgressMapper API

**Static methods:**
- `reset(format, fileSizeMB)` - Initialize với format-specific weights
- `mapProgress(apiData)` - Convert API data → display progress
- `getStatusText(apiData)` - Get display text ("Processing..." / "Merging...")
- `getCurrentPhase()` - Get current phase ('processing' / 'merging')
- `startMergingPhase()` - Manual transition (for testing)

**Auto behavior:**
- Tự động detect phase transition khi progress = 100%
- Tự động calculate weights dựa trên format
- Tự động cap progress at 98% until mergedUrl

---

## 📋 Edge Cases Handling

### Case 1: No Content-Length Header

**Problem:** Fetch không trả về content-length

**Solution:**
1. Fallback to size từ extract API
2. Nếu cả 2 = 0 → Indeterminate mode
3. Display: `Downloading... 13 MB` (no total)

### Case 2: Progress Goes Backward

**Problem:** API trả về progress nhỏ hơn current

**Solution:**
- No animation
- Instant update to new value
- Rare case, usually API error

### Case 3: Progress Stuck at 98%

**Expected behavior:**
- Progress CAP at 98% until mergedUrl received
- NOT a bug, it's by design
- User knows conversion not complete yet

### Case 4: Very Fast Downloads

**Problem:** File download trong <500ms

**Solution:**
- Animation vẫn chạy smooth
- Min animation duration = 0ms
- Max animation duration = 1000ms
- User vẫn thấy progress flow

### Case 5: Multiple Simultaneous Downloads

**Behavior:**
- Mỗi download có modal riêng
- Mỗi modal có progress bar riêng
- Độc lập, không ảnh hưởng nhau

---

## ✅ Success Criteria

### User Experience
- [ ] User thấy rõ 2 phases: Extract → Convert
- [ ] Progress chạy smooth, không nhảy cóc
- [ ] Text clear và descriptive
- [ ] Không bao giờ stuck at 100% mà không có action

### Technical Requirements
- [ ] No spinning circle trong CONVERTING phase
- [ ] Progress animation duration = delta × 30ms (max 1s)
- [ ] Size rounding: Math.ceil, min total = 1 MB
- [ ] Polling: cap at 98% until mergedUrl
- [ ] Format-specific weights: MP4 (90/10), MP3 (60/40)

### Edge Cases
- [ ] Handle no content-length gracefully
- [ ] Handle unknown total size (indeterminate)
- [ ] Handle backward progress (no animation)
- [ ] Handle very fast downloads (<500ms)

---

## 🚫 Common Mistakes to Avoid

### Mistake 1: Hiển thị % khi show MB
❌ Wrong: `Downloading... 13 MB / 150 MB 8%`
✅ Correct: `Downloading... 13 MB / 150 MB`

### Mistake 2: Spinning circle trong CONVERTING
❌ Wrong: Show spinning circle + progress bar
✅ Correct: Chỉ progress bar, không spinning circle

### Mistake 3: Progress nhảy cóc
❌ Wrong: 27% → 45% instant jump
✅ Correct: 27% → 28% → 29% → ... → 45% smooth

### Mistake 4: Total size = 0 MB
❌ Wrong: `Downloading... 13 MB / 0 MB`
✅ Correct: `Downloading... 13 MB` (indeterminate)

### Mistake 5: Progress > 98% without mergedUrl
❌ Wrong: Progress 99% or 100% khi chưa có mergedUrl
✅ Correct: Cap at 98%, only jump to 100% when mergedUrl exists

### Mistake 6: Hardcode weights
❌ Wrong: Luôn dùng 60/40 cho mọi format
✅ Correct: MP4 = 90/10, MP3 = 60/40 (dynamic)

### Mistake 7: Không fallback cho total size
❌ Wrong: Nếu content-length = 0 thì crash
✅ Correct: Fallback to extract API size, then indeterminate

---

## 📖 Summary

### Key Principles

1. **2-Phase Separation:** EXTRACTING (spinner) vs CONVERTING (progress bar)
2. **Clear Visual Feedback:** User luôn biết đang ở phase nào
3. **Format-Specific Logic:** MP4 khác MP3 về timing và weights
4. **Smooth Animations:** Không nhảy cóc, mượt mà
5. **Defensive Programming:** Handle edge cases gracefully
6. **User-Centric:** 98% cap để user biết chưa xong

### Architecture Benefits

- **Maintainable:** Clear separation of concerns
- **Scalable:** Dễ thêm format mới (chỉ cần add weights)
- **User-friendly:** Smooth animations, clear states
- **Robust:** Handle edge cases without crashes
- **Performant:** Efficient animation với easing

---

## 🔗 Related Files

**Core Logic:**
- `convert-logic.ts` - Main business logic
- `conversion-controller.ts` - Event wiring

**UI Components:**
- `conversion-modal.ts` - Modal UI
- `progress-bar-manager.ts` - Progress bar logic

**Utilities:**
- `polling-progress-mapper.ts` - Polling algorithm
- `download-stream.ts` - Stream download handler

**Note:** Đây là document hướng dẫn, KHÔNG chứa code implementation. Tham khảo các file trên để xem chi tiết code.
