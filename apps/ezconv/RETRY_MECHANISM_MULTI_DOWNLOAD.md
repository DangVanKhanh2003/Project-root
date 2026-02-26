# Co che Retry cho tung item trong Multi Download

Tai lieu nay mo ta dung theo code hien tai trong `apps/ezconv`.

## 1. Tong quan theo item

Moi item di qua cac phase chinh:

1. `extracting` (tao job)
2. `processing` (poll status)
3. `completed` hoac `error` hoac `cancelled`

Retry chi ap dung cho:

- Tao job (auto retry)
- Poll status (retry theo consecutive errors)
- Retry toan bo flow `extract -> poll` o muc outer attempt

Queue khong tu retry item da fail.

## 2. Retry o phase extracting (tao job)

`runSingleDownload()` goi `extractWithRetries()`, ben trong dung:

- `retryWithBackoff(fn, RETRY_CONFIGS.extracting)`

Config extracting:

- `maxRetries = 10`  -> tong cong 11 lan thu (1 lan dau + 10 retry)
- `delays = []` -> retry ngay, khong cho
- `retryOnError`: retry tat ca loi, tru `AbortError` (user cancel)

Ket qua:

- Neu thanh cong o bat ky lan nao -> chuyen sang poll
- Neu het retry -> throw loi, item sang `error`

## 3. Retry o phase processing (poll status)

Polling trong `pollStatus()`:

- Interval mac dinh: `2000ms` (2s)
- Gioi han vong lap: `MAX_POLL_ITERATIONS = 5400` (~3 gio)

Logic retry khi poll:

- Moi lan goi status thanh cong -> `consecutiveErrors = 0`
- Neu timeout (`isTimeoutError`) -> khong tinh la loi, tiep tuc poll
- Neu loi mang/API tam thoi -> tang `consecutiveErrors`
- `maxConsecutiveErrors = 5` -> den nguong thi fail item voi thong bao `Network error - please try again`

## 4. Case khong retry ngay

Neu backend tra status terminal:

- `error`
- `not_found`
- `failed`

Thi dung poll ngay (khong retry tiep), item sang `error`.

Neu poll qua lau:

- Het `5400` lan poll -> throw `Download timed out`

## 5. Retry thu cong (manual retry)

Queue (`DownloadQueue`) khong tu dong retry item da fail.

Retry thu cong di qua `multiDownloadService.retryDownload(id)`:

1. `videoStore.setStatus(id, 'ready')`
2. `startDownload(id)` -> set `queued` -> enqueue lai
3. Item chay lai tu dau (extracting + polling)

## 6. Outer retry cho toan bo flow cua 1 item

`runSingleDownload()` da co vong lap bao ngoai:

- `MAX_JOB_ATTEMPTS = 2`
- Moi attempt se chay lai full flow: `extractWithRetries()` -> `pollStatus()`
- Neu attempt that bai va chua het so lan -> tao job moi, chay lai tu dau
- Neu `AbortError`/cancel -> dung ngay, khong retry
- Neu het attempts -> throw loi cuoi cung
## 7. Cac file lien quan

- `src/features/downloader/logic/conversion/retry-helper.ts`
- `src/features/downloader/logic/multiple-download/download-runner.ts`
- `src/features/downloader/logic/multiple-download/download-queue.ts`
- `src/features/downloader/logic/multiple-download/services/multi-download-service.ts`
