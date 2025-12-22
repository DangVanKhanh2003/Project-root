# Y2MATE-NEW-UX - Project Documentation

## 📋 Tổng Quan Project

### Nguồn Gốc
Project **y2mate-new-ux** được clone từ **y2matepro** với mục tiêu thay đổi hoàn toàn UX flow để tối ưu trải nghiệm người dùng cho việc download YouTube videos.

### Sự Khác Biệt Giữa 2 Projects

| Khía Cạnh | y2matepro (Old) | y2mate-new-ux (New) |
|-----------|-----------------|---------------------|
| **Format Selection** | Chọn format SAU khi submit URL | Chọn format TRƯỚC khi submit URL |
| **UI Flow** | Submit → Show formats list → Click convert → Download | Select format → Submit → Auto download |
| **Preview Card** | video-info-card (2-column layout với list formats) | yt-preview-card (simple preview: thumbnail + title + badge) |
| **Modal** | ConversionModal hiển thị progress | ❌ Không có modal (removed) |
| **API Calls** | extractMediaDirect → Get formats list → User select → downloadYouTube | ❌ Bỏ extractMediaDirect, chỉ gọi downloadYouTube |

---

## 🎯 Mục Tiêu Project

### 1. Simplified UX Flow
**Vấn đề cũ:** User phải submit URL → đợi load formats → chọn format → click convert → đợi download
**Giải pháp mới:** User chọn format trước (FormatSelector) → submit URL → tự động download luôn

### 2. Faster User Experience
- **Giảm số bước:** Từ 4 bước xuống 2 bước
- **Giảm API calls:** Từ 2 calls (extractMediaDirect + downloadYouTube) xuống 1 call (chỉ downloadYouTube)
- **No modal interruption:** Download trực tiếp không cần modal popup

### 3. Clean Architecture
- Tái sử dụng 100% base controller/strategy từ y2matepro
- Không viết lại logic conversion/download
- Chỉ thay đổi UI flow và input handling

---

## 🏗️ Kiến Trúc & Logic Flow

### Flow Cũ (y2matepro)
```
1. User submit URL
2. Show skeleton loading
3. Call api.extractMediaDirect() → Get formats list
4. Render video-info-card with formats list (1080p, 720p, MP3-128kbps, etc.)
5. User click "Convert" button on specific format
6. extractFormatDataFromState() → Build formatData from clicked format
7. startConversion(formatData)
   → Open ConversionModal
   → extractFormat() calls api.downloadYouTube()
   → Execute strategy (polling/direct/RAM)
   → Show success in modal
   → User clicks "Download" button in modal
8. Trigger browser download
```

### Flow Mới (y2mate-new-ux)
```
1. User select format từ FormatSelector (MP4-720p, MP3-128kbps, etc.)
2. User submit URL
3. Show skeleton loading (300ms)
4. handleAutoDownload():
   a. Read FormatSelector state (selectedFormat, videoQuality, audioFormat, audioBitrate)
   b. Build formatData với extractV2Options:
      - Video: { downloadMode: 'video', videoQuality: '720', youtubeVideoContainer: 'mp4' }
      - Audio: { downloadMode: 'audio', audioBitrate: '128', audioFormat: 'mp3' }
   c. Call startConversion(formatData)
5. startConversion() (reuse from y2matepro base):
   → ❌ NO modal (removed)
   → extractFormat() calls api.downloadYouTube()
   → Execute strategy (same as y2matepro)
   → ??? (Chưa có UI hiển thị progress/success)
6. ??? (Chưa xử lý trigger download)
```

### Các Component Đã Thay Đổi

#### 1. FormatSelector Component (NEW)
**File:** `src/ui-components/format-selector/`

**Chức năng:**
- Component mới cho phép user chọn format/quality TRƯỚC khi submit
- 2 tabs: Video (MP4) và Audio (MP3, OGG, WAV, Opus, M4A)
- Video qualities: 1080p, 720p, 480p, 360p, 240p, 144p
- Audio formats:
  - MP3: 64kbps, 128kbps, 192kbps, 256kbps, 320kbps
  - M4A, OGG, WAV, Opus: Không có bitrate selector (default 128kbps)

**State Management:**
- `format-selector-state.ts`: Quản lý selectedFormat, videoQuality, audioFormat, audioBitrate
- State này được đọc bởi `handleAutoDownload()` để build formatData

#### 2. Preview Card (REPLACED)
**Old:** `video-info-card` (2-column layout với formats list)
**New:** `yt-preview-card` (simple preview)

**Cấu trúc:**
```
┌─────────────────────────────────────┐
│ [Thumbnail 16:9]  │ Video Title     │
│                   │ [MP4] [720p]    │
│                   │ Channel Name    │
└─────────────────────────────────────┘
```

**Metadata:**
- Thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
- Title + Author: Fetch từ YouTube oEmbed API (coreServices.youtubePublicApi)
- Format badge: Từ FormatSelector state
- Quality info: Từ FormatSelector state

#### 3. ConversionModal (REMOVED)
**Lý do:** Flow mới không cần modal vì download tự động
**Hậu quả:** Hiện tại không có UI hiển thị:
- ❌ Progress bar khi đang convert
- ❌ Success state
- ❌ Error state
- ❌ Download button

#### 4. Auto-Download Logic (NEW)
**File:** `src/features/downloader/logic/input-form.ts::handleAutoDownload()`

**Nhiệm vụ:**
1. Đọc FormatSelector state
2. Build formatData với extractV2Options
3. Call startConversion() với formatData đã build

**extractV2Options Format:**

**Video (MP4):**
```javascript
extractV2Options: {
  downloadMode: 'video',
  videoQuality: '720',  // Không có 'p' suffix
  youtubeVideoContainer: 'mp4'
}
```

**Audio - MP3 (User Selection):**
```javascript
extractV2Options: {
  downloadMode: 'audio',
  audioBitrate: '128',  // User selection: 64/128/192/256/320
  audioFormat: 'mp3'
}
```

**Audio - M4A, OGG, WAV, Opus (Default 128):**
```javascript
extractV2Options: {
  downloadMode: 'audio',
  audioBitrate: '128',  // ⚠️ Fixed default value
  audioFormat: 'm4a'    // m4a, ogg, wav, opus
}
```

**⚠️ LƯU Ý QUAN TRỌNG VỀ AUDIOBITRATE:**
- **MP3**: audioBitrate được lấy từ user selection (64/128/192/256/320kbps)
- **M4A, OGG, WAV, Opus**: audioBitrate luôn là **'128'** (fixed default, không cho user chọn)
- **TẤT CẢ** audio formats đều truyền `audioBitrate` vào extractV2Options
- Không có trường hợp nào bỏ qua audioBitrate field

**Điểm quan trọng:**
- ✅ Tái sử dụng 100% base conversion logic từ y2matepro
- ✅ KHÔNG gọi api.extractMediaDirect() (tiết kiệm 1 API call)
- ✅ extractV2Options format chính xác:
  - Video: videoQuality không có 'p' suffix
  - Audio: TẤT CẢ đều có audioBitrate (MP3 từ user, còn lại default 128)

---

## 📊 Tình Trạng Hiện Tại

### ✅ Đã Hoàn Thành

#### 1. FormatSelector Component
- [x] UI component với 2 tabs (Video/Audio)
- [x] Video qualities dropdown (1080p - 144p)
- [x] Audio formats với conditional bitrate selector
- [x] State management (format-selector-state.ts)
- [x] Responsive design (mobile-first)

#### 2. Preview Card
- [x] Thay thế video-info-card bằng yt-preview-card
- [x] Layout mới: thumbnail (16:9) + title + format badge + quality + author
- [x] Fetch metadata từ YouTube oEmbed API
- [x] Fallback handling khi API fails (author = '')
- [x] CSS với aspect-ratio và flexbox centering

#### 3. HTML Structure
- [x] Move content-area vào trong form-wrap
- [x] Update tất cả HTML files (index.html, youtube-*.html)

#### 4. Auto-Download Logic
- [x] handleAutoDownload() function
- [x] Read FormatSelector state
- [x] Build formatData với extractV2Options chính xác
- [x] Handle cả video và audio formats
- [x] TẤT CẢ audio formats đều truyền audioBitrate:
  - MP3: audioBitrate từ user selection (64/128/192/256/320kbps)
  - M4A, OGG, WAV, Opus: audioBitrate = '128' (fixed default)
- [x] Call startConversion() với formatData

#### 5. State Management
- [x] YouTubePreviewState (state/youtube-preview-state.ts)
- [x] FormatSelectorState (state/format-selector-state.ts)
- [x] Integration với existing state system

#### 6. Base Controller Reuse
- [x] Tái sử dụng convert-logic-v2.ts từ y2matepro
- [x] Tái sử dụng strategy pattern (application, types, strategies)
- [x] Không modify base logic, chỉ pass đúng formatData

### ❌ Chưa Hoàn Thành

#### 1. Progress/Success UI (CRITICAL)
**Vấn đề:**
- Đã remove ConversionModal
- Hiện tại KHÔNG CÓ UI hiển thị:
  - Progress bar khi đang convert
  - Success state với download button
  - Error state với retry button

**Cần làm:**
- [ ] Option 1: Inline progress trong yt-preview-card
  - Show progress bar overlay trên thumbnail
  - Animate badge sang success state
  - Show download button khi done

- [ ] Option 2: Toast notification
  - Show toast khi start conversion
  - Update toast với progress
  - Show success toast với download button

- [ ] Option 3: Bottom sheet modal (mobile-friendly)
  - Slide up from bottom khi start conversion
  - Show progress và có thể dismiss
  - Sticky download button khi done

#### 2. Download Trigger
**Vấn đề:**
- `startConversion()` execute thành công và có downloadUrl
- Nhưng KHÔNG TỰ ĐỘNG trigger browser download
- Cũng KHÔNG CÓ button để user click download

**Cần làm:**
- [ ] Quyết định UX: Auto download hay show button?
  - Auto: Gọi `triggerDownload()` ngay khi có downloadUrl
  - Button: Show download button trong UI mới (progress card/toast/modal)

#### 3. Error Handling UI
**Vấn đề:**
- Conversion có thể fail (API error, network error, etc.)
- Hiện tại không có UI hiển thị error message
- Không có retry mechanism

**Cần làm:**
- [ ] Show error state trong UI mới
- [ ] Retry button
- [ ] Clear error message để user hiểu vấn đề

#### 4. Link Expiration Handling
**Vấn đề:**
- YouTube download links expire sau ~6 giờ
- y2matepro có expired modal với retry
- y2mate-new-ux chưa có UI handle expired state

**Cần làm:**
- [ ] Detect khi link expired (isLinkExpired() từ base)
- [ ] Show expired message
- [ ] Retry button để re-convert

#### 5. Cancel/Abort Handling
**Vấn đề:**
- Conversion có thể mất thời gian (polling strategy)
- User muốn cancel mid-way
- Không có UI để cancel

**Cần làm:**
- [ ] Cancel button trong progress UI
- [ ] Hook vào abortController trong startConversion()
- [ ] Clean up state khi cancel

#### 6. Testing
**Vấn đề:**
- Chưa test end-to-end flow
- Chưa verify API calls
- Chưa test error cases

**Cần làm:**
- [ ] Test với real YouTube URLs
- [ ] Verify console logs cho API flow
- [ ] Test error scenarios (invalid URL, API fails, network issues)
- [ ] Test tất cả format combinations (MP4 all qualities, MP3 all bitrates, M4A/OGG/WAV/Opus)

---

## 🚀 Roadmap - Công Việc Sắp Tới

### Phase 1: Progress UI (CRITICAL - Ngay Lập Tức)
**Mục tiêu:** User có thể thấy progress và download được file

**Tasks:**
1. **Quyết định UX approach:**
   - Inline progress trong yt-preview-card (recommended - ít thay đổi)
   - Toast notification (clean nhưng cần component mới)
   - Bottom sheet modal (tốt cho mobile nhưng phức tạp)

2. **Implement chosen approach:**
   - Subscribe to conversionTask state changes
   - Render progress UI (Extracting → Converting → Success)
   - Show download button khi success
   - Handle download click (reuse handleDownloadClick từ base)

3. **Error handling:**
   - Show error message trong UI
   - Retry button
   - Clear error và reset state

**Estimated effort:** 1-2 days

### Phase 2: Download Trigger (HIGH Priority)
**Mục tiêu:** File tự động download hoặc có button clear để download

**Tasks:**
1. **Quyết định auto vs manual:**
   - Discuss với stakeholder/users
   - Auto download: Tiện nhưng có thể jarring
   - Manual button: User control nhưng thêm 1 step

2. **Implement download trigger:**
   - Hook vào strategy success callback
   - Call triggerDownload() với downloadUrl và filename
   - Test trên multiple browsers (Chrome, Firefox, Safari, mobile browsers)

**Estimated effort:** 1 day

### Phase 3: Edge Cases & Polish (MEDIUM Priority)
**Mục tiêu:** Handle tất cả edge cases và improve UX

**Tasks:**
1. **Link expiration:**
   - Implement expired state detection
   - Show expired message
   - Retry mechanism

2. **Cancel functionality:**
   - Cancel button trong progress UI
   - Hook vào abortController
   - Clean state on cancel

3. **Loading states:**
   - Better skeleton animation
   - Smooth transitions giữa states
   - Disable input khi đang convert

4. **Mobile optimization:**
   - Touch-friendly buttons
   - Scroll behavior
   - Bottom sheet nếu chọn approach đó

**Estimated effort:** 2-3 days

### Phase 4: Testing & QA (HIGH Priority)
**Mục tiêu:** Verify tất cả flows work correctly

**Tasks:**
1. **Manual testing:**
   - Test all format/quality combinations
   - Test trên multiple devices (desktop, mobile, tablet)
   - Test trên multiple browsers
   - Test network conditions (slow 3G, offline, etc.)

2. **Error scenario testing:**
   - Invalid URLs
   - Private/deleted videos
   - Age-restricted videos
   - API failures
   - Network timeout

3. **Performance testing:**
   - Measure time to download
   - Check for memory leaks
   - Monitor API call frequency

**Estimated effort:** 2-3 days

### Phase 5: Future Enhancements (LOW Priority)
**Mục tiêu:** Additional features để improve UX

**Ideas:**
1. **Batch download:**
   - Select multiple videos từ search results
   - Download all với same format/quality

2. **Download history:**
   - Track downloaded videos
   - Re-download với 1 click

3. **Format recommendation:**
   - Suggest optimal quality based on video resolution
   - Auto-select MP3-128kbps for music videos

4. **Preview before download:**
   - Show video duration, file size estimate
   - Preview thumbnail gallery (if available)

**Estimated effort:** 1-2 weeks

---

## 🔧 Technical Debt & Known Issues

### 1. No Modal = No User Feedback
**Issue:** User submit URL → nothing visible happens → suddenly download starts
**Impact:** Confusing UX, user không biết progress
**Resolution:** Implement Phase 1 (Progress UI)

### 2. No Error Recovery
**Issue:** API fails → silent failure, user không biết gì
**Impact:** Poor UX, user frustrated
**Resolution:** Implement error UI in Phase 1

### 3. Unused Code
**Issue:** Nhiều code từ y2matepro bị unused trong y2mate-new-ux
**Examples:**
- generateFakeYouTubeData() - không dùng vì không render formats list
- extractFormatDataFromState() - không dùng vì không có formats list
- video-info-card CSS - đã thay bằng yt-preview-card

**Impact:** Code bloat, harder maintenance
**Resolution:** Clean up trong future refactor

### 4. State Management Complexity
**Issue:** Nhiều state systems overlap:
- FormatSelectorState
- YouTubePreviewState
- ConversionState
- DownloadState

**Impact:** Có thể gây bugs nếu không sync properly
**Resolution:** Monitor trong testing phase, refactor nếu cần

---

## 📝 Decision Log

### Why Remove ConversionModal?
**Reason:** Flow mới là auto-download, không cần user interaction trong conversion process
**Trade-off:** Mất user feedback về progress
**Solution:** Sẽ implement alternative progress UI (inline/toast/bottom sheet)

### Why Not Call extractMediaDirect()?
**Reason:**
- User đã chọn format từ FormatSelector
- Không cần get full formats list
- Tiết kiệm 1 API call và thời gian

**Trade-off:** None
**Benefit:** Faster, simpler flow

### Why Build formatData Instead of Calling API?
**Reason:**
- Reuse existing base logic (startConversion → extractFormat → downloadYouTube)
- extractFormat() already handles API call với extractV2Options
- Building formatData là lightweight, no API overhead

**Trade-off:** None
**Benefit:** Clean separation of concerns

### Why All Audio Formats Need audioBitrate?
**Reason:**
- API downloadYouTube expects audioBitrate field for all audio downloads
- MP3: User can select bitrate (64/128/192/256/320)
- M4A, OGG, WAV, Opus: Default to 128kbps (backend handles optimal encoding)

**Trade-off:** None
**Benefit:** Consistent API contract, simpler logic

### Why YouTube oEmbed API for Metadata?
**Reason:**
- Public API, no authentication needed
- Fast response
- Reliable for title + author

**Trade-off:** Limited data (no duration, views, etc.)
**Alternative:** Could use extractMediaDirect but defeats purpose of simplified flow

---

## 🎓 Lessons Learned

### 1. Understand Base Code First
- Spent time reading y2matepro flow carefully
- Understood how formatData flows through system
- Knew exactly what extractV2Options needed

### 2. Reuse > Rewrite
- Didn't modify base conversion logic
- Just changed input preparation
- Result: Less bugs, faster development

### 3. UX Changes Have Ripple Effects
- Removing modal seemed simple
- But required rethinking entire progress feedback
- Always consider "where does user get feedback?"

### 4. API Contract Matters
- Initially thought OGG/WAV/Opus don't need audioBitrate
- Backend actually expects it for all audio formats
- Lesson: Always check API documentation and existing implementations

### 5. Test Early
- Should test handleAutoDownload() immediately
- Would catch issues with formatData structure earlier
- Lesson: Don't wait until all features done to test

---

## 📚 Key Files Reference

### New Files Created
```
src/ui-components/format-selector/
  ├── format-selector.ts           # Main component logic
  └── format-selector.css          # Styling

src/features/downloader/state/
  ├── format-selector-state.ts     # FormatSelector state management
  └── youtube-preview-state.ts     # YouTube preview state management

src/styles/reusable-packages/yt-preview-card/
  └── yt-preview-card.css          # New preview card styling
```

### Modified Files
```
src/features/downloader/logic/
  └── input-form.ts                # Added handleAutoDownload(), modified YouTube workflow

src/features/downloader/ui-render/
  └── content-renderer.ts          # Modified renderPreviewCard() to use YouTubePreviewState

src/features/downloader/state/
  └── types.ts                     # Added YouTubePreview and YouTubePreviewState interfaces

HTML files:
  ├── index.html                   # Moved content-area into form-wrap
  ├── youtube-to-mp4.html
  ├── youtube-to-mp3.html
  ├── youtube-short-downloader.html
  └── youtube-to-mp3-320kbps-converter.html
```

### Reused Files (No Changes)
```
src/features/downloader/logic/conversion/
  ├── convert-logic-v2.ts          # ✅ Reused 100%
  ├── application.ts               # ✅ Reused 100%
  ├── types.ts                     # ✅ Reused 100%
  └── strategies/                  # ✅ Reused 100%
```

---

## 🎯 Success Metrics

### How to Measure Success?

1. **User Experience:**
   - [ ] Time from URL submit to download start < 5 seconds
   - [ ] < 3 clicks total (select format → paste URL → download)
   - [ ] Clear progress feedback at all stages

2. **Technical Performance:**
   - [ ] Only 1 API call per download (downloadYouTube)
   - [ ] No unnecessary re-renders
   - [ ] < 100ms state update latency

3. **Reliability:**
   - [ ] 100% success rate for valid YouTube URLs
   - [ ] Graceful error handling for invalid URLs
   - [ ] No console errors in happy path

4. **Code Quality:**
   - [ ] 100% reuse of base conversion logic
   - [ ] No duplicate code
   - [ ] Clear separation of concerns

---

## ⚠️ Critical Path to MVP

**To ship y2mate-new-ux, we MUST complete:**

1. ✅ FormatSelector component
2. ✅ Auto-download logic with correct extractV2Options
3. ❌ **Progress UI** (BLOCKING - users need feedback)
4. ❌ **Download trigger** (BLOCKING - users need to get file)
5. ❌ **Error handling UI** (BLOCKING - users need to know when failed)
6. ⚠️ Testing (IMPORTANT - verify it works)

**Current status: 50% complete**
**Remaining work: ~3-5 days** (if choose inline progress approach)

---

## 🔍 Code Examples

### handleAutoDownload() Logic Flow

```javascript
async function handleAutoDownload(url: string, videoId: string): Promise<void> {
  // 1. Read state
  const state = getState();
  const selectedFormat = state.selectedFormat;  // 'mp4' or 'mp3'
  const videoQuality = state.videoQuality;      // '720p'
  const audioFormat = state.audioFormat;        // 'mp3', 'm4a', 'ogg', 'wav', 'opus'
  const audioBitrate = state.audioBitrate;      // '128'

  // 2. Build formatData
  let formatData;

  if (selectedFormat === 'mp4') {
    // Video
    formatData = {
      vid: videoId,
      type: 'VIDEO',
      quality: videoQuality,
      extractV2Options: {
        downloadMode: 'video',
        videoQuality: '720',  // Remove 'p'
        youtubeVideoContainer: 'mp4'
      }
    };
  } else {
    // Audio - TẤT CẢ formats đều cần audioBitrate
    const isNonBitrateFormat = ['m4a', 'ogg', 'wav', 'opus'].includes(audioFormat);
    const finalBitrate = isNonBitrateFormat ? '128' : audioBitrate;

    formatData = {
      vid: videoId,
      type: 'AUDIO',
      quality: isNonBitrateFormat ? audioFormat.toUpperCase() : `${audioBitrate}kbps`,
      extractV2Options: {
        downloadMode: 'audio',
        audioBitrate: finalBitrate,  // '128' cho M4A/OGG/WAV/Opus, user choice cho MP3
        audioFormat: audioFormat     // 'mp3', 'm4a', 'ogg', 'wav', 'opus'
      }
    };
  }

  // 3. Start conversion
  await startConversion({
    formatId,
    formatData,
    videoTitle,
    videoUrl: url
  });
}
```

### extractV2Options Examples

```javascript
// MP4 720p
{
  downloadMode: 'video',
  videoQuality: '720',
  youtubeVideoContainer: 'mp4'
}

// MP3 256kbps (user selected)
{
  downloadMode: 'audio',
  audioBitrate: '256',
  audioFormat: 'mp3'
}

// M4A (fixed 128kbps - không cho user chọn)
{
  downloadMode: 'audio',
  audioBitrate: '128',  // ⚠️ Fixed value
  audioFormat: 'm4a'
}

// OGG (fixed 128kbps - không cho user chọn)
{
  downloadMode: 'audio',
  audioBitrate: '128',  // ⚠️ Fixed value
  audioFormat: 'ogg'
}

// WAV (fixed 128kbps - không cho user chọn)
{
  downloadMode: 'audio',
  audioBitrate: '128',  // ⚠️ Fixed value
  audioFormat: 'wav'
}

// Opus (fixed 128kbps - không cho user chọn)
{
  downloadMode: 'audio',
  audioBitrate: '128',  // ⚠️ Fixed value
  audioFormat: 'opus'
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Author:** Development team
**Project:** y2mate-new-ux
**Based On:** y2matepro
