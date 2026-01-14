# API V3 Refactor Plan

## Mục Tiêu

Refactor hệ thống download YouTube từ API V2 sang API V3 với các yêu cầu:

1. Tạo infrastructure mới cho V3 trong packages/core
2. Tạo convert-logic-v3.ts trong app layer
3. Giữ V2 làm fallback
4. Zero cross-import giữa V2 và V3 (không ảnh hưởng performance)
5. Switch version bằng cách đổi 1 dòng export

---

## API V3 Specifications

### Base URL

https://api.ytconvert.org

### Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/download | Tạo download job |
| GET | /api/status/:id | Check job status |

### Timeout Configuration

| Operation | Timeout |
|-----------|---------|
| POST /api/download | 1 giờ (3,600,000ms) |
| GET /api/status/:id | 55 giây (55,000ms) |
| Polling interval | 1 giây (1,000ms) |
| Max polling duration | 5 giờ (18,000,000ms) |

---

## Cấu Trúc File Mới

### packages/core (V3 Infrastructure)

```
packages/core/src/
├── models/remote/v3/
│   ├── index.ts
│   ├── requests/
│   │   ├── index.ts
│   │   └── download.request.ts
│   └── responses/
│       ├── index.ts
│       └── download.response.ts
│
├── mappers/v3/
│   ├── index.ts
│   ├── download.mapper.ts
│   ├── status.mapper.ts
│   └── error.mapper.ts
│
├── services/v3/
│   ├── index.ts
│   ├── interfaces/
│   │   ├── index.ts
│   │   └── download.interface.ts
│   └── implementations/
│       ├── index.ts
│       └── download.service.ts
│
└── services/constants/
    └── endpoints.ts              (thêm V3_ENDPOINTS)
```

### App Layer (convert-logic-v3)

```
apps/ytmp3-clone-darkmode-3/src/
├── environment.ts                (thêm V3 config)
│
├── api/
│   ├── index.ts                  (thêm V3 service)
│   └── v3.ts                     (V3-specific setup, tách riêng)
│
└── features/downloader/logic/conversion/
    ├── index.ts                  (switch point - đổi 1 dòng để switch)
    ├── convert-logic-v2.ts       (giữ nguyên)
    ├── convert-logic-v3.ts       (tạo mới)
    └── v3/
        ├── index.ts
        ├── types.ts              (V3-specific types)
        ├── polling.ts            (V3 polling logic)
        └── error-messages.ts     (V3 error mapping)
```

---

## Zero Cross-Import Strategy

### Nguyên tắc

1. V2 và V3 là 2 module hoàn toàn độc lập
2. Không file nào được import cả V2 và V3
3. Switch point chỉ có 1 nơi duy nhất

### Cấu trúc Import

```
conversion/index.ts (SWITCH POINT)
│
├── Khi dùng V3:
│   └── export * from './convert-logic-v3'
│       └── import từ './v3/*'
│       └── import từ '@downloader/core' (V3 services)
│
└── Khi dùng V2:
    └── export * from './convert-logic-v2'
        └── import từ './application/*' (strategies)
        └── import từ '@downloader/core' (V2 services)
```

### File conversion/index.ts

Đây là switch point duy nhất. Chỉ cần comment/uncomment 1 dòng:

```
// === SWITCH VERSION HERE ===
// Uncomment ONE of the following:

export { startConversion, cancelConversion, handleDownloadClick } from './convert-logic-v3';
// export { startConversion, cancelConversion, handleDownloadClick } from './convert-logic-v2';
```

### Bundler Behavior

Khi export từ V3:
- Bundler chỉ include convert-logic-v3.ts và dependencies của nó
- convert-logic-v2.ts và strategies/ không được bundle
- Tree-shaking loại bỏ hoàn toàn V2 code

---

## Chi Tiết Implementation

### 1. models/remote/v3/requests/download.request.ts

Định nghĩa request format cho POST /api/download:

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| url | string | Yes | YouTube URL |
| os | string | No | ios, android, macos, windows, linux |
| output | object | Yes | Output configuration |
| output.type | string | Yes | video hoặc audio |
| output.format | string | Yes | mp4, webm, mkv, mp3, m4a, wav, opus, flac |
| output.quality | string | No | 2160p, 1440p, 1080p, 720p, 480p, 360p |
| audio | object | No | Audio configuration |
| audio.trackId | string | No | Audio track ID |
| audio.bitrate | string | No | 64k, 128k, 192k, 320k |
| trim | object | No | Trim configuration |
| trim.start | number | No | Start time in seconds |
| trim.end | number | No | End time in seconds |

### 2. models/remote/v3/responses/download.response.ts

**CreateJobResponse (POST /api/download):**

| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Job ID để poll status |
| title | string | Video title |
| duration | number | Duration in seconds |
| requestedQuality | string | Quality yêu cầu |
| selectedQuality | string | Quality thực tế được chọn |
| qualityChanged | boolean | True nếu quality bị đổi |
| qualityChangeReason | string | Lý do đổi quality |

**StatusResponse (GET /api/status/:id):**

| Field | Type | Mô tả |
|-------|------|-------|
| status | string | pending, completed, error |
| progress | number | 0-100 |
| title | string | Video title |
| duration | number | Duration in seconds |
| detail | object | Progress breakdown (chỉ khi pending) |
| detail.video | number | Video progress 0-100 |
| detail.audio | number | Audio progress 0-100 |
| downloadUrl | string | Download URL (chỉ khi completed) |
| jobError | string | Error message (chỉ khi error) |

**ErrorResponse:**

| Field | Type | Mô tả |
|-------|------|-------|
| error.code | string | Error code |
| error.message | string | Error message |

### 3. mappers/v3/download.mapper.ts

Chuyển đổi từ app format (extractV2Options) sang V3 API format:

| App (extractV2Options) | API V3 |
|------------------------|--------|
| url | url |
| downloadMode: "video" | output.type: "video" |
| downloadMode: "audio" | output.type: "audio" |
| videoQuality: "720" | output.quality: "720p" |
| videoQuality: "1080" | output.quality: "1080p" |
| youtubeVideoContainer: "mp4" | output.format: "mp4" |
| youtubeVideoContainer: "webm" | output.format: "webm" |
| audioBitrate: "128" | audio.bitrate: "128k" |
| audioBitrate: "320" | audio.bitrate: "320k" |
| audioFormat: "mp3" | output.format: "mp3" |
| audioFormat: "m4a" | output.format: "m4a" |
| audioFormat: "wav" | output.format: "wav" |
| audioFormat: "opus" | output.format: "opus" |
| audioFormat: "ogg" | output.format: "opus" |
| audioFormat: "flac" | output.format: "flac" |

Thêm OS detection:
- iOS Safari → os: "ios"
- Android → os: "android"
- macOS → os: "macos"
- Windows → os: "windows"
- Linux → os: "linux"

### 4. mappers/v3/error.mapper.ts

Mapping error codes sang user-friendly messages (English):

| API Error Code | User Message |
|----------------|--------------|
| INVALID_REQUEST | Invalid request. Please try again. |
| VALIDATION_ERROR | Invalid input. Please check your selection. |
| INVALID_URL | Invalid YouTube URL. Please enter a valid link. |
| INVALID_JOB_ID | Invalid job. Please try again. |
| JOB_NOT_READY | Video is still processing. Please wait. |
| UNAUTHORIZED | Session expired. Please refresh the page. |
| FORBIDDEN | Access denied. Please try again. |
| JOB_NOT_FOUND | Job not found. Please try again. |
| VIDEO_NOT_FOUND | Video not available or restricted. |
| AUDIO_NOT_FOUND | Audio track not available. |
| FILE_NOT_FOUND | File not found. Please try again. |
| INTERNAL_ERROR | Server error. Please try again later. |
| EXTRACT_FAILED | Failed to process video. Please try again. |

### 5. services/v3/implementations/download.service.ts

Service với 2 methods:

**createJob(request, signal):**
- POST /api/download
- Timeout: 1 giờ
- Return: CreateJobResponse

**getStatus(jobId):**
- GET /api/status/:id
- Timeout: 55 giây
- Return: StatusResponse

### 6. convert-logic-v3.ts

Flow đơn giản:

```
startConversion(params)
│
├── 1. Map extractV2Options → V3 request format
│
├── 2. Set state: EXTRACTING
│
├── 3. Call api.v3.createJob(request)
│      └── Nhận: { id, title, duration, ... }
│
├── 4. Set state: PROCESSING
│
├── 5. Start polling loop:
│      │
│      ├── Call api.v3.getStatus(jobId)
│      │
│      ├── Update progress bar với response.progress
│      │
│      ├── If status === "completed":
│      │   └── Set state: SUCCESS, save downloadUrl
│      │
│      ├── If status === "error":
│      │   └── Set state: FAILED, show error message
│      │
│      └── If status === "pending":
│          └── Wait 1 second, continue polling
│
└── 6. Done
```

### 7. v3/types.ts

Định nghĩa types đơn giản cho V3:

**TaskState (giữ tương thích với V2 UI):**
- IDLE
- EXTRACTING
- PROCESSING
- SUCCESS
- FAILED
- CANCELED

**V3ConversionTask:**
- jobId: string
- status: TaskState
- progress: number
- downloadUrl: string hoặc null
- error: string hoặc null
- title: string
- duration: number

---

## Environment Configuration

### environment.ts additions

| Key | Value | Mô tả |
|-----|-------|-------|
| api.v3BaseUrl | https://api.ytconvert.org | V3 API base URL |
| api.timeout.v3CreateJob | 3600000 | 1 hour |
| api.timeout.v3GetStatus | 55000 | 55 seconds |
| api.timeout.v3PollingInterval | 1000 | 1 second |
| api.timeout.v3MaxPollingDuration | 18000000 | 5 hours |

---

## Migration Steps

### Step 1: Create V3 Infrastructure in packages/core

1. Tạo models/remote/v3/ với requests và responses
2. Tạo mappers/v3/ với download, status, error mappers
3. Tạo services/v3/ với interface và implementation
4. Update services/constants/endpoints.ts
5. Update index.ts exports

### Step 2: Create V3 Logic in App

1. Update environment.ts với V3 config
2. Tạo api/v3.ts với V3 HTTP client và service
3. Update api/index.ts để export V3 service
4. Tạo conversion/v3/ folder với types, polling, error-messages
5. Tạo convert-logic-v3.ts
6. Update conversion/index.ts làm switch point

### Step 3: Testing

1. Test với V3 API
2. Verify UI/UX giữ nguyên
3. Verify progress bar hoạt động
4. Verify error handling
5. Verify download button và downloadUrl

### Step 4: Switch to V3

1. Update conversion/index.ts để export từ V3
2. Build và test production
3. Deploy

### Step 5: Cleanup (sau khi V3 ổn định)

1. Xóa convert-logic-v2.ts
2. Xóa application/strategies/
3. Xóa V2-specific code không dùng nữa

---

## Rollback Plan

Nếu V3 có vấn đề, rollback bằng cách:

1. Mở conversion/index.ts
2. Comment dòng export V3
3. Uncomment dòng export V2
4. Build và deploy lại

---

## Files to Create (Summary)

### packages/core (8 files)

1. models/remote/v3/index.ts
2. models/remote/v3/requests/index.ts
3. models/remote/v3/requests/download.request.ts
4. models/remote/v3/responses/index.ts
5. models/remote/v3/responses/download.response.ts
6. mappers/v3/index.ts
7. mappers/v3/download.mapper.ts
8. mappers/v3/error.mapper.ts
9. services/v3/index.ts
10. services/v3/interfaces/index.ts
11. services/v3/interfaces/download.interface.ts
12. services/v3/implementations/index.ts
13. services/v3/implementations/download.service.ts

### App Layer (6 files)

1. api/v3.ts
2. features/downloader/logic/conversion/v3/index.ts
3. features/downloader/logic/conversion/v3/types.ts
4. features/downloader/logic/conversion/v3/polling.ts
5. features/downloader/logic/conversion/v3/error-messages.ts
6. features/downloader/logic/conversion/convert-logic-v3.ts

### Files to Update (4 files)

1. packages/core/src/services/constants/endpoints.ts
2. packages/core/src/index.ts
3. apps/ytmp3-clone-darkmode-3/src/environment.ts
4. apps/ytmp3-clone-darkmode-3/src/api/index.ts
5. apps/ytmp3-clone-darkmode-3/src/features/downloader/logic/conversion/index.ts

---

## Notes

1. V2 và V3 hoàn toàn tách biệt, không cross-import
2. Switch version chỉ cần đổi 1 dòng trong conversion/index.ts
3. Bundler sẽ tree-shake version không dùng
4. UX giữ nguyên, chỉ thay đổi logic bên dưới
5. Progress dùng trực tiếp từ API response, không cần fake progress
