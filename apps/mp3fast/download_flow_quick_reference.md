# Download Flow - Quick Reference Guide

## Submit Button → Action Buttons (High-Level Steps)

```
PHASE 1: USER INITIATES
├─ Click Convert button
└─ handleSubmit() [input-form.ts:727]

PHASE 2: VIDEO EXTRACTION
├─ Validate YouTube URL
├─ Extract video ID
├─ Show preview skeleton
├─ handleExtractMedia() [input-form.ts:814]
└─ Render preview card

PHASE 3: AUTO-DOWNLOAD START
├─ Build format data from selections
├─ handleAutoDownload() [input-form.ts:243]
└─ startConversion() [convert-logic-v2.ts:54]

PHASE 4: API CALL & ROUTING
├─ extractFormat() → api.downloadYouTube() [convert-logic-v2.ts:204]
├─ determineRoute() → decides strategy [types.ts:129]
└─ createStrategy().execute() [PollingStrategy.ts:76]

PHASE 5: POLLING LOOP (For streaming content)
├─ Initial animation 0→5% [PollingStrategy.ts:143]
├─ Start polling every 1s [concurrent-polling.ts:94]
├─ handleProgress() → update state [PollingStrategy.ts:161]
├─ Trigger render callback [downloader-ui.ts:57]
└─ Repeat until 100% or error

PHASE 6: RENDER STATUS & BUTTONS
├─ renderConversionStatus() [download-rendering.ts:34]
├─ updateStatusBarUI() [download-rendering.ts:115]
└─ Show Download button when SUCCESS

PHASE 7: USER INTERACTION
└─ Click Download button → triggerDownload()
```

---

## Critical Files by Responsibility

| Responsibility | File | Key Function | Lines |
|---|---|---|---|
| Form submission | `input-form.ts` | `handleSubmit()` | 727-807 |
| YouTube extraction | `input-form.ts` | `handleExtractMedia()` | 814-909 |
| Auto-download trigger | `input-form.ts` | `handleAutoDownload()` | 243-331 |
| Conversion orchestration | `convert-logic-v2.ts` | `startConversion()` | 54-167 |
| API extraction | `convert-logic-v2.ts` | `extractFormat()` | 204-258 |
| Route decision | `types.ts` | `determineRoute()` | 129-220 |
| Polling execution | `PollingStrategy.ts` | `execute()` | 76-127 |
| Progress handling | `PollingStrategy.ts` | `handleProgress()` | 161-373 |
| Polling loop | `concurrent-polling.ts` | `startPolling()` | 94-145 |
| Preview rendering | `content-renderer.ts` | `renderPreviewCard()` | 417-493 |
| Status bar rendering | `download-rendering.ts` | `renderConversionStatus()` | 34-69 |
| Status UI updates | `download-rendering.ts` | `updateStatusBarUI()` | 115-212 |
| Button handlers | `download-rendering.ts` | `setupButtonHandlers()` | 217-249 |
| Download trigger | `download-rendering.ts` | `handleDownloadButtonClick()` | 254-265 |
| Format selection | `format-selector.ts` | `handleFormatChange()` | 210-213 |

---

## Event Flow Timeline

### Input/Form Events
- **submit** → `handleSubmit()` [input-form.ts:727]
  - Validates input
  - Clears old state
  - Routes to extraction or search

### Preview Card Events
- **render** → `renderPreviewCard()` [content-renderer.ts:417]
  - Shows video thumbnail
  - Shows format/quality info
  - Creates status container
  - Creates action buttons

### Conversion State Events
- **conversionTasks change** → Render callback [downloader-ui.ts:57]
  - Triggers `renderConversionStatus()` [download-rendering.ts:34]
  - Which calls `updateStatusBarUI()` [download-rendering.ts:115]

### Action Button Events
- **download-btn click** → `handleDownloadButtonClick()` [download-rendering.ts:254]
  - Calls `handleDownloadClick()` [convert-logic-v2.ts:289]
  - Triggers actual download via `triggerDownload()`

- **retry-btn click** → `handleRetryButtonClick()` [download-rendering.ts:270]
  - Re-triggers `startConversion()` [convert-logic-v2.ts:54]

- **new-convert-btn click** → `handleNewConvertButtonClick()` [download-rendering.ts:298]
  - Returns to search view

---

## State Objects Structure

### Conversion Task State
```typescript
interface ConversionTask {
  state: 'idle' | 'extracting' | 'processing' | 'polling' | 'success' | 'failed';
  statusText: string;              // "Extracting...", "Converting 45%", etc.
  progress?: number;               // 0-100
  downloadUrl?: string;            // Set when SUCCESS
  error?: string;                  // Set when FAILED
  startedAt: number;
  completedAt?: number;
  formatData: FormatData;
  abortController: AbortController;
  ramBlob?: Blob;                  // iOS only
  filename?: string;
}
```

### State Transitions During Conversion
```
IDLE → EXTRACTING → PROCESSING/POLLING → SUCCESS
                                      ↘ FAILED → IDLE (on retry)
```

### Progress States
- **EXTRACTING** (0%): Calling API to get download info
- **PROCESSING** (0-5%): Initial animation
- **POLLING** (5-90%): Real + fake progress from polling
- **MERGING** (90-100%): Server merging files, status rotation
- **SUCCESS** (100%): Download ready, show Download button

---

## API Calls in Order

1. **YouTube Metadata** (async, non-blocking)
   - `coreServices.youtubePublicApi.getMetadata(url)` [input-form.ts:863]
   - Gets title, author
   - Updates preview card

2. **Download/Convert Extraction** (blocking)
   - `api.downloadYouTube(downloadRequest)` [convert-logic-v2.ts:231]
   - Request: `{ url, downloadMode, videoQuality, audioBitrate, audioFormat }`
   - Response: `{ url, status, progressUrl, size }`

3. **Polling Progress** (repeated every ~1s)
   - `api.checkConversionProgress(progressUrl)` [concurrent-polling.ts:150]
   - Response: `{ videoProgress, audioProgress, status, mergedUrl }`
   - Continues until `mergedUrl` is returned or timeout

---

## Critical Decision Points

### 1. Route Decision (determineRoute)
```typescript
Status === 'static'              → STATIC_DIRECT (no polling)
iOS + Audio + size ≤ 150MB      → IOS_RAM
iOS + (Video OR size > 150MB)   → IOS_POLLING
Windows + MP4                   → WINDOWS_MP4_POLLING
Other                           → OTHER_STREAM
```

### 2. Format Selection
```
User selects:
  Format: MP3 or MP4
  Quality: (MP4) 720p, 1080p, etc. OR (MP3) 128kbps, 256kbps, etc.
  
Saved to state:
  selectedFormat, videoQuality, audioFormat, audioBitrate
  
Sent to API:
  formatData.extractV2Options {
    downloadMode: 'video' | 'audio'
    videoQuality, youtubeVideoContainer, audioBitrate, audioFormat
  }
```

### 3. Progress Update Decision
```
API progress > lastPercent
  → Real update: updateProgress(newPercent, statusText)
  
API progress <= lastPercent AND < 90%
  → Fake progress: +1% every 2.7-4.5s (depending on current %)
  
API progress <= lastPercent AND >= 90%
  → Status rotation only: every 2s rotate status text
  
API status === 'merging'
  → Merging phase: Rotate status with progressive timing (5s, 6s, 7s, ...)
```

---

## UI Rendering Flow

### Initial State (Before Submit)
```
#search-view (visible)
  └─ #downloadForm
     ├─ #videoUrl input
     ├─ #format-selector-container (MP3/MP4 toggle + quality)
     └─ Convert button
#result-view (hidden)
#content-area (empty)
#status-container (hidden)
#action-container (hidden)
```

### After Submit (Skeleton Loading)
```
#search-view (hidden)
#result-view (visible)
#content-area (visible)
  └─ .yt-preview-card.skeleton
     ├─ .skeleton-img
     ├─ .skeleton-title
     └─ .skeleton-author
#status-container (visible)
  └─ .status--extracting with spinner
#action-container (visible, all buttons inactive)
```

### After Conversion Complete
```
#content-area (visible)
  └─ .yt-preview-card (real content)
     ├─ Real thumbnail img
     ├─ Real title
     ├─ Real author
     └─ Format/quality badge
#status-container (visible)
  └─ .status--success with checkmark ✓ and "100% Ready"
#action-container (visible)
  ├─ Download button (active/visible)
  ├─ Retry button (hidden)
  └─ Next button (visible)
```

---

## Key Performance Optimizations

1. **Lazy Loading**
   - `startConversion()` imported dynamically [input-form.ts:317]
   - Prevents blocking main UI thread

2. **Non-blocking Metadata Fetch**
   - YouTube metadata fetched asynchronously [input-form.ts:859]
   - Preview skeleton shown immediately
   - Real data fills in when ready

3. **Fake Progress**
   - Server processing shown with fake progress
   - Makes UX feel snappier (don't wait for real API progress)
   - Stops fake progress at 90%, rotates status text after

4. **State-Driven Rendering**
   - Single render callback [downloader-ui.ts:57]
   - State changes trigger UI updates automatically
   - No manual DOM manipulation (except initial render)

5. **Throttled Status Updates**
   - Progress bar updates max once per 1 second [download-rendering.ts:77]
   - Prevents excessive DOM updates

---

## Common Issues & Solutions

### Issue: Action buttons not showing
**Check:**
1. Is conversion task state set to SUCCESS? [download-rendering.ts:191]
2. Is status-container element rendered? [content-renderer.ts:398]
3. Is action-container element rendered? [content-renderer.ts:404]
4. Check browser DevTools: Element visibility, CSS display property

### Issue: Download doesn't work
**Check:**
1. Is downloadUrl in conversion task state? [convert-logic-v2.ts:292]
2. For YouTube: Is link expired (> 6 hours)? [convert-logic-v2.ts:298-305]
3. For iOS: Is ramBlob available? [convert-logic-v2.ts:309-312]
4. Check browser DevTools: Network tab for failed downloads

### Issue: Progress stuck at 90%
**Expected behavior:**
- Fake progress stops at 90% [PollingStrategy.ts:350]
- Status text rotates instead [PollingStrategy.ts:359]
- This is intentional to avoid jumping to 100% too early

### Issue: Polling never completes
**Check:**
1. Is progressUrl returned from API? [convert-logic-v2.ts:232]
2. Is polling timeout set (default 10min)? [concurrent-polling.ts:78]
3. Check browser DevTools: Network tab for polling endpoint
4. Check server logs for `/progress` endpoint errors

---

## Testing Checklist

- [ ] Submit YouTube URL
- [ ] Preview card renders with skeleton
- [ ] Metadata fetches and updates title/author
- [ ] Format selector shows current selection
- [ ] Auto-download triggers
- [ ] Status bar shows "Extracting..."
- [ ] Progress updates from 0% → 100%
- [ ] Status transitions: EXTRACTING → POLLING → SUCCESS
- [ ] Checkmark appears at 100%
- [ ] Download button becomes active
- [ ] Click Download button triggers file download
- [ ] Retry button shows on error
- [ ] Next button returns to search view

---

