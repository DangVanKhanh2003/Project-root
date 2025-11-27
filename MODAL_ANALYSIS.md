# Y2MATEPRO CONVERSION MODAL - COMPREHENSIVE ANALYSIS

## EXECUTIVE SUMMARY

The y2matepro app has a sophisticated popup/modal system for handling video/audio conversions with multiple complex phases and state management. The modal is responsible for displaying conversion progress across 5 different routing cases, managing user interactions, and coordinating with backend polling operations.

**Key Finding:** There are MANY cases to handle when the modal opens - not just simple progress display, but entire orchestration of complex conversion workflows with platform-specific routing decisions.

---

## 1. MODAL COMPONENT STRUCTURE

### 1.1 File Locations

**Core Modal Files:**
- `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/ui-components/modal/conversion-modal.ts`
- `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/styles/reusable-packages/conversion-modal/conversion-modal.css`

**Controller/Logic Files:**
- `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/conversion-controller.ts`
- `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/convert-logic-v2.ts`

**State Management:**
- `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/state/conversion-state.ts`

**Progress Tracking:**
- `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/ui-components/progress-bar/progress-bar-manager.ts`

**Polling Manager:**
- `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/concurrent-polling.ts`

**Strategy Layer (5 Cases):**
- `application/strategies/BaseStrategy.ts` - Abstract base
- `application/strategies/StaticDirectStrategy.ts` - Case 1
- `application/strategies/IOSRamStrategy.ts` - Case 2
- `application/strategies/PollingStrategy.ts` - Cases 3 & 4
- `application/strategies/OtherStreamStrategy.ts` - Case 5
- `application/strategies/StrategyFactory.ts` - Factory

**Type Definitions:**
- `conversion/types.ts` - All enums, interfaces, routing logic

---

## 2. MODAL STATE MACHINE

### 2.1 Modal States (ModalState Interface)

```typescript
interface ModalState {
  status: 'EXTRACTING' | 'CONVERTING' | 'SUCCESS' | 'ERROR' | 'EXPIRED';
  provider: string;
  startTime: number;
  progress: number;
  formatId?: string;
  formatData?: any;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  videoTitle: string;
  videoUrl?: string | null;
}
```

### 2.2 State Transitions

```
User Click Download
       ↓
   modal.open()
       ↓
   Status: EXTRACTING (spinner, no progress bar)
       ↓
API Extract Response
       ↓
Routing Decision (5 cases)
       ↓
   ┌─────────────────────────────────────────┐
   │                                         │
   v                                         v
Case 1,2,5:                              Cases 3,4:
Skip CONVERTING                     Transition to CONVERTING
   v                                         v
Status: SUCCESS              Status: CONVERTING (progress bar)
   v                                         v
Show Download Button              Start Polling/Streaming
   v                                         v
   └─────────────────────────────────────────┘
                     ↓
            Progress Updates
                     ↓
            Status: SUCCESS
                     ↓
         Show Download Button
                     ↓
         User Click Download
                     ↓
            File Download Triggers
                     ↓
            User Can Retry/Cancel
                     ↓
      Status: ERROR or EXPIRED
```

### 2.3 HTML Structure

The modal has 3 sections:

```html
<div id="progressBarWrapper">  <!-- Full-screen backdrop -->
  <div class="conversion-modal-content">
    
    <!-- HEADER: Video title + close button -->
    <div class="conversion-modal-header">
      <h3 class="modal-video-title">${title}</h3>
      <button class="btn-close-modal" data-action="cancel">×</button>
    </div>
    
    <!-- BODY: Changes based on status -->
    <div class="conversion-modal-body">
      <!-- EXTRACTING phase -->
      <div class="conversion-state conversion-state--extracting">
        <div class="loading-spinner-container">
          <div class="spinning-circle"></div>
        </div>
        <h3 class="conversion-title">Extracting...</h3>
        <p class="conversion-message">Preparing your download</p>
      </div>
      
      <!-- CONVERTING phase (progress bar) -->
      <div class="conversion-state conversion-state--converting">
        <h3 class="conversion-title">Converting Video...</h3>
        <div class="conversion-progress">
          <div class="progress-bar-content">
            <!-- ProgressBarManager injects here -->
          </div>
        </div>
      </div>
      
      <!-- SUCCESS phase -->
      <div class="conversion-state conversion-state--success">
        <h3 class="conversion-title">Ready to Download</h3>
        <p class="conversion-message">Your file is ready to download.</p>
        <div class="conversion-actions">
          <button class="btn-download" data-action="download">Download Now</button>
        </div>
      </div>
      
      <!-- ERROR phase -->
      <div class="conversion-state conversion-state--error">
        <h3 class="conversion-title">Conversion Failed</h3>
        <p class="conversion-message conversion-message--error">${errorMsg}</p>
        <div class="conversion-actions">
          <button class="btn-retry" data-action="retry">Retry</button>
        </div>
      </div>
      
      <!-- EXPIRED phase -->
      <div class="conversion-state conversion-state--expired">
        <h3 class="conversion-title">Download Session Expired</h3>
        <p class="conversion-message">This link expired after 25 minutes.</p>
        <div class="conversion-actions">
          <button class="btn-retry" data-action="retry">Retry</button>
        </div>
      </div>
    </div>
    
    <!-- FOOTER: Social sharing -->
    <div class="conversion-modal-footer">
      <div class="social-sharing-container">
        <span>Share with others</span>
        <div class="share-icons">
          <!-- Facebook, WhatsApp, X, Reddit, LinkedIn -->
        </div>
      </div>
    </div>
    
  </div>
</div>
```

---

## 3. EXTRACT → POLLING FLOW (THE MANY CASES)

### 3.1 The 5 Routing Cases

After Extract API returns, `determineRoute()` in types.ts decides which case:

```typescript
enum RouteType {
  STATIC_DIRECT = 'static_direct',      // Case 1
  IOS_RAM = 'ios_ram',                  // Case 2
  IOS_POLLING = 'ios_polling',          // Case 3
  WINDOWS_MP4_POLLING = 'windows_mp4_polling', // Case 4
  OTHER_STREAM = 'other_stream'         // Case 5
}
```

#### **CASE 1: STATIC_DIRECT**

**Conditions:**
- Extract API returns `status = 'static'`
- File is ready immediately, no processing needed

**Flow:**
```
Extract Success
    ↓
Routing Decision: STATIC_DIRECT
    ↓
Status: EXTRACTING (briefly shown)
    ↓
StaticDirectStrategy.execute()
    ↓
Skip CONVERTING phase entirely
    ↓
Status: SUCCESS → Show Download Button
    ↓
Progress: Instant (no progress bar)
```

**Modal Behavior:**
- Brief spinner display
- Immediately shows download button
- No progress updates

**Handler:** `StaticDirectStrategy`

---

#### **CASE 2: IOS_RAM (iOS Audio ≤150MB)**

**Conditions:**
- Platform = iOS
- Format = MP3 (audio)
- Size ≤ 150MB
- Status = 'stream'

**Flow:**
```
Extract Success (status = 'stream')
    ↓
Routing Decision: IOS_RAM
    ↓
Status: EXTRACTING (spinner shown)
    ↓
IOSRamStrategy starts downloading stream to RAM blob
    ↓
First chunk arrives
    ↓
Double EXTRACTING Trick:
  - Keep EXTRACTING state while connecting
  - Transition to CONVERTING only when data arrives
    ↓
Status: CONVERTING (progress bar shows MB/MB)
    ↓
Download completes (blob in RAM)
    ↓
Status: SUCCESS → Show Download Button
    ↓
User clicks Download → Trigger download from blob
```

**Progress Display:**
- "Downloading... 45 MB / 150 MB" (no %)
- Real-time byte progress

**Handler:** `IOSRamStrategy`

**Key Trick:** "Double EXTRACTING"
- Problem: If transition immediately to CONVERTING, user sees "0 MB" while waiting for stream
- Solution: Stay in EXTRACTING with spinner until first data chunk arrives
- Then transition and show real progress

---

#### **CASE 3: IOS_POLLING (iOS Large Streams)**

**Conditions:**
- Platform = iOS
- (Format = MP4) OR (Format = MP3 AND Size > 150MB)
- Status = 'stream'

**Flow:**
```
Extract Success (status = 'stream', progressUrl available)
    ↓
Routing Decision: IOS_POLLING
    ↓
Status: EXTRACTING (spinner)
    ↓
Transition to CONVERTING
    ↓
Status: CONVERTING (progress bar)
    ↓
PollingStrategy starts polling progressUrl
    ↓
4-Layer Progress System:
  Layer 1: 0→5% (200ms initial animation)
  Layer 2: 5→10% (no_download handling, +1%/poll)
  Layer 3: 10→95% (real API progress)
  Layer 4: 95→100% (merging phase animation)
    ↓
mergedUrl Received
    ↓
Status: SUCCESS → Show Download Button
    ↓
User clicks Download → Direct download or blob
```

**Progress Display:**
- "Converting... 5%" (Layer 1)
- "Converting... 8%" (Layer 2, API not ready)
- "Converting... 45%" (Layer 3, real progress)
- "Converting... 92%" (Layer 4, merging MP3)
- "Converting... 100%" (complete)

**Handler:** `PollingStrategy`

---

#### **CASE 4: WINDOWS_MP4_POLLING (Windows MP4)**

**Conditions:**
- Platform = Windows
- Format = MP4
- Status = 'stream'

**Flow:** Identical to Case 3

**Reason:** Windows needs server-side merging for MP4 (video + audio)

**Handler:** `PollingStrategy` (shared)

---

#### **CASE 5: OTHER_STREAM (Other Platforms)**

**Conditions:**
- Platform = Other (Mac, Linux, Android, etc.)
- Status = 'stream'

**Flow:**
```
Extract Success (status = 'stream')
    ↓
Routing Decision: OTHER_STREAM
    ↓
Status: EXTRACTING (spinner)
    ↓
100ms Brief CONVERTING phase
    ↓
Status: SUCCESS → Show Download Button with Stream URL
    ↓
User clicks Download → Direct stream download
```

**Progress Display:** None (instant)

**Reason:** These platforms support direct stream download

**Handler:** `OtherStreamStrategy`

---

### 3.2 Routing Decision Logic

```typescript
function determineRoute(extractResult, formatData): RoutingDecision {
  const format = formatData.format || formatData.type;
  const sizeMB = extractResult.size / (1024*1024);
  const isAudio = isAudioFormat(format);
  
  // Case 1: Static
  if (extractResult.status === 'static') {
    return STATIC_DIRECT;
  }
  
  // Cases 2 & 3: iOS
  if (isIOS()) {
    if (isAudio && sizeMB <= 150) {
      return IOS_RAM;  // Case 2
    } else {
      return IOS_POLLING;  // Case 3
    }
  }
  
  // Case 4: Windows MP4
  if (isWindows() && format === 'mp4') {
    return WINDOWS_MP4_POLLING;
  }
  
  // Case 5: Default
  return OTHER_STREAM;
}
```

---

## 4. STATE MANAGEMENT ARCHITECTURE

### 4.1 ConversionTask State

Each format ID has a task in global state:

```typescript
interface ConversionTask {
  id: string;
  sourceId: string;
  quality: string;
  format: string;
  state: TaskState; // 'Converting' | 'Success' | 'Failed' | etc.
  statusText: string;
  showProgressBar: boolean;
  downloadUrl: string | null;
  error: string | null;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  abortController: AbortController;
  formatData: FormatData;
  filename?: string;
  ramBlob?: Blob; // For iOS RAM downloads
}
```

### 4.2 State Functions (conversion-state.ts)

```typescript
setConversionTask(formatId, taskData)       // Create/update task
getConversionTask(formatId)                 // Get task by ID
updateConversionTask(formatId, updates)     // Partial update
clearConversionTask(formatId)               // Delete + abort
```

### 4.3 Modal-Task Coordination

```
User Click Download
  ↓
startConversion() in convert-logic-v2.ts
  ↓
setConversionTask(formatId, { state: 'Extracting', ... })
  ↓
modal.open({ formatId, videoTitle, ... })
  ↓
Extract API Call
  ↓
updateConversionTask(formatId, { state: 'Polling', ... })
  ↓
Strategy updates state as progress changes
  ↓
markSuccess(downloadUrl) or markFailed(error)
  ↓
modal.transitionToSuccess() or modal.transitionToError()
```

---

## 5. PROGRESS TRACKING SYSTEM

### 5.1 Two Progress Modes

#### **Mode A: MB-Based (iOS RAM)**

Used for Case 2 (iOS audio download to RAM)

```
ProgressBarManager.updateDownloadProgress(percent, statusText)

statusText = "Downloading... 45 MB / 150 MB"  // No % appended
```

#### **Mode B: Percentage-Based (Polling)**

Used for Cases 3 & 4 (Polling)

```
ProgressBarManager.updatePollingProgress(percent, statusText)

statusText = "Converting... 45%"  // % appended by manager
```

### 5.2 4-Layer Polling Progress (Cases 3 & 4)

**Layer 1: Initial Animation (0→5%, 200ms)**
```typescript
playInitialAnimation() {
  for (i = 1; i <= 5; i++) {
    updateProgress(i);
    await delay(40ms);  // 200ms / 5 = 40ms per step
  }
}
// Immediate user feedback while polling starts
```

**Layer 2: no_download Handling (5→10%, +1%/poll)**
```typescript
handleNoDownload() {
  if (lastPercent < 10) {
    lastPercent = Math.min(lastPercent + 1, 10);
    updateProgress(lastPercent);
  }
}
// Server not ready, show activity every poll
```

**Layer 3: Real Progress (10→95%, API data)**
```typescript
const apiData = api response {
  videoProgress: 45,
  audioProgress: 30
};

// For MP3: use audioProgress only
// For MP4: use weighted average (60% video, 40% audio)
const raw = isAudio 
  ? apiData.audioProgress 
  : apiData.videoProgress * 0.6 + apiData.audioProgress * 0.4;

// Map 0-100 API progress to 10-95 display range
const display = 10 + (raw / 100) * 85;
updateProgress(display);
```

**Layer 4: Merging Phase (95→100%)**
```typescript
// MP4: Instant merge, just jump to 95%
if (!isAudio) {
  lastPercent = 95;
  updateProgress(95);
}

// MP3: Slow encode (60-150s), animate progress
if (isAudio) {
  startMergingPhase();  // Animate 60→95% over ~60s
}

// When mergedUrl arrives → 100%
updateProgress(100);
```

---

## 6. EVENT HANDLING & USER INTERACTIONS

### 6.1 Custom Events

Modal dispatches these events (window-level):

```typescript
conversion:modal-opened  // Detail: { formatId, status, videoTitle }
conversion:modal-closed  // Detail: { formatId }
conversion:cancel        // Detail: { formatId }
conversion:download      // Detail: { formatId, downloadUrl }
conversion:retry         // Detail: { formatId }
```

### 6.2 Event Listeners (conversion-controller.ts)

```typescript
window.addEventListener('conversion:cancel', (event) => {
  const { formatId } = event.detail;
  cancelConversion();  // Stop polling, abort strategy
});

window.addEventListener('conversion:download', (event) => {
  const { formatId, downloadUrl } = event.detail;
  handleDownloadClick(formatId);  // Trigger actual download
});

window.addEventListener('conversion:retry', (event) => {
  const { formatId } = event.detail;
  // Get original formatData and restart conversion
  startConversion({ formatId, formatData, videoTitle, videoUrl });
});

window.addEventListener('conversion:modal-closed', (event) => {
  const { formatId } = event.detail;
  clearSocialMediaCache(formatId);  // Clean cache (social media only)
});
```

### 6.3 User Interactions

**Click Handlers:**
```html
<button data-action="cancel">×</button>      → handleCancel()
<button data-action="download">Download</button> → handleDownload()
<button data-action="retry">Retry</button>   → handleRetry()
```

**Overlay Click:**
- Click on backdrop (not content) → Pulse animation (visual feedback)
- Discourages closing during active conversion

**Keyboard:**
- Press Escape → handleCancel() (close modal)

---

## 7. COMPLEX EDGE CASES & ERROR HANDLING

### 7.1 User Closes Modal During Extract Phase

```
User clicks X while Status = EXTRACTING
  ↓
handleCancel()
  ↓
Dispatch 'conversion:cancel' event
  ↓
abortController.abort()
  ↓
Extract API request gets AbortSignal
  ↓
If request in-flight: abort it
  ↓
Modal closes: visibility=hidden, opacity=0
  ↓
300ms later: wrapper.innerHTML = '' (cleanup)
```

**Check:** `if (abortController.signal.aborted) { return; }` in strategy

---

### 7.2 User Closes Modal During Polling

```
User clicks X while Status = CONVERTING (polling)
  ↓
handleCancel()
  ↓
abortController.abort()
  ↓
Strategy.cancel()
  ↓
PollingStrategy.cancel()
  ↓
- stopMergingAnimation() (clear interval)
- getPollingManager().stopPolling(formatId) (stop API polls)
- Resolve promise with cancelledResult()
  ↓
updateConversionTask(formatId, { state: 'Canceled' })
  ↓
Modal closes
```

**Important:** Polling manager MUST stop, otherwise intervals leak

---

### 7.3 Network Error During Extraction

```
Extract API throws error (500, timeout, etc.)
  ↓
catch (error) in startConversion()
  ↓
If aborted: ignore (user closed)
  ↓
Else: modal.transitionToError(errorMessage)
  ↓
Status: ERROR
  ↓
Show Retry button
```

---

### 7.4 Network Error During Polling

```
Polling manager hits API error
  ↓
_handlePollingError(formatId, error)
  ↓
stopPolling(formatId)
  ↓
updateConversionTask(formatId, { state: 'Failed', error })
  ↓
modal.transitionToError(errorMessage)
  ↓
Status: ERROR
  ↓
Show Retry button
```

---

### 7.5 Download Link Expires (YouTube Only)

YouTube links expire after 25 minutes. When user clicks download button:

```
User clicks "Download Now" button
  ↓
handleDownloadClick(formatId)
  ↓
If YouTube platform:
  - completedAt = task.completedAt
  - Check: 25 minutes elapsed since completedAt?
  - If yes: modal.transitionToExpired()
  ↓
Status: EXPIRED
  ↓
Show Retry button (restarts conversion)
```

**Check:** `isLinkExpired(completedAt)` in utils/link-validator.ts

---

### 7.6 Multiple Concurrent Conversions

```
User clicks download on Format A
  ↓
setConversionTask('formatA', { ... })
  ↓
User clicks download on Format B (while A converting)
  ↓
setConversionTask('formatB', { ... })
  ↓
Polling Manager: Max 5 concurrent polls
  ↓
Format A polling: Active
Format B polling: Queued (until A completes)
  ↓
When A completes: _processQueue()
  ↓
Format B polling: Moves from queue to active
```

**Limit:** `maxConcurrent = 5` in ConcurrentPollingManager

---

### 7.7 User Downloads, Then Closes Modal

```
Status: SUCCESS (download button showing)
  ↓
User clicks "Download Now"
  ↓
handleDownload() dispatches 'conversion:download'
  ↓
triggerDownload(url) or downloadFromBlob(ramBlob)
  ↓
Browser handles download (separate from modal)
  ↓
User can close modal without interrupting download
  ↓
handleCancel() → modal closes
  ↓
Event: 'conversion:modal-closed'
  ↓
clearSocialMediaCache(formatId) - cleanup
```

---

### 7.8 RAM Blob Cleanup (iOS Case 2)

```
IOSRamStrategy downloads to blob
  ↓
Mark success: updateConversionTask(formatId, { ramBlob: blob })
  ↓
When user clicks Download:
  - const url = URL.createObjectURL(blob)
  - Trigger download
  - URL.revokeObjectURL(url) ← Important cleanup
  ↓
When modal closes:
  - task.ramBlob reference cleared
  - Browser garbage collects blob
```

**Cleanup in convert-logic-v2.ts:**
```typescript
function downloadFromBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);  // IMPORTANT: cleanup
}
```

---

## 8. CSS ARCHITECTURE

### 8.1 Critical CSS (Mobile-First)

File: `conversion-modal.css`

**Base Styles (0-350px):**
```css
#progressBarWrapper {
  position: fixed;
  inset: 0;
  z-index: var(--pkg-conversion-modal-z-index);
  background: rgba(0,0,0,0.5);
  visibility: hidden;
  opacity: 0;  /* Hidden by default */
}

#progressBarWrapper[style*="visible"] {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.2s ease-out;
}

.conversion-modal-content {
  max-width: 400px;  /* Mobile base */
  border-radius: var(--pkg-radius-md);
  transform: scale(1);
}

.spinning-circle {
  width: 32px;
  height: 32px;
  border: 3px solid var(--pkg-conversion-spinner-bg);
  border-top: 3px solid var(--pkg-color-primary);
  animation: spin 0.5s linear infinite;  /* 1.5x faster */
}
```

**Responsive Breakpoints:**
- 0-350px: max-width 400px
- 351-599px: max-width 440px
- 600-839px: max-width 480px
- 840-1239px: max-width 500px
- 1240-1919px: max-width 520px
- 1920-2559px: max-width 560px
- 2560px+: max-width 600px

### 8.2 CLS (Cumulative Layout Shift) Prevention

```css
.conversion-modal-body {
  min-height: 180px;  /* Prevent layout shift between states */
}

.loading-spinner-container {
  height: 48px;  /* Fixed height prevents shift */
}

.conversion-state {
  height: fit-content;
  gap: 10px;  /* Consistent spacing */
}

/* Images have width/height to prevent shift */
.share-icons img {
  width: 28px;
  height: 28px;
  display: block;
}
```

### 8.3 Pulse Animation (Overlay Click Feedback)

```css
@keyframes modalPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

.conversion-modal-content.pulse {
  animation: modalPulse 280ms ease-in-out;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .conversion-modal-content.pulse {
    animation: none;
    border: 2px solid var(--pkg-color-primary);
  }
}
```

---

## 9. KEY LIFECYCLE METHODS

### 9.1 ConversionModal Class

```typescript
// Constructor
constructor(wrapperSelector: string)
  // Find wrapper element
  // Bind event handlers
  // Initialize state to null

// Open modal (starting EXTRACTING phase)
async open(options: any)
  // Create initial state
  // Render HTML
  // Attach event listeners
  // Show modal (visibility/opacity)
  // Dispatch 'conversion:modal-opened' event

// Close modal
async close()
  // Abort all signals
  // Cleanup (timers, listeners)
  // Hide modal
  // Dispatch 'conversion:modal-closed' event

// Transitions (during conversion)
transitionToConverting()     // EXTRACTING → CONVERTING
transitionToSuccess(url)     // Any → SUCCESS
transitionToError(message)   // Any → ERROR
transitionToExpired(title)   // Any → EXPIRED

// Show download button
showDownloadButton(url)      // Render SUCCESS state

// Get references
getProgressBarManager()      // Access progress bar
getAbortSignal()            // Get AbortSignal for API calls
```

### 9.2 Cleanup Sequence on Close

```typescript
close() {
  // 1. Stop any ongoing operations
  abortController.abort();
  
  // 2. Clear timers (timeout stack)
  timers.forEach(id => clearTimeout(id));
  
  // 3. Cleanup progress bar
  progressBarManager?.stop();
  progressBarManager?.reset();
  
  // 4. Remove event listeners
  removeEventListeners();
  
  // 5. Hide with transition
  hide();  // visibility: hidden, opacity: 0
  
  // 6. Clear HTML (300ms later)
  setTimeout(() => {
    wrapper.innerHTML = '';
  }, 300);
}
```

---

## 10. KEY FUNCTIONS & RESPONSIBILITIES

### 10.1 convert-logic-v2.ts

```typescript
// Main entry point
async startConversion(params: ConversionParams)
  // 1. Set task state to EXTRACTING
  // 2. Open modal in EXTRACTING phase
  // 3. Call Extract API
  // 4. Determine routing (5 cases)
  // 5. Create strategy based on route
  // 6. Execute strategy
  // 7. Handle result or error

// Cancel ongoing conversion
cancelConversion()
  // currentStrategy?.cancel()
  // Stop polling, abort signals

// Handle download click
handleDownloadClick(formatId)
  // Check YouTube expiration
  // Trigger download (blob or URL)

// Clear cache after modal closes
clearSocialMediaCache(formatId)
  // Only for non-YouTube (social media)
  // Clear task and format cache
```

### 10.2 ConversionModal Methods

```typescript
// Rendering
private renderFullModal()       // Create header/body/footer
private updateBodyContent()     // Update only body based on status
private renderExtracting()      // Spinner + "Extracting..."
private renderConverting()      // Progress bar container
private renderSuccess()         // Download button
private renderError()           // Error message + Retry
private renderExpired()         // Expired message + Retry

// State management
transitionToConverting()        // EXTRACTING → CONVERTING
transitionToSuccess(url)        // Show download button
transitionToError(msg)          // Show error
transitionToExpired(title)      // Show expiration

// Event handling
private attachEventListeners()  // Click, Escape, overlay
private removeEventListeners()  // Cleanup
private handleClick(event)      // Delegate click actions
private handleCancel()          // Close modal
private handleDownload()        // Dispatch download event
private handleRetry()           // Dispatch retry event

// Lifecycle
private cleanup()               // Clear timers, listeners
private cleanupProgress()       // Stop progress bar
private show()                  // visibility: visible
private hide()                  // visibility: hidden (then clear HTML)
```

### 10.3 PollingStrategy Methods

```typescript
async execute()
  // Validate progressUrl
  // Update task state to POLLING
  // Start polling immediately
  // Return promise (resolves when mergedUrl arrives)

private async playInitialAnimation()
  // Layer 1: 0→5% in 200ms

private handleProgress(rawData)
  // Layer 2: Handle no_download status
  // Layer 3: Real API progress
  // Layer 4: Detect/handle merging phase

private handleNoDownload()
  // Increment +1% per poll (5→10%)

private startMergingPhase()
  // MP4: Instant (jump to 95%)
  // MP3: Animate progress 60→95% over ~60s

private handleComplete(mergedUrl)
  // Stop polling
  // Mark success
  // Show download button
  // Resolve promise
```

---

## 11. POTENTIAL ISSUES & GOTCHAS

### 11.1 "Many Cases When Modal Opens"

The modal opening isn't simple - it orchestrates:

1. **Extract Phase**
   - API call (could timeout/fail)
   - Platform detection (iOS? Windows?)
   - Routing decision (5 different paths)
   - Format validation

2. **State Transitions**
   - Not all cases need CONVERTING phase
   - Some cases skip directly to SUCCESS
   - iOS RAM has "Double EXTRACTING" trick

3. **Progress Systems**
   - Different for each case (MB vs %)
   - 4 layers of complexity for polling
   - Never-backward rule

4. **Event Handling**
   - Modal must be cancellable at any phase
   - Each phase has different abort logic
   - Memory cleanup crucial

5. **Edge Cases**
   - Link expiration (YouTube)
   - Network errors (retry logic)
   - Concurrent conversions (queuing)
   - Blob cleanup (iOS RAM)

### 11.2 Common Mistakes

**Mistake 1: Not checking aborted signal**
```typescript
// WRONG: Can execute after abort
strategy.execute() {
  const result = await api.call();  // ← Could execute after abort
  modal.update(result);
}

// RIGHT: Check after async
strategy.execute() {
  const result = await api.call();
  if (this.checkAborted()) return;  // ← Check after await
  modal.update(result);
}
```

**Mistake 2: Not cleaning up polling**
```typescript
// WRONG: Intervals leak
strategy.cancel() {
  // Forgot to stop polling
}

// RIGHT: Clean up all resources
strategy.cancel() {
  this.isAborted = true;
  getPollingManager().stopPolling(this.ctx.formatId);
  this.stopMergingAnimation();
  this.resolvePromise(cancelledResult());
}
```

**Mistake 3: Progress going backwards**
```typescript
// WRONG: Can jump backward if API returns lower value
const newPercent = apiProgress;
updateProgress(newPercent);

// RIGHT: Use never-backward rule
const newPercent = Math.max(apiProgress, lastPercent);
updateProgress(newPercent);
```

**Mistake 4: Not handling blob cleanup**
```typescript
// WRONG: Memory leak
const blob = await download();
updateTask({ ramBlob: blob });
// Blob stays in memory forever

// RIGHT: Cleanup after download
function downloadFromBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  trigger(url);
  URL.revokeObjectURL(url);  // ← Cleanup
}
```

---

## 12. TESTING CHECKLIST

### 12.1 Case Testing

- [ ] **Case 1 (Static):** Extract returns static=true → instant download button
- [ ] **Case 2 (iOS RAM):** iOS + MP3 ≤150MB → MB progress, blob download
- [ ] **Case 3 (iOS Polling):** iOS + MP4 or MP3>150MB → % progress with polling
- [ ] **Case 4 (Windows Polling):** Windows + MP4 → % progress with polling
- [ ] **Case 5 (Other Stream):** Mac/Linux/Android → brief CONVERTING, instant SUCCESS

### 12.2 Interaction Testing

- [ ] Close modal during EXTRACTING
- [ ] Close modal during polling (mid-conversion)
- [ ] Click retry after error
- [ ] Click download, then close modal
- [ ] Escape key closes modal
- [ ] Click overlay/backdrop (pulse animation only)
- [ ] Social share buttons work

### 12.3 Edge Case Testing

- [ ] YouTube link expires → transitionToExpired()
- [ ] API timeout → transitionToError()
- [ ] Network error during polling → automatic retry (via polling manager)
- [ ] 2 conversions concurrent → proper queuing
- [ ] Modal close → blob cleanup (no memory leak)
- [ ] Progress never goes backward

---

## SUMMARY

The y2matepro conversion modal is a sophisticated system that:

1. **Handles 5 distinct routing cases** based on platform, format, size, and API status
2. **Manages complex state transitions** with proper abort signals and cleanup
3. **Tracks progress in multiple ways** (MB-based for downloads, %-based for polling)
4. **Implements 4-layer progress** for polling operations with various phases
5. **Coordinates multiple async operations** (Extract → Strategy → Polling → Result)
6. **Prevents common UI issues** (CLS, progress regression, memory leaks)
7. **Provides rich user feedback** with proper transitions, errors, and retry logic

The "many cases" are not bug gotchas, but intentional design decisions for optimal UX across different platform/format/size combinations.

