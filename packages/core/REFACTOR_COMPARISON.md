# Service Refactor Comparison: Old vs New Architecture

## 📐 Architecture Pattern

### ❌ Old Pattern (Functional Composition)
```typescript
export function createConversionService(
  httpClient: IHttpClient,
  config: ApiConfig,
  onJwtReceived?: JwtSaveCallback
): IConversionService {
  // Service logic here - directly uses httpClient
}
```

### ✅ New Pattern (OOP Inheritance)
```typescript
class ConversionServiceImpl extends BaseService implements IConversionService {
  // Service logic here - uses base protected methods
}

export function createConversionService(...) {
  return new ConversionServiceImpl(...);
}
```

---

## 🔍 Detailed Comparison

### 1. JWT Handling

#### ❌ Old (Duplicate in Every Service)
```typescript
export function createConversionService(..., onJwtReceived?) {
  let internalJwt: string | null = null;

  // Manual JWT handler
  const handleJwt = createJwtHandler(onJwtReceived, {
    get current() { return internalJwt; },
    set current(val) { internalJwt = val; }
  });

  async function convert(params, protectionPayload) {
    const response = await httpClient.request(...);
    handleJwt(response);  // Manual call
    // ...
  }

  async function checkTask(params) {
    const headers = {};
    if (internalJwt) {  // Manual check
      headers['Authorization'] = `Bearer ${internalJwt}`;
    }
    const response = await httpClient.request({ ..., headers });
    // ...
  }
}
```

#### ✅ New (Automatic in BaseService)
```typescript
class ConversionServiceImpl extends BaseService {
  async convert(params, protectionPayload) {
    // Base automatically:
    // - Extracts JWT from response
    // - Saves to this.internalJwt
    // - Calls this.onJwtReceived()
    const response = await this.makeRequest(..., protectionPayload);
    // ...
  }

  async checkTask(params) {
    // Base automatically adds Authorization header from this.internalJwt
    const response = await this.makeRequestWithInternalJwt(...);
    // ...
  }
}
```

---

### 2. Protection Payload Handling (JWT/CAPTCHA)

#### ❌ Old (Duplicate Logic)
```typescript
async function convert(params, protectionPayload) {
  const headers: Record<string, string> = {};
  const data: Record<string, unknown> = { vid: params.vid, key: params.key };

  // Manual header building
  if (protectionPayload.jwt) {
    headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
  } else if (protectionPayload.captcha) {
    // Manual CAPTCHA data building
    data.captcha_token = protectionPayload.captcha.token;
    data.provider = protectionPayload.captcha.provider || 'recaptcha';
  }

  const response = await httpClient.request({ method, url, data, headers });
  // ...
}
```

#### ✅ New (Automatic in BaseService)
```typescript
async convert(params, protectionPayload) {
  // Base automatically:
  // - Builds JWT headers: Authorization: Bearer ${jwt}
  // - Adds CAPTCHA to data: captcha_token, provider
  const response = await this.makeRequest({
    method: 'POST',
    url: API_ENDPOINTS.CONVERT,
    data: { vid: params.vid, key: params.key }
  }, protectionPayload);
  // ...
}
```

---

### 3. Response Unwrapping

#### ❌ Old (Manual Call)
```typescript
async function convert(...) {
  const response = await httpClient.request(...);
  handleJwt(response);

  // Manual unwrap
  const unwrapped = unwrapSimpleResponse<ConvertResponseData>(response);
  return mapConversionResponse(unwrapped);
}
```

#### ✅ New (Base Methods)
```typescript
async convert(...) {
  const response = await this.makeRequest(...);

  // Use base unwrap methods
  const unwrapped = this.unwrapSimpleResponse<ConvertResponseData>(response);
  return mapConversionResponse(unwrapped);
}
```

---

### 4. Verification Control

#### ❌ Old (No Verification Support)
```typescript
// No way to enable/disable verification
// No domain layer control
async function convert(...) {
  const response = await httpClient.request(...);
  // Response goes directly to mapper - no verification
  return mapConversionResponse(response);
}
```

#### ✅ New (Domain Layer Control)
```typescript
// Domain layer can enable/disable verification
const service = createConversionService(httpClient, config);

// Enable verification
service.setVerification(true, 'conversion-policy');

// All requests now go through verification
const task = await service.convert(...);
// → Base automatically verifies response before returning
```

---

## 🎯 Key Benefits

### 1. **No Direct httpClient Access**
- ❌ Old: Services call `httpClient.request()` directly
- ✅ New: Services MUST use `this.makeRequest()` - enforced by architecture

### 2. **Centralized Protection Logic**
- ❌ Old: JWT/CAPTCHA logic duplicated in 6+ services
- ✅ New: Single implementation in BaseService

### 3. **Verification Flag System**
- ❌ Old: No verification support
- ✅ New: Domain layer can enable/disable per service instance

### 4. **Automatic JWT Management**
- ❌ Old: Manual `handleJwt()` calls in every request
- ✅ New: Automatic extraction in `this.makeRequest()`

### 5. **Type Safety**
- ❌ Old: Easy to forget protection handling
- ✅ New: TypeScript enforces correct patterns via inheritance

---

## 📊 Code Reduction

### Before (Old Pattern)
```typescript
// conversion.service.ts - 110 lines
let internalJwt: string | null = null;
const handleJwt = createJwtHandler(...);  // 5 lines

async function convert(...) {
  const headers = {};
  const data = { vid, key };

  if (protectionPayload.jwt) {           // 3 lines
    headers['Authorization'] = ...;
  } else if (protectionPayload.captcha) { // 4 lines
    data.captcha_token = ...;
    data.provider = ...;
  }

  const response = await httpClient.request({ method, url, data, headers });
  handleJwt(response);                   // 1 line
  const unwrapped = unwrapSimpleResponse(response);
  return mapConversionResponse(unwrapped);
}

async function checkTask(...) {
  const headers = {};
  if (internalJwt) {                     // 3 lines
    headers['Authorization'] = ...;
  }
  const response = await httpClient.request(...);
  handleJwt(response);
  const unwrapped = unwrapSimpleResponse(response);
  return mapConversionResponse(unwrapped);
}
```
**Total: ~110 lines, ~20 lines of duplicate protection logic**

### After (New Pattern)
```typescript
// conversion.service.refactored.ts - 65 lines
class ConversionServiceImpl extends BaseService {
  async convert(params, protectionPayload) {
    const response = await this.makeRequest({
      method: 'POST',
      url: API_ENDPOINTS.CONVERT,
      data: { vid: params.vid, key: params.key }
    }, protectionPayload);

    const unwrapped = this.unwrapSimpleResponse(response);
    return mapConversionResponse(unwrapped);
  }

  async checkTask(params) {
    const response = await this.makeRequestWithInternalJwt({
      method: 'GET',
      url: API_ENDPOINTS.CHECK_TASK,
      data: { vid: params.vid, b_id: params.b_id }
    });

    const unwrapped = this.unwrapSimpleResponse(response);
    return mapConversionResponse(unwrapped);
  }
}
```
**Total: ~65 lines, 0 lines of duplicate logic**

**Reduction: 41% less code, 100% less duplication**

---

## 🚀 Migration Path

### Step 1: Refactor One Service
```typescript
// Before
export function createConversionService(httpClient, config, onJwtReceived) {
  // ... 110 lines
}

// After
class ConversionServiceImpl extends BaseService implements IConversionService {
  // ... 65 lines
}

export function createConversionService(httpClient, config, onJwtReceived) {
  return new ConversionServiceImpl(httpClient, config, onJwtReceived);
}
```

### Step 2: Enable Verification (Domain Layer)
```typescript
const conversionService = createConversionService(httpClient, config);

// Enable verification for this service
conversionService.setVerification(true, 'conversion-policy');

// All requests now verified
await conversionService.convert(...);  // → Verified through domain layer
```

### Step 3: Repeat for All 11 Services
- ✅ conversion.service.ts
- ⏳ decrypt.service.ts
- ⏳ feedback.service.ts
- ⏳ media.service.ts
- ⏳ multifile.service.ts
- ⏳ playlist.service.ts
- ⏳ search.service.ts
- ⏳ queue.service.ts
- ⏳ searchv2.service.ts
- ⏳ youtube-download.service.ts
- ⏳ public-api.service.ts

---

## ✅ Final Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Domain Layer                       │
│  - Control verification flags                       │
│  - Enable/disable per service                       │
└────────────────┬────────────────────────────────────┘
                 │ setVerification(true/false)
┌────────────────▼────────────────────────────────────┐
│              Service Layer                          │
│  ┌──────────────────────────────────────────────┐  │
│  │         BaseService (abstract)               │  │
│  │  - makeRequest() ← All requests go through   │  │
│  │  - JWT extraction & cleaning                 │  │
│  │  - Protection handling                       │  │
│  │  - Verification control                      │  │
│  │  - Response cleaning (remove jwt field)     │  │
│  └─────────┬────────────────────────────────────┘  │
│            │ extends                                │
│  ┌─────────▼──────────┐  ┌────────────────────┐   │
│  │ ConversionService  │  │  MediaService      │   │
│  │ - convert()        │  │  - extractMedia()  │   │
│  │ - checkTask()      │  │  - ...             │   │
│  └────────────────────┘  └────────────────────┘   │
└────────────────┬────────────────────────────────────┘
                 │ this.httpClient.request()
┌────────────────▼────────────────────────────────────┐
│              HTTP Client Layer                      │
│  - Low-level HTTP operations                        │
│  - No business logic                                │
└─────────────────────────────────────────────────────┘
```

**Key Principles:**
1. ✅ Services NEVER call `httpClient` directly
2. ✅ All requests go through `BaseService.makeRequest()`
3. ✅ Domain layer controls verification via `setVerification()`
4. ✅ Single source of truth for protection logic
5. ✅ TypeScript enforces correct patterns
6. ✅ **NEW**: Response cleaning - JWT removed before returning to services
