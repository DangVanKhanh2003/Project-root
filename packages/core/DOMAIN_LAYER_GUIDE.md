# Domain Layer Guide - Site Projects Integration

**🎯 AUDIENCE: AI CLI và Site Project Developers**

**📌 IMPORTANT: Site projects chỉ cần tương tác với DOMAIN LAYER. Không cần quan tâm đến các tầng bên dưới (services, http, normalizers, etc.).**

---

## 📋 Table of Contents

1. [Quick Start Setup](#quick-start-setup)
2. [Domain Layer Architecture](#domain-layer-architecture)
3. [API Reference](#api-reference)
4. [Usage Patterns](#usage-patterns)
5. [Error Handling](#error-handling)
6. [Advanced Topics](#advanced-topics)

---

## Quick Start Setup

### Step 1: Install Package

```bash
npm install @downloader/core
```

### Step 2: Setup Domain Layer

```typescript
import {
  // HTTP Client
  createHttpClient,

  // Core Services Factory Functions
  createSearchService,
  createMediaService,
  createConversionService,
  createPlaylistService,
  createDecryptService,
  createFeedbackService,
  createSearchV2Service,
  createQueueService,
  createYouTubeDownloadService,

  // Domain Layer (MAIN API)
  createVerifier,
  createVerifiedServices,
  LocalStorageJwtStore,
  createNamespacedKey,
  DEFAULT_POLICIES,
} from '@downloader/core';

// 1. Create unique JWT storage key (prevents collision)
const jwtKey = createNamespacedKey('your-app-name', 'downloader');
// Result: 'your_app_name_downloader_jwt'

// 2. Create JWT Store
const jwtStore = new LocalStorageJwtStore(jwtKey);

// 3. Create Verifier (handles JWT + response verification)
const verifier = createVerifier({
  jwtStore,
  policies: DEFAULT_POLICIES,
  verbose: true, // Enable logging in development
});

// 4. Create HTTP Client
const httpClient = createHttpClient({
  baseURL: 'https://api.your-backend.com',
  timeout: 30000,
});

const apiConfig = {
  baseURL: 'https://api.your-backend.com',
  timeout: 30000,
};

// 5. Create Core Services
const coreServices = {
  search: createSearchService(httpClient, apiConfig),
  media: createMediaService(httpClient, apiConfig),
  conversion: createConversionService(httpClient, apiConfig),
  playlist: createPlaylistService(httpClient, apiConfig),
  decrypt: createDecryptService(httpClient, apiConfig),
  feedback: createFeedbackService(httpClient, apiConfig),
  searchV2: createSearchV2Service(httpClient, apiConfig),
  queue: createQueueService(httpClient, apiConfig),
  youtubeDownload: createYouTubeDownloadService(httpClient, apiConfig),
};

// 6. Create Verified Services (MAIN API)
export const api = createVerifiedServices(coreServices, verifier);

// ✅ NOW USE `api` THROUGHOUT YOUR APP
```

### Step 3: Use the API

```typescript
// Search videos
const result = await api.searchTitle({ keyword: 'cats', from: 'youtube' });

if (result.ok) {
  console.log('Videos:', result.data.videos);
} else {
  console.error('Error:', result.message);
}
```

---

## Domain Layer Architecture

### 🎯 What is Domain Layer?

**Domain Layer = Verified Services API**

```
Site Project Code
    ↓ uses
Domain Layer (api.searchTitle, api.extractMedia, etc.)
    ↓ auto-handles
• JWT injection from storage
• CAPTCHA payload handling
• Service calls to backend
• JWT extraction from responses
• Response verification with policies
• Standardized VerifiedResult<T>
```

### 🔑 Key Concepts

1. **VerifiedServices** - Main API object with all methods
2. **DomainVerifier** - Handles JWT extraction & response verification
3. **JwtStore** - Stores JWT in localStorage with namespaced key
4. **VerifiedResult<T>** - Standardized response format

---

## API Reference

### Available Methods (14 total)

#### Search V1

```typescript
// Search videos by keyword
api.searchTitle(params: { keyword: string; from: string })
  → Promise<VerifiedResult<SearchDto>>

// Get search suggestions
api.getSuggestions(params: { keyword: string })
  → Promise<VerifiedResult<string[]>>
```

#### Media Extraction (Auto JWT injection)

```typescript
// Extract media from URL
api.extractMedia(
  params: { url: string },
  protectionPayload?: { jwt?: string; captcha?: { token: string; type: string } }
) → Promise<VerifiedResult<MediaDto>>

// Extract media direct (non-encoded)
api.extractMediaDirect(
  params: { url: string; ... },
  protectionPayload?
) → Promise<VerifiedResult<MediaDto>>
```

#### Conversion (Auto JWT injection)

```typescript
// Start conversion task
api.convert(
  params: { vid: string; key: string; ... },
  protectionPayload?
) → Promise<VerifiedResult<TaskDto>>

// Check conversion task status
api.checkTask(params: { vid: string; b_id: string })
  → Promise<VerifiedResult<TaskDto>>
```

#### Playlist

```typescript
// Extract playlist videos
api.extractPlaylist(params: { url: string })
  → Promise<VerifiedResult<PlaylistDto>>
```

#### Decrypt (Auto JWT injection)

```typescript
// Decode single URL
api.decodeUrl(
  params: { url: string },
  protectionPayload?
) → Promise<VerifiedResult<DecodeDto>>

// Decode multiple URLs
api.decodeList(
  params: { urls: string[] },
  protectionPayload?
) → Promise<VerifiedResult<DecryptListResponse>>
```

#### Feedback

```typescript
// Send user feedback
api.sendFeedback(params: { message: string; email?: string })
  → Promise<VerifiedResult<FeedbackResponse>>
```

#### Search V2

```typescript
// Search with pagination support
api.searchV2(
  query: string,
  options?: { pageToken?: string; limit?: number }
) → Promise<VerifiedResult<SearchV2Dto>>
```

#### Queue

```typescript
// Add video to processing queue
api.addVideoToQueue(videoId: string)
  → Promise<VerifiedResult<boolean>>
```

#### YouTube Download

```typescript
// Download YouTube video (supports abort)
api.downloadYouTube(
  params: { videoId: string; format: string },
  signal?: AbortSignal
) → Promise<VerifiedResult<StreamDto>>

// Get download progress
api.getDownloadProgress(params: { taskId: string })
  → Promise<VerifiedResult<ProgressResponse>>
```

#### Utility Methods

```typescript
// Get current JWT from store
api.getCurrentJwt() → string | null

// Clear JWT from store (logout)
api.clearJwt() → void

// Direct access to core services (advanced)
api.core → CoreServices
```

---

## Usage Patterns

### Pattern 1: Simple API Call (No Protection)

```typescript
// Search videos - no JWT needed
const result = await api.searchTitle({
  keyword: 'javascript tutorial',
  from: 'youtube'
});

if (result.ok) {
  // Success - use result.data
  const videos = result.data.videos;
  videos.forEach(video => {
    console.log(`${video.title} - ${video.duration}`);
  });
} else {
  // Error - show message
  console.error(result.message);
}
```

### Pattern 2: Protected API Call (Auto JWT Injection)

```typescript
// Extract media - JWT auto-injected from store
const result = await api.extractMedia({
  url: 'https://youtube.com/watch?v=abc123'
});

// Domain layer automatically:
// 1. Gets JWT from localStorage (via jwtStore)
// 2. Adds JWT to request headers
// 3. Calls backend API
// 4. Extracts NEW JWT from response
// 5. Saves NEW JWT to localStorage
// 6. Returns clean data (jwt field removed)

if (result.ok) {
  console.log('Formats:', result.data.formats);
}
```

### Pattern 3: Manual CAPTCHA Handling

```typescript
// First attempt - might fail with CAPTCHA_REQUIRED
const result = await api.extractMedia({
  url: 'https://youtube.com/watch?v=abc123'
});

if (result.code === 'CAPTCHA_REQUIRED') {
  // Show CAPTCHA to user
  const captchaToken = await showCaptchaModal();

  // Retry with CAPTCHA
  const retryResult = await api.extractMedia(
    { url: 'https://youtube.com/watch?v=abc123' },
    {
      captcha: {
        token: captchaToken,
        type: 'recaptcha' // or 'cloudflare'
      }
    }
  );

  if (retryResult.ok) {
    console.log('Success after CAPTCHA!');
  }
}
```

### Pattern 4: Polling Task Status

```typescript
// Start conversion
const convertResult = await api.convert({
  vid: '123',
  key: 'abc',
  format: 'mp4'
});

if (!convertResult.ok) {
  console.error('Conversion failed:', convertResult.message);
  return;
}

// Poll task status
let task = convertResult.data;

while (task.status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

  const statusResult = await api.checkTask({
    vid: task.vid,
    b_id: task.b_id
  });

  // Handle special codes
  if (statusResult.code === 'TASK_NOT_READY') {
    continue; // Keep polling
  }

  if (statusResult.ok) {
    task = statusResult.data;

    if (task.status === 'completed') {
      console.log('Download URL:', task.downloadUrl);
      break;
    } else if (task.status === 'failed') {
      console.error('Conversion failed');
      break;
    }
  } else {
    console.error('Status check failed:', statusResult.message);
    break;
  }
}
```

### Pattern 5: Pagination with Search V2

```typescript
// Initial search
const result = await api.searchV2('javascript tutorial', {
  limit: 20
});

if (result.ok) {
  const videos = result.data.videos;
  const pagination = result.data.pagination;

  console.log('Videos:', videos);

  // Load next page
  if (pagination.hasNextPage) {
    const nextResult = await api.searchV2('javascript tutorial', {
      pageToken: pagination.nextPageToken,
      limit: 20
    });

    if (nextResult.ok) {
      const moreVideos = nextResult.data.videos;
      // Append to existing videos
    }
  }
}
```

### Pattern 6: Abort Download

```typescript
// Create abort controller
const controller = new AbortController();

// Start download with signal
const downloadPromise = api.downloadYouTube(
  {
    videoId: 'abc123',
    format: 'mp4-720p'
  },
  controller.signal
);

// Cancel button handler
document.getElementById('cancelBtn').addEventListener('click', () => {
  controller.abort(); // Abort download
});

try {
  const result = await downloadPromise;
  if (result.ok) {
    console.log('Download complete:', result.data);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Download cancelled by user');
  }
}
```

---

## Error Handling

### VerifiedResult Structure

```typescript
interface VerifiedResult<T> {
  ok: boolean;              // true if status === 'success'
  status: 'success' | 'warning' | 'error';
  code: VerificationCode;   // See codes below
  message: string;          // Human-readable message
  data: T | null;          // Verified data (null on error)
  raw?: any;               // Raw response for debugging
}
```

### Common Verification Codes

```typescript
// Success
'OK'                  // Everything is fine

// Warnings
'EMPTY_RESULTS'      // Search returned no results
'PARTIAL_SUCCESS'    // Some items succeeded, some failed

// Errors
'ERROR'              // Generic error
'CAPTCHA_REQUIRED'   // Need CAPTCHA to proceed
'RATE_LIMITED'       // Too many requests
'INVALID_URL'        // URL format is invalid
'UNSUPPORTED_SITE'   // Site not supported
'TASK_NOT_READY'     // Conversion task still processing
'VIDEO_NOT_FOUND'    // Video doesn't exist
'PRIVATE_VIDEO'      // Video is private
'GEO_BLOCKED'        // Video blocked in region
```

### Error Handling Pattern

```typescript
const result = await api.extractMedia({ url: 'https://...' });

switch (result.status) {
  case 'success':
    // Use result.data
    console.log('Media:', result.data);
    break;

  case 'warning':
    if (result.code === 'EMPTY_RESULTS') {
      console.warn('No results found');
    }
    // Still might have partial data
    if (result.data) {
      console.log('Partial data:', result.data);
    }
    break;

  case 'error':
    // Handle different error codes
    switch (result.code) {
      case 'CAPTCHA_REQUIRED':
        await handleCaptcha();
        break;

      case 'RATE_LIMITED':
        await showRateLimitMessage();
        break;

      case 'INVALID_URL':
        showError('Please enter a valid URL');
        break;

      case 'GEO_BLOCKED':
        showError('Video not available in your region');
        break;

      default:
        showError(result.message);
    }
    break;
}
```

---

## Advanced Topics

### Custom JWT Store (Alternative to LocalStorage)

```typescript
import { CustomJwtStore } from '@downloader/core';

// Example: Redux Store
const jwtStore = new CustomJwtStore(
  // get
  () => store.getState().auth.jwt,
  // save
  (jwt) => store.dispatch(setJwt(jwt)),
  // clear
  () => store.dispatch(clearJwt())
);

// Example: Cookie Store
const jwtStore = new CustomJwtStore(
  () => Cookies.get('myapp_jwt'),
  (jwt) => Cookies.set('myapp_jwt', jwt, {
    expires: 7,
    sameSite: 'strict',
    secure: true
  }),
  () => Cookies.remove('myapp_jwt')
);

const verifier = createVerifier({ jwtStore });
```

### InMemory JWT Store (Testing/SSR)

```typescript
import { InMemoryJwtStore } from '@downloader/core';

// For testing or server-side rendering
const jwtStore = new InMemoryJwtStore();

const verifier = createVerifier({ jwtStore });
```

### Custom Verification Policies

```typescript
import { createVerifier } from '@downloader/core';
import type { VerificationPolicy } from '@downloader/core';

// Define custom policy
const customSearchPolicy: VerificationPolicy<any, SearchDto> = async (response, context) => {
  // Custom validation logic
  if (!response.videos || response.videos.length === 0) {
    return {
      ok: false,
      status: 'warning',
      code: 'EMPTY_RESULTS',
      message: 'No videos found',
      data: null,
      raw: response
    };
  }

  return {
    ok: true,
    status: 'success',
    code: 'OK',
    message: 'Search successful',
    data: response,
  };
};

// Create verifier with custom policies
const verifier = createVerifier({
  jwtStore,
  policies: {
    searchTitle: customSearchPolicy,
    // ... other policies
  },
  verbose: true
});
```

### Accessing Raw Core Services

```typescript
// Most of the time, use verified API
const result = await api.searchTitle({ keyword: 'test' });

// For advanced use cases, access raw services
const rawSearchService = api.core.search;

// Call without verification (NOT RECOMMENDED for production)
const rawResponse = await rawSearchService.searchTitle({ keyword: 'test' });
// rawResponse is NOT VerifiedResult - it's raw backend response
// JWT won't be extracted or saved
```

### JWT Management

```typescript
// Check if user has JWT (logged in)
const jwt = api.getCurrentJwt();
if (jwt) {
  console.log('User is authenticated');
} else {
  console.log('User needs to login');
}

// Logout (clear JWT)
api.clearJwt();

// Force login by clearing JWT and calling protected endpoint
api.clearJwt();
const result = await api.extractMedia({ url: '...' });
// Backend will return new JWT in response
// Domain layer will save it automatically
```

---

## Best Practices

### ✅ DO

1. **Always use `api.*` methods** - Don't access core services directly
2. **Check `result.ok` before using `result.data`** - Always handle errors
3. **Use unique namespace for JWT store** - Prevents collision with other apps
4. **Handle CAPTCHA_REQUIRED gracefully** - Show CAPTCHA UI to user
5. **Poll task status with delays** - Don't spam the API
6. **Enable verbose logging in development** - Helps debug issues

### ❌ DON'T

1. **Don't access `api.core` services directly** - Use verified methods
2. **Don't ignore error codes** - Different codes need different handling
3. **Don't use default JWT key** - Always use `createNamespacedKey()`
4. **Don't hardcode JWT** - Let domain layer handle it
5. **Don't skip error handling** - Always check `result.ok`

---

## Complete Example: Video Download Feature

```typescript
import { api } from './api-setup'; // Setup from Quick Start

async function downloadVideo(url: string) {
  // Step 1: Extract media info
  console.log('Fetching video info...');
  let mediaResult = await api.extractMedia({ url });

  if (mediaResult.code === 'CAPTCHA_REQUIRED') {
    // Handle CAPTCHA
    const captchaToken = await solveCaptcha();
    const retryResult = await api.extractMedia(
      { url },
      { captcha: { token: captchaToken, type: 'recaptcha' } }
    );

    if (!retryResult.ok) {
      throw new Error(retryResult.message);
    }

    mediaResult = retryResult;
  }

  if (!mediaResult.ok) {
    throw new Error(mediaResult.message);
  }

  const media = mediaResult.data;
  console.log(`Found: ${media.title}`);

  // Step 2: Show format selection to user
  const selectedFormat = await showFormatSelector(media.formats);

  // Step 3: Start conversion
  console.log('Starting conversion...');
  const convertResult = await api.convert({
    vid: media.vid,
    key: selectedFormat.key,
    format: selectedFormat.format
  });

  if (!convertResult.ok) {
    throw new Error(convertResult.message);
  }

  let task = convertResult.data;

  // Step 4: Poll task status
  console.log('Processing...');
  while (task.status === 'processing') {
    await new Promise(r => setTimeout(r, 2000));

    const statusResult = await api.checkTask({
      vid: task.vid,
      b_id: task.b_id
    });

    if (statusResult.code === 'TASK_NOT_READY') {
      continue;
    }

    if (!statusResult.ok) {
      throw new Error(statusResult.message);
    }

    task = statusResult.data;

    // Update progress UI
    if (task.progress) {
      updateProgressBar(task.progress);
    }
  }

  // Step 5: Download ready
  if (task.status === 'completed') {
    console.log('Download ready:', task.downloadUrl);
    window.location.href = task.downloadUrl;
  } else {
    throw new Error('Conversion failed');
  }
}

// Usage
try {
  await downloadVideo('https://youtube.com/watch?v=abc123');
} catch (error) {
  console.error('Download error:', error.message);
  showErrorToast(error.message);
}
```

---

## Troubleshooting

### JWT not persisting across page reloads

**Problem:** User needs to re-authenticate every time.

**Solution:** Check that you're using `LocalStorageJwtStore` (not `InMemoryJwtStore`) and that localStorage is available.

```typescript
// ✅ Correct - persists across reloads
const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('myapp', 'downloader')
);

// ❌ Wrong - lost on reload
const jwtStore = new InMemoryJwtStore();
```

### JWT collision between apps

**Problem:** Two apps on same domain share localStorage.

**Solution:** Use unique namespace for each app.

```typescript
// App 1
const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('app1', 'downloader')
);

// App 2
const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('app2', 'downloader')
);

// No collision! Different keys in localStorage
```

### API calls failing with CORS errors

**Problem:** Backend API doesn't allow requests from your domain.

**Solution:** This is a backend configuration issue, not related to Domain Layer. Contact backend team to add your domain to CORS whitelist.

### TypeScript errors with VerifiedResult

**Problem:** TypeScript can't infer correct type for `result.data`.

**Solution:** Explicit type is automatically inferred from method signature. If needed, import DTO types.

```typescript
import type { SearchDto } from '@downloader/core';

const result = await api.searchTitle({ keyword: 'test' });
// result is VerifiedResult<SearchDto>
// result.data is SearchDto | null
```

---

## Summary

**For Site Projects:**

1. **Install** `@downloader/core`
2. **Setup** domain layer with unique JWT key
3. **Use** `api.*` methods throughout your app
4. **Handle** `VerifiedResult` with `ok` check and error codes
5. **Don't** access lower layers (services, http, etc.)

**That's it!** Domain layer handles all complexity for you:
- ✅ JWT auto-injection
- ✅ JWT auto-extraction and storage
- ✅ Response verification
- ✅ Standardized error handling
- ✅ CAPTCHA payload support

---

## Additional Resources

- [LocalStorage Key Collision Prevention](./LOCALSTORAGE_KEY_COLLISION.md)
- [Verified Services Quick Start](./VERIFIED_SERVICES_QUICKSTART.md)
- TypeScript type definitions are included in the package
