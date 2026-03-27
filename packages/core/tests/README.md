# Tests — @downloader/core (Downloader Monorepo)

Package `@downloader/core` chứa business logic chia sẻ giữa 19 sites trong downloader-monorepo: HTTP client, V3 download service, conversion strategies, polling, retry, download queue, mappers, link validation.

## Quick Start

```bash
cd packages/core

# Run all tests
npm test

# Watch mode (auto re-run on file changes)
npm run test:watch

# UI mode (browser-based test viewer)
npm run test:ui

# Coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── conversion/                    # Conversion engine tests
│   ├── progress/
│   │   └── PollingProgressMapper.test.ts   # Progress calculation (video/audio weighted)
│   ├── state-interface/
│   │   └── IStateUpdater.test.ts           # State update contract
│   ├── strategies/
│   │   ├── BaseStrategy.test.ts            # Base class, abort, state updates
│   │   ├── IOSRamStrategy.test.ts          # iOS memory-optimized download
│   │   ├── OtherStreamStrategy.test.ts     # Direct stream download
│   │   ├── PollingStrategy.test.ts         # 3-layer animation, fake progress
│   │   └── StaticDirectStrategy.test.ts    # Static direct download
│   └── types/
│       └── index.test.ts                   # Type validation, routing logic
│
├── http/                          # HTTP layer tests
│   ├── http-client.test.ts        # HttpClient: URL building, GET/POST, headers,
│   │                              #   error handling, timeout, cancellation
│   ├── http-error.test.ts         # Error classes: ApiError, NetworkError,
│   │                              #   TimeoutError, ValidationError, CancellationError
│   ├── retry-helper.test.ts       # retryWithBackoff, isTimeoutError, isNetworkError,
│   │                              #   isRetryableError, extracting config pattern
│   ├── download-queue.test.ts     # DownloadQueue: concurrency limit, FIFO order,
│   │                              #   cancel/cancelAll, duplicate prevention
│   └── polling.test.ts            # Polling loop: progress updates, completion,
│   │                              #   error/timeout handling, consecutive error tracking
│
├── mappers/                       # Data mapping tests
│   └── v3/
│       ├── download.mapper.test.ts  # mapToV3DownloadRequest: quality, bitrate,
│       │                            #   format, trim, OS detection, edge cases
│       └── error.mapper.test.ts     # Error code mapping, retryable/user-input
│                                    #   /unavailable error classification
│
├── services/                      # Service layer tests
│   └── v3/
│       └── download.service.test.ts  # V3 createJob validation, getStatusByUrl,
│                                     #   error response handling
│
├── utils/                         # Utility tests
│   ├── link-validator.test.ts       # Link expiration, TTL, remaining time
│   └── link-validator.stress.test.ts  # Performance & edge case stress tests
│
└── README.md                      # This file
```

## Test Categories

| Category | Files | Tests | What it covers |
|----------|-------|-------|----------------|
| Conversion Strategies | 5 | ~100 | Download strategies (polling, direct, iOS, stream) |
| Progress & Types | 2 | ~70 | Progress calculation, type validation, routing |
| HTTP Client | 2 | ~35 | Request/response, errors, timeout, cancellation |
| Retry & Queue & Polling | 3 | ~54 | Retry logic, concurrent queue, polling loop |
| Mappers | 2 | ~63 | V3 request mapping, error code classification |
| Services | 1 | ~14 | V3 download service (createJob, getStatusByUrl) |
| Utils | 2 | ~57 | Link validation, TTL, expiration |
| **Total** | **18** | **404** | |

## Writing New Tests

### File naming
- Place test files in `tests/` mirroring the `src/` structure
- Name: `<module-name>.test.ts`

### Import pattern
Use the `@/` alias to import from `src/`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mapToV3DownloadRequest } from '@/mappers/v3/download.mapper';
import { HttpClient } from '@/http/http-client';
import { ApiError } from '@/http/http-error';
```

### Mocking example
```typescript
// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: () => Promise.resolve({ data: 'test' }),
});
```

### Fake timers (for polling/timeout tests)
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Advance time
await vi.advanceTimersByTimeAsync(2000);
```

## Coverage

```bash
npm run test:coverage
```

Coverage thresholds (configured in `vitest.config.ts`):
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Coverage reports are generated in `coverage/` directory (HTML + LCOV).
