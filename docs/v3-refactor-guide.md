# Hướng dẫn Refactor V2 → V3 API

## Tổng quan

Tài liệu này mô tả cách refactor hệ thống download YouTube từ V2 API (`hub.y2mp3.co`) sang V3 API (`api.ytconvert.org`).

## So sánh V2 vs V3

### V2 API (Legacy)
- **Base URL**: `https://hub.y2mp3.co`
- **Flow phức tạp**: Extract → Convert → Poll → Download
- **Strategy Pattern**: iOS RAM, iOS Polling, Windows Polling
- **Nhiều endpoints**: `/extract`, `/convert`, `/check-task`, `/decrypt`

### V3 API (New)
- **Base URL**: `https://api.ytconvert.org`
- **Flow đơn giản**: Create Job → Poll Status → Download
- **Unified flow**: Không cần strategy pattern
- **Chỉ 2 endpoints**:
  - `POST /api/download` - Tạo job
  - `GET /api/status/:id` - Poll status

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    packages/core                             │
├─────────────────────────────────────────────────────────────┤
│  models/remote/v3/                                           │
│  ├── requests/download.request.ts   (V3DownloadRequest)     │
│  └── responses/download.response.ts (StatusResponse, etc.)  │
├─────────────────────────────────────────────────────────────┤
│  mappers/v3/                                                 │
│  ├── download.mapper.ts  (mapToV3DownloadRequest)           │
│  └── error.mapper.ts     (mapErrorCodeToMessage)            │
├─────────────────────────────────────────────────────────────┤
│  services/v3/                                                │
│  └── implementations/download.service.ts                     │
│      (createV3DownloadService → createJob, getStatus)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    apps/ytmp3-clone-darkmode-3               │
├─────────────────────────────────────────────────────────────┤
│  api/v3.ts                                                   │
│  └── apiV3 = { createJob, getStatus }                       │
├─────────────────────────────────────────────────────────────┤
│  features/downloader/logic/conversion/                       │
│  ├── index.ts              ← SWITCH POINT (V2 ↔ V3)         │
│  ├── convert-logic-v2.ts   (Legacy)                         │
│  ├── convert-logic-v3.ts   (New)                            │
│  └── v3/                                                     │
│      ├── types.ts          (TaskState, V3ConversionParams)  │
│      ├── polling.ts        (startPolling)                   │
│      └── error-messages.ts (getErrorMessage)                │
└─────────────────────────────────────────────────────────────┘
```

## Switch Point

File `conversion/index.ts` là điểm chuyển đổi giữa V2 và V3:

```typescript
// V3 API (api.ytconvert.org) - ACTIVE
export {
  startConversion,
  cancelConversion,
  handleDownloadClick,
} from './convert-logic-v3';

// V2 API (hub.y2mp3.co) - LEGACY (commented)
// export {
//   startConversion,
//   cancelConversion,
//   handleDownloadClick,
//   clearSocialMediaCache
// } from './convert-logic-v2';
```

### Chuyển về V2
1. Comment exports từ `convert-logic-v3`
2. Uncomment exports từ `convert-logic-v2`

### Chuyển về V3
1. Comment exports từ `convert-logic-v2`
2. Uncomment exports từ `convert-logic-v3`

## Zero Cross-Import

**Quan trọng**: V2 và V3 hoàn toàn tách biệt, không import lẫn nhau.

- `convert-logic-v2.ts` chỉ import từ V2 modules
- `convert-logic-v3.ts` chỉ import từ V3 modules
- Điều này đảm bảo khi dùng V3, code V2 không được bundle (và ngược lại)

## Flow V3

```
User click Convert
       │
       ▼
┌──────────────────────────────────┐
│ startConversion(params)          │
│ - formatId, videoUrl, videoTitle │
│ - extractV2Options               │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ mapToV3DownloadRequest()         │
│ - Map UI options → V3 request    │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ POST /api/download               │
│ - Returns: { id, title, ... }    │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ startPolling(jobId)              │
│ - Poll every 1 second            │
│ - Max duration: 5 hours          │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ GET /api/status/:id              │
│ - status: pending/completed/error│
│ - progress: 0-100                │
│ - downloadUrl (when completed)   │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ onComplete(downloadUrl)          │
│ - Update UI state                │
│ - Show download button           │
└──────────────────────────────────┘
```

## Configuration

### environment.ts

```typescript
api: {
  baseUrlV3: 'https://api.ytconvert.org',
},
timeouts: {
  v3CreateJob: 3600000,        // 1 hour
  v3GetStatus: 55000,          // 55 seconds
  v3PollingInterval: 1000,     // 1 second
  v3MaxPollingDuration: 18000000, // 5 hours
}
```

## Interface

### V3ConversionParams (Input)

```typescript
interface V3ConversionParams {
  formatId: string;
  videoUrl: string;
  videoTitle: string;
  extractV2Options: {
    downloadMode?: 'video' | 'audio';
    videoQuality?: string;      // '720', '1080', etc.
    youtubeVideoContainer?: string; // 'mp4', 'webm'
    audioBitrate?: string;      // '128', '320', etc.
    audioFormat?: string;       // 'mp3', 'wav', etc.
  };
}
```

### V3DownloadRequest (API)

```typescript
interface V3DownloadRequest {
  url: string;
  os?: 'windows' | 'macos' | 'linux' | 'ios' | 'android';
  output: {
    type: 'video' | 'audio';
    format: string;
    quality?: string;
  };
  audio?: {
    format: string;
    bitrate: string;
  };
}
```

## Các file cần sửa khi thêm app mới

1. **environment.ts** - Thêm V3 config:
   ```typescript
   api: { baseUrlV3: 'https://api.ytconvert.org' },
   timeouts: { v3CreateJob, v3GetStatus, v3PollingInterval, v3MaxPollingDuration }
   ```

2. **api/v3.ts** - Copy từ app mẫu, không cần sửa

3. **conversion/v3/** - Copy folder từ app mẫu

4. **convert-logic-v3.ts** - Copy từ app mẫu

5. **conversion/index.ts** - Thêm switch point

6. **Các file gọi conversion** - Update import path:
   ```typescript
   // Trước (V2)
   import { startConversion } from './conversion/convert-logic-v2';

   // Sau (Switch point)
   import { startConversion } from './conversion';
   ```

## Error Handling

V3 error codes được map sang user-friendly messages:

| Error Code | Message |
|------------|---------|
| INVALID_URL | Invalid YouTube URL |
| VIDEO_NOT_FOUND | Video not found or unavailable |
| EXTRACT_FAILED | Failed to extract video |
| JOB_NOT_FOUND | Download job not found |
| INTERNAL_ERROR | Server error. Please try again. |

## Debug

Console logs với prefix `[ConvertLogicV3]`:

```
[ConvertLogicV3] === START CONVERSION V3 ===
[ConvertLogicV3] formatId: mp3-128
[ConvertLogicV3] videoUrl: https://youtube.com/watch?v=xxx
[ConvertLogicV3] Phase 1: Creating job...
[ConvertLogicV3] Job created: { id: "abc123", title: "Video Title" }
[ConvertLogicV3] Phase 2: Starting polling for job: abc123
[ConvertLogicV3] Progress: 25
[ConvertLogicV3] Progress: 50
[ConvertLogicV3] Progress: 75
[ConvertLogicV3] Progress: 100
[ConvertLogicV3] Completed! Download URL: https://...
[ConvertLogicV3] === END CONVERSION V3 ===
```

## Bundle Size

V3 có bundle size nhỏ hơn V2 do không cần:
- Strategy pattern code
- Multiple device-specific handlers
- Complex state machines

Ví dụ: `downloader-ui.js` giảm từ 110KB → 92KB (giảm ~16%)
