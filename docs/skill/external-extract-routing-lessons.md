# Kinh nghiệm: Tích hợp External Extract API cho ytmp4.gg

Tài liệu này chia sẻ kinh nghiệm thực tế khi implement External Extract API + Priority Routing cho ytmp4.gg. Các agent nên đọc để học hỏi pattern và tránh sai lầm, nhưng KHÔNG nên copy y nguyên vì mỗi site có cấu trúc khác nhau.

## 1. Quy trình làm việc hiệu quả

### Research trước, code sau

Trước khi viết bất kỳ dòng code nào, đã dành thời gian:
- Đọc kỹ cách ytmp3.gg (site gốc đã có feature này) implement: file nào, function nào, flow ra sao
- Đọc kỹ cấu trúc ytmp4.gg hiện tại: API layer, download flow, state management
- So sánh 2 site để xác định chính xác những gì cần thêm vs những gì đã có

### Implement theo layer, build test sau mỗi layer

Chia công việc thành các layer độc lập:
1. Core package (models, mapper, service) → đây là base cho tất cả site
2. Config & API setup (environment, HTTP client, service wrapper)
3. Routing logic (strategy resolver, external caller)
4. Tích hợp vào single download
5. Tích hợp vào multiple download

Build test sau khi hoàn thành tất cả để verify TypeScript compilation.

## 2. Kiến trúc đã chọn

### Một file router gộp tất cả

Thay vì tạo nhiều file nhỏ (policy.ts, strategy.ts, caller.ts, geo-cache.ts), đã gộp tất cả vào một file `priority-extract-router.ts` vì:
- Các thành phần liên quan chặt chẽ, không có lý do tách riêng
- Giảm số file cần tạo và maintain
- Dễ đọc flow từ đầu đến cuối trong một file

### Reuse country cache từ allowed-features

KHÔNG tạo hệ thống country cache riêng. Thay vào đó, đọc trực tiếp từ localStorage key mà `allowed-features.ts` đã lưu. Lý do:
- Tránh duplicate API call (allowed-features API đã trả country)
- Tránh duplicate localStorage key
- `initAllowedFeatures()` đã có sẵn logic: check cache → nếu hết hạn hoặc chưa có → fetch background → lưu cache

### Strategy resolver là synchronous

`resolveExtractStrategy()` là hàm đồng bộ, KHÔNG async. Nó chỉ đọc localStorage cache:
- Có cache → trả strategy dựa trên country
- Không có cache → trả `v3-first` (mặc định an toàn)
- KHÔNG bao giờ block để chờ API call

Điều này đảm bảo download bắt đầu ngay lập tức, không bị delay bởi country lookup.

### Dùng const object thay vì string literal cho strategy

```
EXTRACT_STRATEGY.EXTERNAL_FIRST  thay vì  'external-first'
EXTRACT_STRATEGY.V3_FIRST        thay vì  'v3-first'
```

Tránh typo và dễ refactor sau này.

## 3. Những điểm cần chú ý

### External Extract response khác V3

- V3: trả `statusUrl` → cần polling → cuối cùng có `downloadUrl`
- External: trả `downloadUrl` trực tiếp → KHÔNG cần polling

Khi tích hợp, phải xử lý riêng case external: skip polling, set state thẳng sang completed/success.

### Single download vs Multiple download flow khác nhau

Trong ytmp4.gg:
- **Single download** dùng conversion task state (`setConversionTask`, `updateConversionTask`) với state machine (EXTRACTING → PROCESSING → SUCCESS)
- **Multiple download** dùng callback pattern (`onPhaseChange`, `onProgress`, `onComplete`, `onError`)

Khi tích hợp external extract, phải adapt theo đúng pattern của từng flow:
- Single: `updateConversionTask(formatId, { state: TaskState.SUCCESS, downloadUrl, ... })`
- Multiple: `callbacks.onComplete(downloadUrl, filename)`

### Tách V3 flow thành function riêng

Khi refactor `startConversion()` (single download), đã tách V3 flow ra thành `runV3Flow()` riêng. Lý do:
- Code gốc là một khối try/catch lớn, khó thêm fallback logic vào
- Tách ra giúp: strategy → try primary → if fail → try fallback → clean và dễ đọc
- Multiple download cũng tách `runV3Flow()` tương tự

### initAllowedFeatures() cho single download page

ytmp4.gg có 4 page types: single, multi, playlist, channel. Khi check:
- Multi, playlist, channel đã có `initAllowedFeatures()` ở page init
- Single (main.ts) CHƯA CÓ → phải thêm vào

Bài học: luôn check TẤT CẢ entry points, không chỉ những page liên quan trực tiếp.

### V3 retry giảm xuống 3 lần

Trước đó V3 extract retry 10 lần (tổng 11 attempts) — quá nhiều, user phải chờ lâu nếu API thực sự down. Giảm xuống 2 retry (tổng 3 attempts) vì:
- Đã có fallback sang External Extract nếu V3 fail
- 3 lần đủ để handle transient errors
- Giảm thời gian chờ trước khi fallback

## 4. Sai lầm cần tránh

### Đừng tạo country cache riêng

Nếu site đã có allowed-features hoặc geo-cache, hãy reuse. Tạo hệ thống mới sẽ:
- Duplicate API calls
- Có thể conflict localStorage keys
- Tăng complexity không cần thiết

### Đừng block download để chờ country

Country lookup chỉ nên đọc từ cache. Nếu cache miss → dùng strategy mặc định (v3-first). Country sẽ được cache cho lần download tiếp theo thông qua `initAllowedFeatures()` ở page load.

### Đừng giả định format mapper giống nhau

Cách map quality options sang External Extract request có thể khác nhau tùy site. Ví dụ:
- Một site dùng `videoQuality: '720'` (không có 'p')
- Site khác dùng `videoQuality: '720p'`
- External Extract API cần format `'720p'` cho video, `'128kbps'` cho audio

Luôn kiểm tra format options của site trước khi dùng mapper.

### Đừng quên record usage sau external extract

Khi download thành công qua External Extract, vẫn phải gọi `recordUsage()` cho các feature limits (4K, 2K, 320kbps). Dễ quên vì external flow ngắn hơn V3 flow.

## 5. Checklist verify sau khi implement

- [ ] Build thành công (vite build hoặc tương đương)
- [ ] Single download: resolve strategy đúng theo country/format/supporter
- [ ] Single download: external-first flow hoạt động (external OK → skip V3)
- [ ] Single download: v3-first flow hoạt động (V3 OK → không gọi external)
- [ ] Single download: fallback hoạt động (primary fail → silent switch)
- [ ] Multiple download (nếu có): cùng routing logic, callback pattern đúng
- [ ] Playlist/Channel (nếu có): inherit từ download runner
- [ ] initAllowedFeatures() có ở TẤT CẢ entry points
- [ ] Format không phải mp3/mp4 → luôn dùng V3, không fallback external
- [ ] Supporter → luôn v3-first
- [ ] recordUsage() được gọi cho cả external lẫn V3 success path
