# Filename Style & Embed File Metadata — API Guide

## 1) Filename Style — 4 loại

| Style | Mô tả |
|-------|-------|
| `classic` | ID-based, ngắn gọn |
| `basic` | Title + Author + quality |
| `pretty` | Title + Author + quality + platform |
| `nerdy` | Title + Author + quality + platform + ID |

## 2) Ví dụ cho từng style

Giả sử:
- Title: `Video Title`, Author: `Author`, Video ID: `dQw4w9WgXcQ`
- Video quality: `1080p`, Audio bitrate: `192k`
- Trim: `00:10 → 01:00` (nếu bật)

### `classic`
| Loại | Filename |
|------|----------|
| Video | `youtube_dQw4w9WgXcQ_1080p.mp4` |
| Audio | `youtube_dQw4w9WgXcQ_audio.mp3` |
| Trim | `youtube_dQw4w9WgXcQ_1080p_10-60s.mp4` |

### `basic`
| Loại | Filename |
|------|----------|
| Video | `Video Title - Author (1080p).mp4` |
| Audio | `Video Title - Author (192k).mp3` |
| Trim | `Video Title - Author (1080p) [0:10-1:00].mp4` |

### `pretty`
| Loại | Filename |
|------|----------|
| Video | `Video Title - Author (1080p, youtube).mp4` |
| Audio | `Video Title - Author (192k, youtube).mp3` |
| Trim | `Video Title - Author (1080p, youtube) [0:10-1:00].mp4` |

### `nerdy`
| Loại | Filename |
|------|----------|
| Video | `Video Title - Author (1080p, youtube, dQw4w9WgXcQ).mp4` |
| Audio | `Video Title - Author (192k, youtube, dQw4w9WgXcQ).mp3` |
| Trim | `Video Title - Author (1080p, youtube, dQw4w9WgXcQ) [0:10-1:00].mp4` |

## 3) API Endpoint

```
POST /api/download
```

### Payload fields liên quan

| Field | Type | Values | Default |
|-------|------|--------|---------|
| `filenameStyle` | string | `classic`, `basic`, `pretty`, `nerdy` | `basic` |
| `enableMetadata` | boolean | `true`, `false` | `true` |

### Payload mẫu đầy đủ

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "os": "windows",
  "output": {
    "type": "video",
    "format": "mp4",
    "quality": "1080p"
  },
  "audio": {
    "bitrate": "192k",
    "trackId": "en"
  },
  "filenameStyle": "basic",
  "enableMetadata": true,
  "trim": {
    "start": 10,
    "end": 60
  }
}
```

## 4) Embed Metadata ON/OFF

### ON (`enableMetadata: true`)
- API embed title, artist, thumbnail vào file (ưu tiên MP4/M4A)

### OFF (`enableMetadata: false`)
- File output giữ tên theo `filenameStyle`, bỏ qua bước nhúng metadata

## 5) Curl ví dụ

### Metadata ON
```bash
curl -X POST "https://vps-c80682fb.ytconvert.org/api/download" ^
  -H "Content-Type: application/json" ^
  -H "X-Hub-Token: <token>" ^
  -d "{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\"output\":{\"type\":\"audio\",\"format\":\"mp3\"},\"audio\":{\"bitrate\":\"192k\"},\"filenameStyle\":\"nerdy\",\"enableMetadata\":true}"
```

### Metadata OFF
```bash
curl -X POST "https://vps-c80682fb.ytconvert.org/api/download" ^
  -H "Content-Type: application/json" ^
  -H "X-Hub-Token: <token>" ^
  -d "{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\"output\":{\"type\":\"audio\",\"format\":\"mp3\"},\"audio\":{\"bitrate\":\"192k\"},\"filenameStyle\":\"nerdy\",\"enableMetadata\":false}"
```

## 6) Tích hợp vào EzConv — Pipeline

```
UI (hero-form.njk)
  → getCurrentSettings() (format-settings.ts)
    → VideoItemSettings { filenameStyle, enableMetadata }
      → buildV3Request() (download-runner.ts)
        → mapToV3DownloadRequest() (core/download.mapper.ts)
          → V3DownloadRequest { filenameStyle, enableMetadata }
            → POST /api/download
```

### Các file cần sửa

| Layer | File | Thay đổi |
|-------|------|----------|
| Template | `hero-form.njk` | Thêm tab group + toggle |
| CSS | `multiple-downloader-v2.css` | Style tabs + preview |
| App types | `multiple-download-types.ts` | Thêm 2 fields vào `VideoItemSettings` |
| App settings | `format-settings.ts` | Read/save 2 fields |
| App runner | `download-runner.ts` | Truyền qua `buildV3Request()` |
| Core types | `download.request.ts` | Thêm 2 fields vào `V3DownloadRequest` |
| Core mapper | `download.mapper.ts` | Map 2 fields |
