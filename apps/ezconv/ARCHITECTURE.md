# Ezconv — Architecture & Flow Documentation

> **Entry point duy nhất:** [index.html](file:///f:/downloader/Project-root/apps/ezconv/index.html)
> → [src/multi-mode-main.ts](file:///f:/downloader/Project-root/apps/ezconv/src/multi-mode-main.ts)

---

## 1. Sơ đồ module

```
index.html
  └── src/multi-mode-main.ts
        ├── features/multi-mode-downloader/
        │   ├── advanced-settings-controller.ts   (mode switching)
        │   ├── convert-submit-controller.ts       (nút Convert)
        │   └── trim-controller.ts                (player + slider)
        ├── features/downloader/state/
        │   └── video-store.ts                    (store trung tâm)
        ├── features/downloader/logic/multiple-download/services/
        │   └── multi-download-service.ts         (orchestrator)
        ├── features/downloader/logic/multiple-download/
        │   ├── download-runner.ts                (gọi API)
        │   ├── download-queue.ts                 (concurrency)
        │   ├── metadata-fetcher.ts               (title/thumb)
        │   └── url-parser.ts                     (parse URL)
        ├── features/downloader/ui-render/multiple-download/
        │   ├── multiple-download-renderer.ts     (quản lý DOM)
        │   ├── handle-store-change.ts            (store → DOM)
        │   ├── video-item-renderer.ts            (1 item DOM)
        │   ├── multi-download-strategy.ts        (batch strategy)
        │   └── playlist-strategy.ts              (group strategy)
        └── features/shared/form/
            └── format-settings.ts                (lấy settings từ DOM)
```

---

## 2. Table of Files & Key Functions

| File | Function / Class | Dòng | Vai trò |
|------|-----------------|------|---------|
| [multi-mode-main.ts](file:///f:/downloader/Project-root/apps/ezconv/src/multi-mode-main.ts) | `init()` | L1 | Bootstrap toàn bộ app |
| [format-settings.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/shared/form/format-settings.ts) | `getCurrentSettings()` | [L13](file:///f:/downloader/Project-root/apps/ezconv/src/features/shared/form/format-settings.ts#L13) | Snapshot format/quality/audio từ DOM |
| [format-settings.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/shared/form/format-settings.ts) | `initFormatToggle()` | [L78](file:///f:/downloader/Project-root/apps/ezconv/src/features/shared/form/format-settings.ts#L78) | Bind MP3/MP4 buttons, save localStorage |
| [advanced-settings-controller.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/multi-mode-downloader/advanced-settings-controller.ts) | `initAdvancedSettings()` | [L88](file:///f:/downloader/Project-root/apps/ezconv/src/features/multi-mode-downloader/advanced-settings-controller.ts#L88) | Toggle panel + Playlist/Trim switches |
| [convert-submit-controller.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/multi-mode-downloader/convert-submit-controller.ts) | `initConvertForm()` | [L19](file:///f:/downloader/Project-root/apps/ezconv/src/features/multi-mode-downloader/convert-submit-controller.ts#L19) | Bind nút Convert, route theo mode |
| [trim-controller.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/multi-mode-downloader/trim-controller.ts) | `initTrimController()` | [L343](file:///f:/downloader/Project-root/apps/ezconv/src/features/multi-mode-downloader/trim-controller.ts#L343) | Bind #trim-start/#trim-end inputs |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `class VideoStore` | [L17](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L17) | Singleton observable store |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `addItem()` | [L26](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L26) | Thêm item, fires `item:added` |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `removeItem()` | [L34](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L34) | Xóa item, fires `item:removed` |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `updateMetadata()` | [L251](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L251) | Cập nhật title/thumb, auto → `ready` |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `setStatus()` | [L161](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L161) | Đổi trạng thái item |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `setCompleted()` | [L176](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L176) | Lưu downloadUrl, fires `item:updated` |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `setError()` | [L188](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L188) | Đánh dấu lỗi |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `setCancelled()` | [L198](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L198) | Đánh dấu cancelled (có thể retry) |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `updateProgress()` | [L207](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L207) | Cập nhật %, fires `item:progress` |
| [video-store.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts) | `updateSettings()` | [L237](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L237) | Đổi format/quality per-item |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `class MultiDownloadService` | [L13](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L13) | Orchestrator chính |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `addUrls()` | [L20](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L20) | Parse + tạo items, fetch metadata |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `addPlaylist()` | [L90](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L90) | Tạo group playlist + skeletons |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `addSingleVideoAsGroup()` | [L179](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L179) | Single video thành 1 group |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `buildVideoItems()` | [L294](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L294) | Tạo VideoItem[] từ API data |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `startDownload()` | [L367](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L367) | Queue 1 item → download |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `startGroupDownloads()` | [L394](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L394) | Start tất cả items trong group |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `cancelDownload()` | [L428](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L428) | Abort + setCancelled |
| [multi-download-service.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts) | `executeDownload()` | [L458](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L458) | Gọi API, poll progress, callbacks |
| [multiple-download-renderer.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/multiple-download-renderer.ts) | `class MultipleDownloadRenderer` | [L12](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/multiple-download-renderer.ts#L12) | Quản lý DOM container, subscribe store |
| [handle-store-change.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/handle-store-change.ts) | `createStoreChangeHandler()` | [L32](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/handle-store-change.ts#L32) | Store event → DOM update |
| [multi-download-strategy.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/multi-download-strategy.ts) | `class MultiDownloadStrategy` | [L10](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/multi-download-strategy.ts#L10) | Render badges (batch items) |
| [playlist-strategy.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/playlist-strategy.ts) | `class PlaylistStrategy` | [L13](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/playlist-strategy.ts#L13) | Render dropdowns/badges (grouped items) |
| [playlist-strategy.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/playlist-strategy.ts) | `buildLockedSettings()` | [L140](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/playlist-strategy.ts#L140) | Render badge: "MP4 · 720p · 2:01-3:02" |

---

## 3. Khởi động — Thứ tự gọi từ `multi-mode-main.ts`

```
[multi-mode-main.ts]  init()
 │
 ├─ initHeaderScroll() / initMobileMenu() / initLangSelector()
 │   └─ src/features/shared/init/common-init.ts
 │
 ├─ initFormatToggle()
 │   └─ format-settings.ts : L78
 │      → Bind click MP3/MP4 buttons + quality select
 │      → saveFormatPreferences() → localStorage
 │
 ├─ initAudioDropdown()
 │   └─ format-settings.ts
 │      → Sync audio track dropdown → hidden input #multi-audio-track-value
 │
 ├─ multipleDownloadRenderer.useBatchStrategy()
 │   └─ multiple-download-renderer.ts : L12
 │
 ├─ multipleDownloadRenderer.init()
 │   └─ multiple-download-renderer.ts : L12
 │      → Tạo DOM #multiple-downloads-container
 │      → subscribeToStore() → videoStore.subscribe(handler)
 │         → handler = createStoreChangeHandler()  [handle-store-change.ts : L32]
 │
 ├─ initTrimController()
 │   └─ trim-controller.ts : L343
 │      → Bind events #trim-start / #trim-end inputs
 │
 ├─ initAdvancedSettings()
 │   └─ advanced-settings-controller.ts : L88
 │      → Bind Advanced Settings panel toggle
 │      → Bind Playlist Mode / Cut Video Mode switches
 │
 └─ initConvertForm({ getSettings, getTrimStart, getTrimEnd })
     └─ convert-submit-controller.ts : L19
        → Bind click nút #addUrlsBtn
        → getSettings = getCurrentSettings  [format-settings.ts : L13]
```

---

## 4. VideoStore — Nguồn sự thực duy nhất

**File:** [video-store.ts : L17](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/video-store.ts#L17)

Store phát ra 3 loại event mà renderer lắng nghe:

| Event | Khi nào | Renderer làm gì |
|-------|---------|-----------------|
| `item:added` | `addItem()` L26 | Tạo DOM element mới |
| `item:updated` | `setStatus()` L161, `setCompleted()` L176, `updateMetadata()` L251 ... | Update badge/button/settings text |
| `item:progress` | `updateProgress()` L207 | Chỉ update progress bar |

**Kiểu dữ liệu:** [multiple-download-types.ts](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/state/multiple-download-types.ts)

```ts
interface VideoItem {
  id: string          // hash videoId
  url: string         // YouTube URL
  groupId: string     // "multi_xxx" | "PLxxx_ts"
  status: 'fetching_metadata' | 'ready' | 'queued'
        | 'converting' | 'downloading' | 'completed'
        | 'error' | 'cancelled'
  meta: { title, thumbnail, author, duration }
  settings: {
    format: 'mp4' | 'mp3'
    quality: '720p' | '1080p' | ...
    audioTrack?: string
    trimStart?: number        // giây
    trimEnd?: number          // giây
    trimRangeLabel?: string   // "2:01 - 3:02"
  }
  progress: number
  downloadUrl?: string
  isSelected: boolean
}
```

---

## 5. Render Pipeline — Store → DOM

```
videoStore.notify(event, item)
    │
    ▼
multipleDownloadRenderer   [multiple-download-renderer.ts : L12]
    subscribeToStore()
    │
    ▼
createStoreChangeHandler() [handle-store-change.ts : L32]
    │
    ├── 'item:added'    → VideoItemRenderer.createVideoItemElement(item, strategy)
    │                     → chọn strategy theo item.groupId:
    │                       item.groupId → PlaylistStrategy   [playlist-strategy.ts : L13]
    │                       no groupId  → MultiDownloadStrategy [multi-download-strategy.ts : L10]
    │
    ├── 'item:updated'  → VideoItemRenderer.updateVideoItemElement(el, item, strategy)
    │                     → chỉ update: status badge, action button, settings text
    │                     → KHÔNG re-render toàn bộ (efficient)
    │
    └── 'item:progress' → updateProgressOnly(el, item)
                          → chỉ update progress bar DOM
```

**Render badge settings** — `PlaylistStrategy.buildLockedSettings()` [L140](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/ui-render/multiple-download/playlist-strategy.ts#L140):
```ts
const trimLabel = trimRangeLabel ? ` · ${trimRangeLabel}` : '';
return `<span class="item-setting-text">${format} · ${details}${trackLabel}${trimLabel}</span>`;
```

---

## 6. Ba chế độ

### 6.1 Batch Mode (mặc định)

```
User nhập URLs → Bấm Convert
    │
    ▼
convert-submit-controller.ts : L19  →  handleBatchConvert()
    settings = getCurrentSettings()   [format-settings.ts : L13]
    │
    ▼
multi-download-service.ts : L20  →  addUrls(rawText, settings)
    ├─ parseYouTubeURLs()             [url-parser.ts]
    ├─ Tạo VideoItem[], groupId = "multi_ts_rand"
    ├─ item.settings = { format, quality, audioTrack }
    ├─ videoStore.addItem(item) per item  [video-store.ts : L26]
    │   → DOM item xuất hiện (status: 'fetching_metadata')
    └─ fetchMetadataBatch() async     [metadata-fetcher.ts]
        → videoStore.updateMetadata() [video-store.ts : L251]
        → item.status auto → 'ready'
    │
    ▼
multiDownloadService.startGroupDownloads(groupId)  [L394]
    → videoStore.setStatus(id, 'queued')   [L161]
    → downloadQueue.add(id)                [download-queue.ts, max 5]
    → executeDownload(id, signal)          [L458]
        → gọi API, poll progress
        → onProgress → videoStore.updateProgress() [L207]
        → onComplete → videoStore.setCompleted()   [L176]
```

### 6.2 Playlist Mode

```
Bật "Playlist Mode" toggle
    advanced-settings-controller.ts : L88  →  applyPlaylistMode(true)
        → Nếu trim đang bật: applyTrimMode(false) trước

User Convert  →  handlePlaylistModeConvert()
    │
    ├─ URL có playlistId?
    │   └─ multiDownloadService.addPlaylist()  [L90]
    │       ├─ videoStore.addItem() × 8 skeleton items
    │       ├─ fetchPlaylistPage(playlistId)    [L525 trong service file]
    │       ├─ Thay skeleton → real items
    │       └─ nextPageToken? → hiện "Load more" button
    │
    └─ URL chỉ videoId?
        └─ multiDownloadService.addSingleVideoAsGroup()  [L179]
            → 1 group với 1 item, fetch metadata

// Playlist KHÔNG auto-start → user bấm "Convert selected (N)" trong group header
→ multiDownloadService.startSelectedGroupDownloads(groupId)  [L403]
```

### 6.3 Trim / Cut Mode

```
User nhập đúng 1 URL → Bật "Cut Video" toggle
    advanced-settings-controller.ts : L88
        ├─ Validate đúng 1 URL YouTube
        ├─ Nếu playlist đang bật: tắt trước
        └─ loadVideoForTrim(url)
               │
               ▼
           trim-controller.ts : L343
               ├─ loadNoUiSlider()   → inject CDN script/css vào <head>
               ├─ loadYouTubeApi()   → inject YouTube IFrame API script
               └─ createPlayer(videoId)
                   → new YT.Player('stream-player', { videoId })
                   → onReady: duration → initSlider(0, duration)
                              updateTimeInputs() → "#trim-start = 0:00"

User kéo slider / nhập thời gian:
    slider.on('update')    → startTime, endTime cập nhật realtime
    slider.on('slide')     → seekPlayer() → YouTube player seek + pause
    #trim-start blur/enter → syncInputToSlider() → startTime update
    ArrowUp/Down trên input → nudgeTimeInput() → ±1 giây

User bấm Convert:
    convert-submit-controller.ts : L19  →  handleTrimConvert()
        trimStart = getTrimStart()            ← trim-controller module state
        trimEnd   = getTrimEnd()
        trimRangeLabel = getTrimRangeLabel()  // "2:01 - 3:02"

        trimSettings = { ...settings, trimStart, trimEnd, trimRangeLabel }

        multiDownloadService.addUrls(url, trimSettings)  [L20]
            → VideoItem.settings.trimStart  = 121
            → VideoItem.settings.trimEnd    = 182
            → VideoItem.settings.trimRangeLabel = "2:01 - 3:02"
            → videoStore.addItem()   [L26]
            → DOM badge: "MP4 · 720p · 2:01 - 3:02"  ✅
                  └─ playlist-strategy.ts : L140

        multiDownloadService.startGroupDownloads()  [L394]
            → executeDownload()  [L458]
            → buildRequest() → { trimStart: 121, trimEnd: 182 } → POST API  ✅

Tắt Trim mode:
    trim-controller.ts → resetTrimEditor()
        → player.destroy(), slider.destroy()
        → startTime = endTime = 0
```

---

## 7. Download Pipeline chi tiết

```
multiDownloadService.startDownload(id)  [L367]
    │
    ├─ videoStore.setStatus(id, 'queued')  [L161]
    └─ downloadQueue.add(id, executeDownload)
          [download-queue.ts — max 5 concurrent]
               │
               ▼
    executeDownload(id, signal)  [multi-download-service.ts : L458]
        ├─ videoStore.setStatus(id, 'converting')  [L161]
        └─ runSingleDownload({ url, settings, signal, callbacks })
               [download-runner.ts]
                    │
                    ▼
             buildRequest(url, settings)
                 {
                   url, format, quality, audioTrack,
                   ...(isFinite(trimStart) && { trimStart }),
                   ...(isFinite(trimEnd)   && { trimEnd }),
                 }
                    │
                    ▼
             POST /api/v3/...   →   Poll progress
                 onProgress(%)  → videoStore.updateProgress()  [L207]
                 onComplete(url) → videoStore.setCompleted()   [L176]
                 onError(msg)   → videoStore.setError()        [L188]

Cancel:
    multiDownloadService.cancelDownload(id)  [L428]
        → downloadQueue.cancel(id)           (remove nếu chưa chạy)
        → item.abortController.abort()       (abort nếu đang chạy)
        → videoStore.setCancelled(id)  [L198]  → có thể Retry

Retry:
    multiDownloadService.retryDownload(id)  [L449]
        → videoStore.setStatus(id, 'ready')
        → startDownload(id)  [L367]
```

---

## 8. Settings Snapshot

Tại **thời điểm bấm Convert**, `getCurrentSettings()` [format-settings.ts : L13](file:///f:/downloader/Project-root/apps/ezconv/src/features/shared/form/format-settings.ts#L13) đọc từ DOM:

```
#multi-format-btn.active        → format:       'mp4' | 'mp3'
#multi-quality-select-mp4 value → quality:      '720p' | '1080p' | '2160p' | 'webm' | 'mkv' | ...
#multi-quality-select-mp3 value → audioBitrate: '128' | '320' | 'ogg' | 'wav' | 'opus' | 'm4a'
#multi-audio-track-value        → audioTrack:   'original' | 'en' | 'vi' | ...
```

Settings được **copy riêng vào từng VideoItem** tại `addUrls()` [L20](file:///f:/downloader/Project-root/apps/ezconv/src/features/downloader/logic/multiple-download/services/multi-download-service.ts#L20) — cho phép thay đổi per-item trong Playlist mode (dropdown).

---

## 9. Trim Data — End-to-end

```
trim-controller.ts (module state)
    startTime = 121  (giây)
    endTime   = 182  (giây)
         ↓
convert-submit-controller.ts : L19  →  handleTrimConvert()
    trimSettings = { format:'mp4', quality:'720p', trimStart:121, trimEnd:182, trimRangeLabel:'2:01 - 3:02' }
         ↓
multi-download-service.ts : L20  →  addUrls(url, trimSettings)
    VideoItem.settings = trimSettings
    videoStore.addItem()  [L26]
         ↓                          ↓
  DOM badge render:          executeDownload() [L458]
  playlist-strategy.ts:L140    buildRequest()
  "MP4 · 720p · 2:01 - 3:02"  { trimStart:121, trimEnd:182 }
                               POST API  ✅
```
