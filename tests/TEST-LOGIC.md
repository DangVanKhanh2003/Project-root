# Test Logic Documentation — Downloader Monorepo

**Project:** downloader-monorepo — Ứng dụng tải video/audio từ YouTube, Facebook, TikTok, Instagram, X.

**19 sites:** onedownloader.net, ssvid.cc, yt1s.guru, ytmp4.gg, ytsss.com, convert1s.com, tube1s.com, snap1s.com, snakeloader.com, u2snap.com, y2save.com, sstube.net, ytconvert.org, ytmp3.my, y2matepro, y2matevc, mp3fast, ezconv, 4kvideopro

**Packages:** @downloader/core, @downloader/ui-components, @downloader/ui-shared, @downloader/i18n, @downloader/vidtool-popup

Tài liệu mô tả chi tiết logic, mục đích và nội dung từng bài test.

## Cách chạy

```bash
# QUAN TRỌNG: Chạy từ thư mục ROOT (Project-root), KHÔNG phải packages/core
cd f:/downloader/Project-root

npm run test:dashboard    # Mở dashboard UI tại http://localhost:3333
npm run test              # Unit + Stress tests (653 tests)
npm run test:e2e          # E2E tests (build + mở browser + click thật)
npm run test:full         # Full pipeline: Unit → Stress → E2E
```

---

## 1. UNIT TESTS (Vitest) — 404 tests

### 1.1 download.mapper.test.ts (45 tests)
**Mục đích:** Test hàm `mapToV3DownloadRequest()` — chuyển đổi lựa chọn của user (format, quality, bitrate) thành V3 API request.

| Test | Logic | Kiểm tra gì |
|------|-------|-------------|
| maps basic video download request | Truyền `{downloadMode:'video', videoQuality:'1080', container:'mp4'}` | output.type='video', format='mp4', quality='1080p' |
| maps video quality with "p" suffix | Truyền quality='720p' (đã có 'p') | Không bị double: quality='720p' (không phải '720pp') |
| maps all video quality levels | Lặp 7 levels: 2160→144 | Mỗi level thêm 'p': '2160'→'2160p' |
| maps undefined quality | Không truyền quality | quality=undefined (không crash) |
| maps unknown quality | Truyền quality='999' | quality=undefined (fallback) |
| maps container formats | Lặp mp4, webm, mkv | Giữ nguyên format |
| defaults to mp4 | Không truyền container | format='mp4' |
| defaults to mp4 for unknown | Truyền container='avi' | format='mp4' (fallback) |
| always includes audio config for video | Video download | audio.bitrate='128k' (default) |
| includes trackId when not "original" | trackId='en' | audio.trackId='en' |
| excludes trackId when "original" | trackId='original' | audio.trackId=undefined |
| maps all audio formats | Lặp mp3, m4a, wav, opus, ogg, flac | Giữ nguyên |
| defaults to mp3 | Không truyền audioFormat | format='mp3' |
| maps audio bitrate 256→192k | Truyền bitrate='256' | bitrate='192k' (closest available) |
| includes trim | trimStart=10, trimEnd=60 | trim={start:10, end:60} |
| trimStart=0 is valid | trimStart=0 | trim.start=0 (0 là giá trị hợp lệ, không bị skip) |
| includes filenameStyle | filenameStyle='pretty' | filenameStyle='pretty' |
| includes enableMetadata=false | enableMetadata=false | enableMetadata=false (boolean false vẫn include) |

### 1.2 error.mapper.test.ts (18 tests)
**Mục đích:** Test phân loại error codes từ API.

| Test | Logic |
|------|-------|
| maps INVALID_URL → user-friendly message | 'Invalid YouTube URL. Please enter a valid link.' |
| isRetryableError('INTERNAL_ERROR') = true | Server lỗi → nên retry |
| isRetryableError('INVALID_URL') = false | Lỗi user nhập → KHÔNG retry |
| isUserInputError('VALIDATION_ERROR') = true | Lỗi validation → hiện lỗi cho user |
| isVideoUnavailableError('VIDEO_NOT_FOUND') = true | Video bị xóa/restricted |

### 1.3 http-client.test.ts (21 tests)
**Mục đích:** Test HttpClient — giao tiếp với API server.

| Test | Logic |
|------|-------|
| prepends baseUrl to relative path | '/api/download' → 'https://api.com/api/download' |
| uses full URL as-is | 'https://other.com/status' → giữ nguyên |
| appends data as query params for GET | GET params trở thành ?q=test&page=1 |
| sends JSON body for POST | POST data → JSON.stringify trong body |
| throws ApiError for 404 | Response status 404 → throw ApiError(404) |
| extracts error message from JSON | {message: 'Invalid URL'} → error.message='Invalid URL' |
| throws NetworkError for TypeError | fetch() throw TypeError → NetworkError |
| throws TimeoutError | AbortController timeout → TimeoutError |
| throws CancellationError for aborted signal | User cancel → CancellationError |

### 1.4 http-error.test.ts (14 tests)
**Mục đích:** Test error class hierarchy.

| Test | Logic |
|------|-------|
| ApiError has status + statusText | new ApiError('msg', 404, 'Not Found') |
| NetworkError extends ApiError | status=0, statusText='Network Error' |
| TimeoutError has timeout property | timeout=30000 serializable |
| CancellationError has default message | 'Request cancelled by user' |
| All errors serialize to JSON | toJSON() chứa name, message, status, stack |

### 1.5 download.service.test.ts (14 tests)
**Mục đích:** Test V3DownloadService — gọi API tạo job và poll status.

| Test | Logic |
|------|-------|
| throws for empty URL | url='' → Error('Invalid URL') |
| throws for missing output.type | Thiếu type → Error('output.type is required') |
| returns CreateJobResponse | Mock API trả statusUrl, title, duration |
| throws for error response | API trả {error:{code,message}} → throw |
| getStatusByUrl returns status | Mock pending/completed status |
| uses full URL for getStatusByUrl | Không prepend baseUrl (URL đã full) |

### 1.6 retry-helper.test.ts (24 tests)
**Mục đích:** Test retry logic — auto retry khi API fail.

| Test | Logic |
|------|-------|
| returns on first success | fn() thành công lần 1 → return ngay |
| retries on failure, succeeds on 2nd | fn() fail 1 lần → retry → success |
| throws after maxRetries | fail 4 lần (maxRetries=3) → throw |
| stops if retryOnError returns false | AbortError → KHÔNG retry (user cancel) |
| extracting config: 10 retries | maxRetries=10, retry all except AbortError |
| isTimeoutError detects TimeoutError | error.name='TimeoutError' → true |
| isRetryableError: 500 = true, 400 = false | Server error retry, client error no retry |

### 1.7 download-queue.test.ts (17 tests)
**Mục đích:** Test DownloadQueue — quản lý download song song.

| Test | Logic |
|------|-------|
| starts immediately when capacity | Queue trống → chạy ngay |
| passes AbortSignal to download fn | Mỗi download nhận signal để cancel |
| skips duplicate IDs | add('item1') 2 lần → chỉ chạy 1 lần |
| respects maxConcurrent=3 | 5 items → 3 running, 2 pending |
| processes in FIFO order | Queue max 1 → first, second, third theo thứ tự |
| cancel aborts running download | signal.aborted = true |
| cancelAll aborts all + rejects pending | Tất cả stopped |
| setMaxConcurrent triggers processNext | Tăng limit → pending items start |

### 1.8 polling.test.ts (13 tests)
**Mục đích:** Test polling loop — check status conversion.

| Test | Logic |
|------|-------|
| calls onComplete for 'completed' | status='completed' + downloadUrl → onComplete(url) |
| calls onError if completed without URL | status='completed' nhưng downloadUrl=undefined → lỗi |
| calls onProgress for 'pending' | status='pending', progress=30 → onProgress(30, detail) |
| stops immediately for 'error'/'failed' | Terminal status → onError() + stop |
| continues on timeout (not counted) | TimeoutError → continue polling (unlimited) |
| fails after maxConsecutiveErrors | 3 consecutive network errors → onError('Network error') |
| resets error count on success | 2 errors → 1 success → 2 errors → complete (not fail) |

---

## 2. STRESS TESTS (Vitest) — 249 tests

### 2.1 download.mapper.stress.test.ts (~200 tests)
**Mục đích:** Test MỌI combination format × quality × bitrate.

| Test Group | Số lượng | Logic |
|------------|---------|-------|
| 7 qualities × 3 containers × 5 bitrates | 105 | Tất cả combo video |
| 6 formats × 5 bitrates | 30 | Tất cả combo audio |
| 15 URL variations | 15 | YouTube URLs dạng khác nhau |
| 8 trim boundary values | 8 | trimStart=0, fractional seconds, 48h video |
| 13 trackId variations | 13 | 'en', 'zh-Hans', 'original', empty, undefined |
| 4 filenameStyle values | 4 | classic, basic, pretty, nerdy |
| Unknown format/quality graceful | ~15 | 'avi', '999p', 'aac' → fallback không crash |
| 15 user agents OS detection | 15 | iPhone, Android, Windows, Mac, Linux, ChromeOS |
| 1000 rapid mappings < 100ms | 1 | Performance benchmark |

### 2.2 http-client.stress.test.ts (~50 tests)
**Mục đích:** Test HTTP edge cases.

| Test Group | Logic |
|------------|-------|
| 7 error message formats | JSON {message}, {error:{message}}, {data:{reason}}, text/plain, empty |
| 16 HTTP status codes | 400, 401, 403, 404, 408, 429, 500, 502, 503... |
| 10 concurrent GET requests | Promise.all 10 requests song song |
| Mix success + failure concurrent | 3 requests: ok, fail, ok → allSettled |
| 7 URL building edge cases | Relative, absolute, with query, empty |
| 50 query parameters | GET với 50 params |
| Special chars in query | Spaces, URLs, emoji |
| 100-field POST body | Large JSON body |
| 10 concurrent cancellations | 10 requests cancel cùng lúc |

### 2.3 polling.stress.test.ts (~15 tests)
**Mục đích:** Test polling dưới điều kiện extreme.

| Test | Logic |
|------|-------|
| 50 pending polls then complete | 50 lần pending → 1 completed |
| Alternating error-success | error, success, error, success, ... → complete |
| 20 consecutive timeouts then success | Timeout không giới hạn → cuối cùng success |
| Boundary: maxErrors-1 then recovery | 4 errors (limit 5) → success (gần boundary) |
| All 6 terminal statuses | error+jobError, error+none, not_found+jobError... |
| Progress never backwards | Verify progress tăng đơn điệu |
| 20 detail breakdowns | Verify video/audio detail qua 20 updates |

---

## 3. E2E TESTS (Playwright) — Browser Automation

### 3.1 single-download.spec.ts
**Mục đích:** Mô phỏng user thật paste URL → convert → download.

| Test | User Action | Kiểm tra |
|------|-------------|----------|
| Step 1: Paste URL | Click #videoUrl → fill YouTube URL | Input có value, font ≥ 16px |
| Step 2: Chọn MP4/MP3 | Click .format-btn[data-format="mp3"] | Button có class 'active' |
| Step 3: Chọn quality | Click [data-video-group-trigger] → click [data-group-item="mp4-720"] | Item có class 'is-selected' |
| Step 4: Ấn Convert | Click .btn-convert | Preview card hoặc status xuất hiện |
| Step 5: Xem preview | Chờ .yt-preview-card:not(.skeleton) | Title có text, thumbnail load, badge hiện format |
| Step 6: Progress bar | Chờ #status-container visible | Spinner quay hoặc status text hiện |
| Step 7: Download | Chờ #conversion-download-btn.active → click | Download triggered |
| Step 8: Start Over | Click #btn-new-convert | Quay lại form, #videoUrl visible |
| FULL FLOW MP4 | Paste → MP4 → Convert → Download → Start Over | End-to-end |
| FULL FLOW MP3 | Paste → MP3 320kbps → Convert → Download | Audio flow |
| ERROR: URL invalid | Fill 'not-a-valid-url' → Convert | Error message hoặc không crash |
| ERROR: Empty input | Click Convert (không fill) | Không crash, form vẫn visible |
| Mobile menu | Set viewport 375×667 → click #mobile-menu-btn | Drawer visible |
| STRESS: 5x Convert | Fill + click 5 lần liên tục | Page không crash |

### 3.2 concurrent-downloads.spec.ts
**Mục đích:** Test ứng dụng dưới tải nặng.

| Test | Logic |
|------|-------|
| Rapid URL changes | Fill 5 URL khác nhau liên tục → không memory leak |
| New submission cancels previous | Submit URL1 → 1s → submit URL2 → UI không frozen |
| Back/forward during conversion | Start convert → goBack → goForward → không crash |
| Page visibility change | Simulate tab hidden/visible → conversion vẫn ok |
| DOM size after 5 submissions | Kiểm tra DOM nodes không tăng quá 3x |
| Network failure recovery | Block API → submit → unblock → page vẫn dùng được |
| Page load < 5s | Đo thời gian load |
| Interactive < 8s | Đo thời gian đến networkidle |

### 3.3 cross-app-smoke.spec.ts
**Mục đích:** Smoke test trên MỌI site.

| Test (chạy cho MỖI site) | Logic |
|---------------------------|-------|
| Homepage loads < 5s | HTTP status < 400, title non-empty |
| Has header + footer | header, footer visible |
| Has URL input #videoUrl | Input visible, font ≥ 16px |
| Has submit/convert button | .btn-convert visible |
| Has format selector | .format-btn[data-format] visible |
| SEO tags | title > 5 chars, meta description > 20 chars, canonical, viewport |
| No console errors | Lọc firebase/analytics, kiểm tra critical errors |
| No broken images | naturalWidth > 0 cho mỗi img |
| No horizontal scroll mobile | scrollWidth ≤ clientWidth |

### 3.4 language-switching.spec.ts
**Mục đích:** Test 19 ngôn ngữ + RTL layout.

| Test | Logic |
|------|-------|
| 19 language pages load | /pages/{code}/ → status < 400, body text > 50 chars |
| RTL layout (Arabic, Urdu) | dir='rtl' trên html/body |
| RTL input text-align | Kiểm tra text-align right/start |
| RTL no overflow | scrollWidth ≤ clientWidth |
| Translated page title | Title ≠ empty cho mỗi ngôn ngữ |
| Hero section translated | .hero text > 10 chars |
| Hreflang links | link[hreflang] > 0, href valid |
| Font rendering 9 scripts | Arabic, Bengali, Devanagari, CJK, Hangul, Myanmar, Thai, Nastaliq, Cyrillic |

---

## 4. MULTI-SITE PARALLEL TESTING

Khi chạy `npm run test:e2e:all-sites` hoặc `TEST_ALL_SITES=1 npm run test:e2e`:

```
Site             Port   Desktop    Mobile
─────────────────────────────────────────
convert1s.com    4002   ✓          ✓
onedownloader    4005   ✓          ✓
snakeloader      4006   ✓          ✓
snap1s.com       4007   ✓          ✓
sstube.net       4008   ✓          ✓
ssvid.cc         4009   ✓          ✓
tube1s.com       4010   ✓          ✓
...              ...    ✓          ✓
```

- Mỗi site chạy trên **port riêng** (4001-4019)
- Playwright tạo **2 projects per site**: desktop + mobile
- Tất cả chạy **song song** (fullyParallel: true)
- Playwright tự **build + preview** trước khi test (webServer config)

---

## 5. TEST DASHBOARD

Mở bằng `npm run test:dashboard` (từ **root**, không phải packages/core).

| Feature | Mô tả |
|---------|-------|
| Ring Chart | Biểu đồ tròn % pass rate (xanh/đỏ) |
| Mini Stats | Test files, duration, unit/stress/e2e count |
| Run Full | Chạy tất cả: Unit → Stress → E2E (sequential) |
| Run E2E All Sites | Build + test tất cả sites song song |
| Live Log | Stream output realtime qua WebSocket |
| Filter + Tabs | Lọc theo tên, tab Unit/Stress/E2E/Failed |
| Expandable Suites | Click để xem từng test case (✓/✗ + duration) |
