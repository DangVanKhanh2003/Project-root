# Verified Services - Quick Start Guide

**Site projects should ONLY use VerifiedServices - never import core services directly.**

## Setup (One Time)

```typescript
import {
  // HTTP Client
  createHttpClient,

  // Core Services
  createSearchService,
  createMediaService,
  createConversionService,
  createPlaylistService,
  createDecryptService,
  createFeedbackService,
  createSearchV2Service,

  // Domain Layer
  createVerifier,
  createVerifiedServices,
  LocalStorageJwtStore,
  DEFAULT_POLICIES,
} from '@downloader/core';

// 1. Create HTTP Client
const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// 2. Create API Config
const apiConfig = {
  baseURL: 'https://api.example.com',
  timeout: 30000,
};

// 3. Create Core Services
const coreServices = {
  search: createSearchService(httpClient, apiConfig),
  media: createMediaService(httpClient, apiConfig),
  conversion: createConversionService(httpClient, apiConfig),
  playlist: createPlaylistService(httpClient, apiConfig),
  decrypt: createDecryptService(httpClient, apiConfig),
  feedback: createFeedbackService(httpClient, apiConfig),
  searchV2: createSearchV2Service(httpClient, apiConfig),
};

// 4. Create Domain Verifier with Namespaced JWT Store

// IMPORTANT: Use unique key to avoid collisions!
// Multiple apps on same domain share localStorage.

// Option A: Manual unique key
const jwtStore = new LocalStorageJwtStore('myapp_downloader_jwt');

// Option B: Use helper (RECOMMENDED)
import { createNamespacedKey } from '@downloader/core';
const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('myapp', 'downloader')
  // Result: 'myapp_downloader_jwt'
);

const verifier = createVerifier({
  jwtStore,
  policies: DEFAULT_POLICIES,
  verbose: true, // Enable logging in dev
});

// 5. Create Verified Services (ONLY API site projects need)
const api = createVerifiedServices(coreServices, verifier);

// Export for use throughout app
export { api };
```

## Usage Examples

### Search Videos

```typescript
import { api } from './setup';

// Search videos
const result = await api.searchTitle({ keyword: 'cats', from: 'youtube' });

if (result.ok) {
  console.log('Videos:', result.data.videos);
} else {
  console.error('Search failed:', result.message);
}
```

### Extract Media (with auto JWT injection)

```typescript
// Auto JWT injection - no need to pass JWT manually
const result = await api.extractMedia({ url: 'https://youtube.com/watch?v=...' });

if (result.ok) {
  console.log('Formats:', result.data.formats);
} else if (result.code === 'CAPTCHA_REQUIRED') {
  // Handle CAPTCHA
  const captchaToken = await solveCaptcha();

  // Retry with CAPTCHA
  const retryResult = await api.extractMedia(
    { url: 'https://youtube.com/watch?v=...' },
    { captcha: { token: captchaToken, type: 'recaptcha' } }
  );
}
```

### Convert Video

```typescript
// Start conversion
const convertResult = await api.convert({ vid: '123', key: 'abc' });

if (!convertResult.ok) {
  console.error('Conversion failed:', convertResult.message);
  return;
}

// Poll task status
let task = convertResult.data;
while (task.status === 'processing') {
  await delay(2000);

  const checkResult = await api.checkTask({ vid: task.vid, b_id: task.b_id });

  if (checkResult.code === 'TASK_NOT_READY') {
    continue;
  }

  if (checkResult.ok) {
    task = checkResult.data;
  } else {
    console.error('Task check failed:', checkResult.message);
    break;
  }
}
```

### Search with Pagination (V2)

```typescript
// Initial search
const result = await api.searchV2('cats');

if (result.ok) {
  console.log('Videos:', result.data.videos);

  // Next page
  if (result.data.pagination.hasNextPage) {
    const nextResult = await api.searchV2('cats', {
      pageToken: result.data.pagination.nextPageToken
    });
  }
}
```

## JWT Management

```typescript
// Get current JWT
const jwt = api.getCurrentJwt();

// Clear JWT (logout)
api.clearJwt();
```

## Direct Core Service Access (Advanced)

If you need raw service access (bypass verification):

```typescript
// Access raw core services
const rawSearchService = api.core.search;

// Call without verification (NOT RECOMMENDED)
const rawResult = await rawSearchService.searchTitle({ keyword: 'test' });
// rawResult is NOT VerifiedResult - it's raw service response
```

**Note:** Only use `api.core` for debugging or special cases. Always use verified methods for production code.

## Benefits

1. **Auto JWT Injection** - JWT automatically injected from store
2. **Auto Verification** - All responses verified with policies
3. **Standardized Results** - All methods return `VerifiedResult<T>`
4. **Type Safety** - Full TypeScript support with inferred types
5. **Easy Maintenance** - Add new methods by delegating to core services

## Architecture

```
Site Project
  ↓ (only use this)
VerifiedServices
  ↓ (delegates to)
Core Services
  ↓
HTTP Client
  ↓
Remote API
```

## VerifiedResult Structure

```typescript
interface VerifiedResult<T> {
  ok: boolean;              // true if status === 'success'
  status: 'success' | 'warning' | 'error';
  code: VerificationCode;   // 'OK', 'EMPTY_RESULTS', 'CAPTCHA_REQUIRED', etc.
  message: string;          // Human-readable message
  data: T | null;          // Verified data (null on error)
  raw?: any;               // Raw response for debugging
}
```

## Error Handling Pattern

```typescript
const result = await api.searchTitle({ keyword: 'test' });

switch (result.status) {
  case 'success':
    // Use result.data
    break;

  case 'warning':
    if (result.code === 'EMPTY_RESULTS') {
      // Show "no results" message
    }
    break;

  case 'error':
    if (result.code === 'CAPTCHA_REQUIRED') {
      // Show CAPTCHA
    } else if (result.code === 'RATE_LIMITED') {
      // Show rate limit error
    } else {
      // Generic error
      console.error(result.message);
    }
    break;
}
```

That's it! Site projects only need to interact with `VerifiedServices` - all complexity is hidden behind this simple API.
