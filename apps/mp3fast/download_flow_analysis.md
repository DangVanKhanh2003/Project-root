# Complete Download Flow Analysis - YTMP3 Clone 3

## Overview
This document details the complete flow from pressing the submit button until action buttons are displayed, with file paths and line numbers for each major step.

---

## PHASE 1: INITIALIZATION (Page Load)

### 1.1 Main Entry Point
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/main.ts`
- **Lines 19-26:** `initDownloaderUI()` - Lazy loads the downloader UI module
- **Lines 93-97:** `loadFeatures()` - Initializes theme toggle, mobile menu, and downloader UI

### 1.2 Downloader UI Initialization
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/downloader-ui.ts`
- **Lines 22-120:** `init()` function orchestrates the initialization:
  1. **Line 25-26:** Initialize scroll manager
  2. **Line 35-36:** Initialize format selector (loads state from localStorage)
  3. **Line 39-50:** Initialize renderers (views, content, suggestions)
  4. **Line 57-66:** Register render callback for state changes
  5. **Line 69-73:** Initialize input form controller
  6. **Line 76:** Initialize conversion controller (event listeners)
  7. **Line 79-83:** Initial render
  8. **Line 86-118:** Setup routing for deep links

### 1.3 Input Form Setup
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`
- **Lines 374-410:** `initInputForm()` function:
  - **Line 376-379:** Get DOM elements (form, input, buttons)
  - **Line 386:** Attach `submit` event listener → `handleSubmit`
  - **Line 387:** Attach `input` event listener → `handleInput`
  - **Line 388:** Attach `keydown` event listener → `handleKeyDown` (keyboard nav)
  - **Line 393:** Attach `click` event listener for paste/clear button → `handleActionButton`

---

## PHASE 2: USER SUBMITS FORM (Click Convert Button)

### 2.1 Form Submit Handler
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`
- **Lines 727-807:** `handleSubmit(event)` function:

**Key steps:**
1. **Line 731:** Set `setSubmitting(true)` - Prevent suggestion interference
2. **Line 738-744:** Validate input value
3. **Line 749:** `destroyOldProcesses()` - Cancel old polling, conversions, API calls
4. **Line 752-754:** Blur input and hide keyboard on mobile
5. **Line 764-766:** Clear state (results, errors, suggestions)
6. **Line 767:** Set `setLoading(true)`
7. **Line 773-796:** Route based on input type:
   - **URL input:** Call `handleExtractMedia(value)` → Extract YouTube video
   - **Keyword input:** Call `handleSearch(value)` → Search for videos

### 2.2 YouTube Video Extraction
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`
- **Lines 814-909:** `handleExtractMedia(url)` function:

**Steps:**
1. **Lines 821-824:** Validate YouTube URL
2. **Line 830:** Extract video ID from URL
3. **Line 837:** `navigateToVideo(videoId)` - Push URL to browser history
4. **Line 840:** `setVideoPageSEO()` - Update SEO meta tags
5. **Lines 843-853:** Create initial YouTube preview (loading state):
   - **Line 843:** Generate thumbnail URL from video ID
   - **Line 846-853:** `setYouTubePreview()` - Set initial state with `isLoading: true`
   - **Line 856:** `renderPreviewCard()` - Render preview skeleton
6. **Lines 859-891:** Fetch real metadata asynchronously (non-blocking):
   - **Line 863:** `coreServices.youtubePublicApi.getMetadata(url)` - Fetch title, author
   - **Lines 869, 873, 878:** Update preview with real data via `updateYouTubePreviewMetadata()`
   - **Lines 882-890:** Update preview state with `isLoading: false`
   - **Line 890:** Re-render preview card with real data
7. **Lines 894-902:** Trigger auto-download (fire-and-forget):
   - **Line 894:** `handleAutoDownload(url, videoId)` - Build format data and start conversion
   - **Lines 895-899:** Reset `isFromListItemClick` flag after conversion starts

---

## PHASE 3: PREVIEW & AUTO-DOWNLOAD

### 3.1 Preview Card Rendering
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/ui-render/content-renderer.ts`
- **Lines 299-349:** `showLoading()` function:
  - **Line 330:** `renderPreviewCardSkeleton()` - Shows skeleton while metadata loads
  - **Line 337:** Set content area innerHTML
  - **Line 342:** Show content area

- **Lines 417-493:** `renderPreviewCard()` function:
  - **Line 422-423:** Get state (YouTube preview data)
  - **Lines 431-442:** Get quality info from format selector
  - **Lines 446-477:** Build preview card HTML with:
    - Video thumbnail from YouTube preview
    - Title and author
    - Selected format (MP3/MP4) badge
    - Quality info (720p, 128kbps, etc.)
    - Status container (for conversion progress)
    - Action buttons (Download, Retry, Next)
  - **Line 480:** Render to content area
  - **Line 492:** `showResultView()` - Switch from search view to result view

### 3.2 Auto-Download Triggered
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`
- **Lines 243-331:** `handleAutoDownload(url, videoId)` function:

**Key steps:**
1. **Line 248:** Get current state (selected format, quality, audio format, bitrate)
2. **Lines 250-253:** Extract format selections:
   - `selectedFormat` - 'mp4' or 'mp3'
   - `videoQuality` - '720p', '1080p', etc.
   - `audioFormat` - 'mp3', 'ogg', 'wav', 'opus', 'm4a'
   - `audioBitrate` - '128', '256', '320', etc.
3. **Lines 259-308:** Build `formatData` object:
   - **For MP4:** Build with `extractV2Options` containing:
     - `downloadMode: 'video'`
     - `videoQuality: '720'` (without 'p')
     - `youtubeVideoContainer: 'mp4'`
   - **For Audio:** Build with `extractV2Options` containing:
     - `downloadMode: 'audio'`
     - `audioBitrate: '128'` (or user selection for MP3)
     - `audioFormat: 'mp3'` (or selected format)
4. **Line 313:** Get video title from preview
5. **Line 317:** Dynamic import of `startConversion` (lazy loading)
6. **Line 319-324:** Call `startConversion()` with:
   - `formatId` - Unique ID for this conversion
   - `formatData` - Format configuration
   - `videoTitle` - For UI display
   - `videoUrl` - Original YouTube URL

---

## PHASE 4: CONVERSION & STATUS UPDATE

### 4.1 Start Conversion
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/convert-logic-v2.ts`
- **Lines 54-167:** `startConversion(params)` function:

**Key steps:**
1. **Line 64:** Create `AbortController` for cancellation
2. **Lines 68-78:** Initialize conversion task state:
   - **Line 68:** `setConversionTask(formatId, { ... })` - Set state to `EXTRACTING`
   - State includes:
     - `state: TaskState.EXTRACTING`
     - `statusText: 'Extracting video data...'`
     - `showProgressBar: false`
     - `startedAt: Date.now()`
     - `abortController` - For cancellation
3. **Line 85:** Call `extractFormat()` - API call to get download URL
4. **Lines 94-95:** `determineRoute()` - Decide which strategy to use:
   - **STATIC_DIRECT** - Direct download (no polling)
   - **IOS_RAM** - iOS audio stream to RAM (no polling)
   - **IOS_POLLING** - iOS/Windows: Server-side processing with polling
   - **WINDOWS_MP4_POLLING** - Windows MP4: Server-side processing with polling
   - **OTHER_STREAM** - Other platforms: Direct stream download
5. **Lines 103-116:** Transition to CONVERTING phase (if polling needed):
   - **Lines 109-113:** Update state to `PROCESSING` with polling-eligible routes
6. **Lines 119-135:** Create and execute strategy:
   - **Line 131:** `createStrategy(context)` - Factory creates appropriate strategy
   - **Line 135:** `strategy.execute()` - Execute strategy (handles polling, download, etc.)
7. **Lines 139-144:** Update format cache on success
8. **Lines 146-162:** Error handling - Update state to `FAILED`

### 4.2 Extract Format (API Call)
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/convert-logic-v2.ts`
- **Lines 204-258:** `extractFormat()` function:

**API Calls:**
1. **Line 231:** `api.downloadYouTube(downloadRequest, signal)`
   - Request contains:
     - `url` - YouTube URL
     - `downloadMode` - 'video' or 'audio'
     - `videoQuality` - '720', '1080', etc.
     - `youtubeVideoContainer` - 'mp4'
     - `audioBitrate` - '128', '256', etc.
     - `audioFormat` - 'mp3', 'ogg', etc.
   - Response contains:
     - `url` - Download URL (or progress URL for polling)
     - `status` - 'static' or 'stream'
     - `progressUrl` - URL for polling progress (if streaming)
     - `size` - File size in bytes

### 4.3 Routing Decision
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/types.ts`
- **Lines 129-220:** `determineRoute()` function:

**Routing Logic:**
1. **Lines 151-159:** Case 1: STATIC_DIRECT
   - Condition: `extractResult.status === 'static'`
   - Direct download, no polling
2. **Lines 165-189:** Case 2: IOS_RAM
   - Condition: iOS + Audio + size ≤ 150MB
   - Stream download to RAM, ignore polling
3. **Lines 190-197:** Case 3: IOS_POLLING
   - Condition: iOS + (Video OR Audio > 150MB)
   - Server-side processing with polling
4. **Lines 200-209:** Case 4: WINDOWS_MP4_POLLING
   - Condition: Windows + MP4 format
   - Server-side processing with polling
5. **Lines 212-219:** Case 5: OTHER_STREAM
   - Default fallback for other platforms

---

## PHASE 5: STRATEGY EXECUTION (Polling Strategy)

### 5.1 Polling Strategy Setup
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts`
- **Lines 56-70:** Constructor:
  - **Line 63-64:** Initialize `PollingProgressMapper` with format and size
  - **Lines 67-69:** Initialize fake progress tracking timers
  
- **Lines 76-127:** `execute()` function:

**Key steps:**
1. **Line 100-104:** Update state to `POLLING`:
   - `state: TaskState.POLLING`
   - `statusText: 'Converting...'`
   - `showProgressBar: true`
2. **Line 111:** `playInitialAnimation()` - Animate progress 0→5% over 200ms
3. **Lines 116-126:** Return promise and start polling:
   - **Line 116:** `getPollingManager().startPolling(formatId, { ... })`
   - Configure with callbacks:
     - `onProgressUpdate` → `handleProgress()`
     - `onStatusUpdate` → `handleComplete()`

### 5.2 Polling Manager
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/concurrent-polling.ts`
- **Lines 94-145:** `startPolling()` and `_startPollingImmediate()` functions:

**Polling Mechanism:**
1. **Line 117:** Call `_checkTaskStatus()` immediately on start
2. **Lines 121-123:** Create polling interval:
   - Poll every `pollInterval` ms (default 1000ms)
   - Add 0-500ms jitter to avoid sync spikes
3. **Lines 126-128:** Create cleanup timeout:
   - Timeout after `maxPollingDuration` ms (default 10 minutes)
4. **Lines 138-144:** Track polling operation by `formatId`

### 5.3 Polling Progress Updates
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts`
- **Lines 161-373:** `handleProgress()` function:

**Three Phases of Progress:**

**Phase 1: Initial Animation (0→5%)**
- **Lines 143-156:** `playInitialAnimation()` - 200ms animation

**Phase 2: Real Progress & Fake Progress (5→90%)**
- **Lines 169-307:** Main progress handling:
  1. **Line 170-173:** Check for `no_download` status (server not ready)
  2. **Lines 193-207:** Use `PollingProgressMapper` for sophisticated calculation
  3. **Lines 213-236:** Real progress update (displayProgress > lastPercent):
     - Update `lastPercent`, reset timers
     - Call `updateProgress()` → State update → UI render
  4. **Lines 297-307:** Stuck progress handling (when API progress stalls):
     - **Lines 349-364:** If below 90%: Apply fake +1% progress
     - **Lines 355-363:** If ≥90%: Rotate status text only (no fake %)

**Phase 3: Merging Phase (90→100%)**
- **Lines 238-295:** Detect and handle merging phase transition:
  1. **Line 239:** Get current phase from `PollingProgressMapper`
  2. **Lines 246-295:** On transition to merging:
     - Set `hasTransitionedToMerging = true`
     - Calculate animation delay (500ms if just reached 100%)
     - Show "Merging files..." status
3. **Lines 320-343:** In merging phase, rotate status with progressive timing:
   - 5s: "Merging files..."
   - 11s: "Finalizing your video..."
   - 18s: "Optimizing quality..."
   - (continues with progressive +1s increments)

### 5.4 Progress State Updates
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts`
- **Lines 587-617:** `updateProgress()` function:

**Updates conversion task state:**
1. **Line 606-610:** Call `updateTask()`:
   ```typescript
   {
     progress: percent,
     statusText: finalStatusText,
     showProgressBar: true
   }
   ```
2. This state update triggers render callback → UI re-render

---

## PHASE 6: STATUS BAR & ACTION BUTTONS RENDERING

### 6.1 Render Callback System
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/downloader-ui.ts`
- **Lines 57-66:** Register render callback:
  ```typescript
  setRenderCallback((state, prevState) => {
    render(state, prevState);
    if (suggestionRendererInitialized) {
      renderSuggestions(state, prevState);
    }
  });
  ```

### 6.2 Conversion Status Rendering
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/ui-render/download-rendering.ts`
- **Lines 34-69:** `renderConversionStatus()` function:

**Rendering Flow:**
1. **Line 36:** Get status container element
2. **Lines 44-50:** Get current format ID from state:
   - MP4: `video|mp4-720p`
   - MP3: `audio|mp3-128kbps`
3. **Line 53:** Get conversion task from state
4. **Line 62:** Show status container
5. **Line 65:** Setup button handlers (idempotent)
6. **Line 68:** Update status bar UI

### 6.3 Status Bar UI Update
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/ui-render/download-rendering.ts`
- **Lines 115-212:** `updateStatusBarUI()` function:

**Elements Updated:**
1. **Line 148:** Update status text
2. **Line 152:** Update progress fill (CSS variable `--progress`)
3. **Lines 160-187:** Update status state classes:
   - `status--extracting` - Show spinner
   - `status--processing` - Show spinner
   - `status--success` - Show checkmark ✓
   - `status--error` - Show error ✕
4. **Lines 190-201:** Update action buttons:
   - **SUCCESS state:** Show Download button (add `active` class)
   - **FAILED state:** Show Retry button (add `active` class)
   - **Processing states:** Hide both buttons

### 6.4 Action Button Handlers
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/ui-render/download-rendering.ts`
- **Lines 217-249:** `setupButtonHandlers()` function:

**Button Setup (called once):**
1. **Line 233-235:** Download button:
   - Click → `handleDownloadButtonClick(formatId)`
   - Add ripple effect
2. **Line 238-240:** Retry button:
   - Click → `handleRetryButtonClick(formatId)`
   - Add ripple effect
3. **Line 243-245:** New Convert button:
   - Click → `handleNewConvertButtonClick()`
   - Add ripple effect

### 6.5 Download Button Handler
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/ui-render/download-rendering.ts`
- **Lines 254-265:** `handleDownloadButtonClick()` function:

**Steps:**
1. **Line 257:** Dynamic import of `handleDownloadClick` from convert-logic-v2
2. **Line 258:** Call `handleDownloadClick(formatId)` to trigger actual download
3. **Lines 260-264:** Handle expired link case (YouTube links expire after ~6 hours)

### 6.6 Actual Download Trigger
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/convert-logic-v2.ts`
- **Lines 289-317:** `handleDownloadClick()` function:

**Download Mechanism:**
1. **Line 290:** Get conversion task from state
2. **Lines 292-295:** Check if download URL is available
3. **Lines 298-305:** Check if link expired (YouTube only, 6-hour limit)
4. **Lines 309-312:** iOS RAM case: Download from blob
5. **Line 315:** Normal case: Trigger download from URL
   - **Line 18:** Uses `triggerDownload(url, filename)` utility

---

## PHASE 7: CONVERSION COMPLETION SEQUENCE

### 7.1 Completion Handler
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts`
- **Lines 389-440:** `handleComplete()` function:

**Sequence:**
1. **Line 399:** Stop polling immediately
2. **Line 403:** Force progress to 100%
3. **Lines 407-421:** Wait for CSS animation to complete:
   - Double requestAnimationFrame (ensure browser paint)
   - 150ms delay (for CSS transition completion)
4. **Line 430:** `markSuccess(mergedUrl)` - Update state to SUCCESS
5. **Line 437:** Resolve promise with success result
   - This triggers state update → render callback → UI update

### 7.2 State Update on Success
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/state/conversion-state.ts`

**Conversion task updates to:**
```typescript
{
  state: TaskState.SUCCESS,
  statusText: 'Ready',
  progress: 100,
  downloadUrl: mergedUrl,  // Download URL available
  completedAt: Date.now()
}
```

### 7.3 Final UI Render
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/ui-render/download-rendering.ts`
- **Lines 115-212:** `updateStatusBarUI()` re-renders with:

**Final UI State:**
1. **Line 155:** Remove spinner, add checkmark ✓
2. **Line 172:** Add `status--success` class
3. **Line 174-175:** Set checkmark icon
4. **Line 192:** Add `active` class to Download button
5. **Line 205:** Show action-container (buttons visible)
6. **Line 208:** Cleanup throttle map

---

## HTML Structure - Status Bar & Action Buttons

**Location:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/ui-render/content-renderer.ts`
- **Lines 386-410:** `renderPreviewCardSkeleton()` - Skeleton structure
- **Lines 417-493:** `renderPreviewCard()` - Final structure

**Rendered HTML:**
```html
<div class="yt-preview-card">
  <!-- Video preview -->
</div>

<div class="status-container" id="status-container">
  <div class="status status--extracting">
    <span class="status-text">Extracting...</span>
    <div class="icon spinner"></div>
  </div>
</div>

<div class="action-container" id="action-container">
  <button class="download-btn" id="conversion-download-btn">Download</button>
  <button class="retry-btn" id="conversion-retry-btn">Retry</button>
  <button class="btn-new-convert" id="btn-new-convert">Next</button>
</div>
```

---

## Key State Objects

### Conversion Task State
**File:** `/Users/macos/Documents/work/downloader/Project-root/apps/ytmp3-clone-3/src/features/downloader/state/types.ts`

```typescript
ConversionTask {
  state: TaskState;              // idle, extracting, processing, polling, success, failed
  statusText: string;            // "Extracting...", "Converting...", etc.
  progress: number;              // 0-100
  downloadUrl?: string;          // URL for download (set on success)
  error?: string;                // Error message if failed
  startedAt: number;             // Timestamp
  completedAt?: number;          // Timestamp when done
  formatData: FormatData;        // Original format configuration
  ramBlob?: Blob;                // iOS RAM strategy blob
  filename?: string;             // Suggested filename
}
```

### YouTube Preview State
```typescript
YouTubePreview {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
  isLoading: boolean;           // true during metadata fetch, false when done
}
```

### Format Data State
```typescript
FormatData {
  id: string;                   // Unique format ID
  vid: string;                  // Video ID
  quality: string;              // "720p", "128kbps", etc.
  type: string;                 // "VIDEO", "AUDIO"
  format: string;               // "mp4", "mp3", etc.
  extractV2Options: {
    downloadMode: 'video' | 'audio';
    videoQuality?: string;      // "720" (without 'p')
    youtubeVideoContainer?: string;
    audioBitrate?: string;      // "128"
    audioFormat?: string;       // "mp3"
  }
}
```

---

## Key Files Reference

| File | Purpose | Key Functions |
|------|---------|---|
| `src/main.ts` | App entry point | `initDownloaderUI()` |
| `src/features/downloader/downloader-ui.ts` | Downloader orchestrator | `init()` |
| `src/features/downloader/logic/input-form.ts` | Form handling | `handleSubmit()`, `handleExtractMedia()`, `handleAutoDownload()` |
| `src/features/downloader/logic/conversion/convert-logic-v2.ts` | Conversion orchestrator | `startConversion()`, `extractFormat()` |
| `src/features/downloader/logic/conversion/types.ts` | Type definitions & routing | `determineRoute()` |
| `src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts` | Polling logic | `execute()`, `handleProgress()` |
| `src/features/downloader/logic/concurrent-polling.ts` | Polling manager | `startPolling()`, `_checkTaskStatus()` |
| `src/features/downloader/ui-render/content-renderer.ts` | Preview card rendering | `renderPreviewCard()`, `showLoading()` |
| `src/features/downloader/ui-render/download-rendering.ts` | Status bar rendering | `renderConversionStatus()`, `updateStatusBarUI()` |
| `src/ui-components/format-selector/format-selector.ts` | Format selection | `renderFormatSelector()`, `handleFormatChange()` |

---

## Summary: From Submit to Action Buttons

1. **User clicks Convert** → `handleSubmit()` (line 727)
2. **Validate & Extract** → `handleExtractMedia()` (line 814)
3. **Show Preview Skeleton** → `showLoading('detail')` (line 775)
4. **Fetch Metadata Async** → `coreServices.youtubePublicApi.getMetadata()` (line 863)
5. **Render Preview** → `renderPreviewCard()` (line 856, 890)
6. **Build Format Data** → `handleAutoDownload()` (line 894)
7. **Start Conversion** → `startConversion()` (line 317)
8. **Extract & Route** → `extractFormat()` (line 85)
9. **Polling Loop** → `getPollingManager().startPolling()` (line 116)
10. **Progress Updates** → `handleProgress()` → `updateTask()` → Render
11. **Completion** → `handleComplete()` (line 389)
12. **Show Buttons** → `renderConversionStatus()` (line 34)
    - **Success:** Download button active
    - **Failed:** Retry button active

---

## Progress Update Flow Diagram

```
User Submit
    ↓
handleSubmit() [input-form.ts:727]
    ↓
handleExtractMedia() [input-form.ts:814]
    ├→ Show Preview Skeleton [content-renderer.ts:299]
    ├→ Fetch Metadata (async) [coreServices.youtubePublicApi]
    ├→ Render Preview [content-renderer.ts:417]
    └→ handleAutoDownload() [input-form.ts:243]
        ↓
startConversion() [convert-logic-v2.ts:54]
    ├→ extractFormat() [convert-logic-v2.ts:204]
    ├→ determineRoute() [types.ts:129]
    └→ createStrategy().execute() [PollingStrategy.ts:76]
        ├→ playInitialAnimation() [PollingStrategy.ts:143]
        └→ startPolling() [concurrent-polling.ts:94]
            ↓
[POLLING LOOP]
    ├→ _checkTaskStatus() [concurrent-polling.ts:150]
    ├→ API Call: GET /progress
    ├→ handleProgress() [PollingStrategy.ts:161]
    ├→ updateTask() [state/conversion-state.ts]
    ├→ Render Callback [downloader-ui.ts:57]
    ├→ renderConversionStatus() [download-rendering.ts:34]
    └→ updateStatusBarUI() [download-rendering.ts:115]
        ↓
[PROGRESS 0% → 100%]
    ├→ EXTRACTING: Show spinner, progress 0-5%
    ├→ POLLING: Show spinner, fake progress 5-90%
    ├→ MERGING: Show spinner, status rotation 90-100%
    └→ SUCCESS: Show checkmark, progress 100%
        ↓
handleComplete() [PollingStrategy.ts:389]
    ├→ markSuccess(mergedUrl) [BaseStrategy.ts]
    ├→ updateTask({ state: SUCCESS, downloadUrl: ... })
    └→ Trigger Render Callback
        ↓
renderConversionStatus() [download-rendering.ts:34]
    └→ updateStatusBarUI() [download-rendering.ts:115]
        └→ Show Download Button (add 'active' class)
            ↓
Action Buttons Ready for User Click
```

