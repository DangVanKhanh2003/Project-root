# Y2MATEPRO MODAL - QUICK REFERENCE

## File Paths (Absolute)

| Component | Path |
|-----------|------|
| **Core Modal** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/ui-components/modal/conversion-modal.ts` |
| **Modal CSS** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/styles/reusable-packages/conversion-modal/conversion-modal.css` |
| **Orchestrator** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/convert-logic-v2.ts` |
| **Controller** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/conversion-controller.ts` |
| **State Mgmt** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/state/conversion-state.ts` |
| **Progress Bar** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/ui-components/progress-bar/progress-bar-manager.ts` |
| **Polling Mgr** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/concurrent-polling.ts` |
| **Types** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/types.ts` |
| **Base Strategy** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/application/strategies/BaseStrategy.ts` |
| **Static Strategy** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/application/strategies/StaticDirectStrategy.ts` |
| **iOS RAM Strategy** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/application/strategies/IOSRamStrategy.ts` |
| **Polling Strategy** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts` |
| **Other Stream Strategy** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/application/strategies/OtherStreamStrategy.ts` |
| **Strategy Factory** | `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/src/features/downloader/logic/conversion/application/strategies/StrategyFactory.ts` |

---

## 5 Routing Cases at a Glance

```
CASE 1: STATIC_DIRECT
├─ Condition: status = 'static'
├─ Flow: EXTRACTING → SUCCESS (instant)
├─ Progress: None
└─ Handler: StaticDirectStrategy

CASE 2: IOS_RAM
├─ Condition: iOS + MP3 + ≤150MB
├─ Flow: EXTRACTING → CONVERTING (Double trick) → SUCCESS
├─ Progress: "45 MB / 150 MB" (no %)
└─ Handler: IOSRamStrategy

CASE 3: IOS_POLLING
├─ Condition: iOS + (MP4 | MP3>150MB)
├─ Flow: EXTRACTING → CONVERTING → SUCCESS
├─ Progress: 4 Layers (0→5→10→95→100%)
└─ Handler: PollingStrategy

CASE 4: WINDOWS_MP4_POLLING
├─ Condition: Windows + MP4
├─ Flow: EXTRACTING → CONVERTING → SUCCESS
├─ Progress: 4 Layers (same as Case 3)
└─ Handler: PollingStrategy

CASE 5: OTHER_STREAM
├─ Condition: Other platforms + stream
├─ Flow: EXTRACTING → CONVERTING (100ms) → SUCCESS
├─ Progress: None (instant)
└─ Handler: OtherStreamStrategy
```

---

## Modal States

| State | Visual | Progress Bar | Actions |
|-------|--------|--------------|---------|
| **EXTRACTING** | Spinner + "Extracting..." | None | Cancel only |
| **CONVERTING** | Progress text "Converting... X%" | Yes (MB or %) | Cancel only |
| **SUCCESS** | "Ready to Download" | None | Download, Close |
| **ERROR** | Error message | None | Retry, Close |
| **EXPIRED** | "Link expired..." | None | Retry, Close |

---

## Key Classes & Interfaces

### ConversionModal
```typescript
class ConversionModal {
  open(options)                          // Start modal
  close()                                // Stop modal
  transitionToConverting()               // EXTRACTING → CONVERTING
  transitionToSuccess(url)               // Show download button
  transitionToError(message)             // Show error
  transitionToExpired(title)             // Show expiration
  showDownloadButton(url)                // Render SUCCESS
  getProgressBarManager()                // Get progress manager
  getAbortSignal()                       // Get abort signal
}
```

### ProgressBarManager
```typescript
class ProgressBarManager {
  startDownloadingPhase(options)         // RAM download mode (MB progress)
  startPollingPhase()                    // Polling mode (% progress)
  updateDownloadProgress(percent, text)  // Update MB progress
  updatePollingProgress(percent, text)   // Update % progress
  completePollingPhase(callback)         // Animate to 100%
  reset()                                // Clear state
  stop()                                 // Stop animations
}
```

### IConversionStrategy
```typescript
interface IConversionStrategy {
  execute(): Promise<StrategyResult>     // Run strategy
  cancel(): void                         // Abort strategy
  getName(): string                      // Strategy name
}
```

---

## Custom Events

```typescript
// Modal opens
window.addEventListener('conversion:modal-opened', (e) => {
  // e.detail: { formatId, status, videoTitle }
});

// Modal closes
window.addEventListener('conversion:modal-closed', (e) => {
  // e.detail: { formatId }
});

// User cancels
window.addEventListener('conversion:cancel', (e) => {
  // e.detail: { formatId }
});

// User downloads
window.addEventListener('conversion:download', (e) => {
  // e.detail: { formatId, downloadUrl }
});

// User retries
window.addEventListener('conversion:retry', (e) => {
  // e.detail: { formatId, previousError }
});
```

---

## Progress Display Patterns

### iOS RAM (Case 2)
```
"Downloading... 45 MB / 150 MB"
```
- Uses `updateDownloadProgress(percent, statusText)`
- No % appended

### Polling Cases (3 & 4) - 4 Layers
```
Layer 1 (0-5%):    "Converting... 1%" through "Converting... 5%"   [200ms animation]
Layer 2 (5-10%):   "Converting... 6%" through "Converting... 10%"  [Server starting]
Layer 3 (10-95%):  "Converting... 45%"                             [Real API progress]
Layer 4 (95-100%): "Converting... 98%"                             [Merging phase]
```
- Uses `updatePollingProgress(percent, statusText)`
- % appended by manager
- "Never backwards" rule: max(newProgress, lastProgress)

---

## State Management Functions

```typescript
// Set/update task
setConversionTask(formatId, { state, downloadUrl, ... })

// Get task by ID
getConversionTask(formatId)

// Update specific fields
updateConversionTask(formatId, { progress: 50, statusText: 'Processing...' })

// Remove task
clearConversionTask(formatId)

// Get all tasks
getConversionTasks()

// Query by state
getConversionTasksByState('Converting')
```

---

## Polling Manager

```typescript
class ConcurrentPollingManager {
  startPolling(formatId, {
    progressUrl,
    onProgressUpdate(data),  // { videoProgress, audioProgress, status, mergedUrl }
    onStatusUpdate(result)   // Called when status changes
  })

  stopPolling(formatId)      // Stop polling for format
  
  // Config:
  maxConcurrent: 5           // Max 5 polls running
  pollInterval: 1000ms       // Poll every 1 second
  maxDuration: 10min         // Max 10 min polling total
}
```

---

## Common Patterns

### Abort Signal Checking
```typescript
// Always check AFTER async operations
async execute() {
  const result = await api.call();
  if (this.checkAborted()) return;  // ← Check here
  // Continue with result
}
```

### Cleanup on Cancel
```typescript
strategy.cancel() {
  this.isAborted = true;
  getPollingManager().stopPolling(formatId);    // Stop polls
  this.stopMergingAnimation();                   // Clear intervals
  this.resolvePromise(cancelledResult());       // Resolve promise
}
```

### Progress Never Backwards
```typescript
const newPercent = Math.max(apiProgress, lastPercent);
updateProgress(newPercent);
```

### Blob Cleanup (iOS)
```typescript
function downloadFromBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  trigger(a, url);
  URL.revokeObjectURL(url);  // ← IMPORTANT cleanup
}
```

---

## Testing Checklist

- [ ] Case 1: Static file downloads instantly
- [ ] Case 2: iOS audio shows MB progress
- [ ] Case 3: iOS video shows 4-layer % progress
- [ ] Case 4: Windows MP4 shows 4-layer % progress
- [ ] Case 5: Other platforms instant success
- [ ] Close during EXTRACTING → modal closes, extract cancels
- [ ] Close during CONVERTING → polling stops, modal closes
- [ ] Network error → ERROR state with retry
- [ ] Expiration check (YouTube) → EXPIRED state with retry
- [ ] Blob cleanup → No memory leaks
- [ ] Progress never goes backward
- [ ] Max 5 concurrent polls → proper queuing

---

## Architecture Layers

```
┌─────────────────────────────┐
│    UI (ConversionModal)     │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│   Orchestration (convert-   │
│     logic-v2 + controller)  │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Strategies (5 cases via    │
│   Factory pattern)          │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Progress Tracking (Manager │
│   + Polling Manager)        │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  External APIs & State      │
└─────────────────────────────┘
```

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Max concurrent polls | 5 |
| Poll interval | 1 second |
| Max polling duration | 10 minutes |
| Initial animation (Layer 1) | 200ms (0→5%) |
| Modal hide animation | 300ms transition |
| YouTube link expiration | 25 minutes |
| iOS RAM max size | 150 MB |
| MP3 merging estimate | 60-150 seconds |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Polling doesn't stop on modal close | Call `getPollingManager().stopPolling(formatId)` in `strategy.cancel()` |
| Progress goes backwards | Use `Math.max(newProgress, lastProgress)` |
| Memory leak from blob | Call `URL.revokeObjectURL(url)` after download |
| EXTRACTING showing "0 MB" | Use "Double EXTRACTING" trick - don't transition until first chunk |
| Blank modal briefly | Set `min-height` on `.conversion-modal-body` to prevent CLS |
| User can't close during extract | Modal is always cancellable - ensure abort signal propagates |

