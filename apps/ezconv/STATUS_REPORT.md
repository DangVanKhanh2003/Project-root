# UI Processing → Merging → Success: Current Behavior (ezconv.pro)

## Scope
This report explains why the status bar sometimes resets to 0% “merging” even when the API already returned completed.

## Current Behavior (Observed)
- The UI enters the **merging transition** whenever it sees:
  - `task.state === 'processing'` **and** `progress >= 100`.
- During this transition, the bar is **reset to 0%** and a CSS animation runs from 0 → 98%.
- If `SUCCESS` arrives right after that, the bar is set to 100% and hidden after ~350ms.

This is why it can look like “complete rồi mà lại về 0%”.

## Evidence (Code Locations)
### 1) Trigger condition for merging
File: `src/features/downloader/ui-render/download-rendering.ts`
- `isMergingPhase` is true when state is `processing` and `progress >= 100`.
- `isTransitionToMerging` triggers the reset/animation.

Relevant lines:
- `isMergingPhase` condition: lines **247–250**
- Merging transition (reset to 0% + class `status--merging`): lines **265–305**

### 2) Reset to 0% in merging transition
File: `src/features/downloader/ui-render/download-rendering.ts`
- The bar is explicitly set to `0%` to start the CSS animation.

Relevant lines:
- Reset to 0%: lines **276–287**

### 3) Success branch sets 100% and hides the bar
File: `src/features/downloader/ui-render/download-rendering.ts`
- On `SUCCESS`, bar set to 100%, add `status--completing`, then hide after 350ms.

Relevant lines:
- SUCCESS handling: **363–382**
- Hide delay: **84–107**

### 4) CSS animation definitions
File: `src/styles/reusable-packages/conversion-status/conversion-status.css`
- Normal fill transition: 0.5s
- Merging animation: 0 → 98% over 40s
- Completing: transition to 100%

Relevant lines:
- Normal fill transition: **57–71**
- Merging animation: **79–101**
- Completing transition: **104–108**

### 5) Polling V3 emits progress=100 before SUCCESS
File: `src/features/downloader/logic/conversion/v3/polling.ts`
- When API status is `completed`, the code still calls `onProgress(100)` **before** `onComplete()`.
- That creates a `processing + progress=100` frame that triggers merging.

Relevant lines:
- `onProgress(100)` in completed: **58–69**

## Why It Happens (Sequence)
1) API returns `completed` → code calls `onProgress(100)`.
2) State remains `processing` at that moment.
3) UI sees `processing + 100` → enters merging transition → resets bar to 0%.
4) Immediately after, `onComplete()` sets `SUCCESS` → bar set to 100% and hidden.

## Optional Fixes (Not Applied)
1) In `polling.ts`, **remove `onProgress(100)`** when status is completed.
2) In UI, only allow merging transition when status is truly “merging” (add a flag or check statusText).

---
Generated: 2026-02-01
