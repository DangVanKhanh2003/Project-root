# JWT Handling Flow - Option 2: Domain Layer Architecture

## 🎯 Decision: JWT Handling at Domain Layer

**CORRECT ARCHITECTURE:** JWT extraction, storage, và verification nên ở **Domain Layer (Verifier)**, KHÔNG phải BaseService.

### **Tại Sao?**

```
✅ Domain Layer Responsibilities:
   - Verify response (success/warning/error)
   - Extract và save JWT
   - Handle CAPTCHA logic
   - Business validation

✅ BaseService Responsibilities:
   - PURE HTTP transport
   - Protection headers/data building
   - NO business logic
   - NO JWT handling
```

---

## 🏗️ Final Architecture

```
┌─────────────────────────────────────────────────────┐
│            Domain Layer (Verifier)                  │
│  ┌───────────────────────────────────────────────┐ │
│  │  verifyResponse(rawResponse)                  │ │
│  │  1. Extract JWT from rawResponse              │ │
│  │  2. Save JWT (localStorage/Redux)             │ │
│  │  3. Clean response (remove jwt field)         │ │
│  │  4. Verify business rules                     │ │
│  │  5. Return VerifiedResult                     │ │
│  └───────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         BaseService (PURE Transport)                │
│  ┌───────────────────────────────────────────────┐ │
│  │  makeRequest(options, protectionPayload)      │ │
│  │  1. Build protection headers (JWT)            │ │
│  │  2. Add CAPTCHA to data                       │ │
│  │  3. Make HTTP request                         │ │
│  │  4. Return RAW response (with jwt field)      │ │
│  └───────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              HTTP Client                            │
│  Raw HTTP operations only                           │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow (Option 2)

### **1. Service Layer - Call BaseService**

```typescript
// Service implementation (conversion.service.ts)
class ConversionServiceImpl extends BaseService {
  async convert(params: ConvertRequest, protectionPayload?: ProtectionPayload) {
    // Call BaseService - returns RAW response (with jwt field)
    const rawResponse = await this.makeRequest({
      method: 'POST',
      url: API_ENDPOINTS.CONVERT,
      data: { vid: params.vid, key: params.key }
    }, protectionPayload);

    // rawResponse = { data: {...}, jwt: 'abc123' } ← JWT STILL PRESENT!

    // Domain Layer will handle JWT + verification
    // For now, just unwrap and map
    const unwrapped = this.unwrapSimpleResponse(rawResponse);
    return mapConversionResponse(unwrapped);
  }
}
```

---

### **2. BaseService - PURE HTTP Transport**

```typescript
// base-service.ts
protected async makeRequest<TResponse>(
  options: BaseRequestOptions,
  protectionPayload?: ProtectionPayload
): Promise<TResponse> {
  // 1. Build protection headers
  const headers = this.buildProtectionHeaders(protectionPayload);
  // → { 'Authorization': 'Bearer user_jwt' }

  // 2. Add CAPTCHA to data
  const requestData = this.addProtectionToData(data, protectionPayload);
  // → { vid: '123', key: 'abc', captcha_token: 'xxx' }

  // 3. Make HTTP request
  const response = await this.httpClient.request({
    method, url, data: requestData, headers
  });

  // 4. Return RAW response - NO JWT handling!
  return response;
  // response = { data: {...}, jwt: 'new_token' } ← JWT intact!
}
```

**BaseService KHÔNG:**
- ❌ Extract JWT
- ❌ Clean response
- ❌ Call callbacks
- ❌ Save JWT anywhere

**BaseService CHỈ:**
- ✅ Build protection headers/data
- ✅ Make HTTP request
- ✅ Return raw response

---

### **3. Domain Layer - JWT + Verification (Phase 2D)**

```typescript
// domain/verifier.ts (TO BE IMPLEMENTED in Phase 2D)

interface VerifiedResult<T> {
  ok: boolean;
  status: 'success' | 'warning' | 'error';
  code: string;
  message: string;
  data: T | null;
  raw?: any;
}

class DomainVerifier {
  private jwtStore: JwtStore;

  /**
   * Verify and process service response
   * Handles JWT extraction, storage, cleaning, and business validation
   */
  async verifyResponse<T>(
    rawResponse: any,
    policy: string
  ): Promise<VerifiedResult<T>> {
    // 1️⃣ Extract JWT from raw response
    let jwt: string | null = null;
    if (rawResponse?.jwt) {
      jwt = rawResponse.jwt;

      // 2️⃣ Save JWT to storage
      this.jwtStore.save(jwt);
      localStorage.setItem('app_jwt', jwt);

      console.log('JWT extracted and saved:', jwt);
    }

    // 3️⃣ Clean response - remove jwt field
    const { jwt: _, ...cleanedResponse } = rawResponse;

    // 4️⃣ Verify business logic using policy
    const policy = this.policies[policyName];
    const verified = await policy(cleanedResponse);

    // 5️⃣ Return verified result
    return {
      ok: verified.status === 'success',
      status: verified.status,
      code: verified.code,
      message: verified.message,
      data: verified.data,
      raw: cleanedResponse
    };
  }
}
```

---

### **4. Service với Domain Wrapper (Phase 2D)**

```typescript
// Domain-wrapped service (future implementation)
class VerifiedConversionService {
  private service: IConversionService;
  private verifier: DomainVerifier;

  async convert(
    params: ConvertRequest,
    protectionPayload?: ProtectionPayload
  ): Promise<VerifiedResult<TaskDto>> {
    // 1. Call raw service
    const rawResponse = await this.service.convert(params, protectionPayload);
    // rawResponse = { data: {...}, jwt: 'new_token' }

    // 2. Domain verifier handles JWT + verification
    const verified = await this.verifier.verifyResponse(
      rawResponse,
      'conversion-policy'
    );
    // → JWT extracted and saved
    // → Response cleaned
    // → Business rules verified

    return verified;
    // { ok: true, status: 'success', data: TaskDto, ... }
  }
}
```

---

## 📊 Comparison: Option 1 vs Option 2

| Aspect | Option 1 (BaseService) | Option 2 (Domain Layer) ✅ |
|--------|------------------------|----------------------------|
| **JWT Extraction** | BaseService | Domain Layer |
| **JWT Storage** | BaseService.internalJwt + callback | Domain Layer |
| **Response Cleaning** | BaseService.cleanResponse() | Domain Layer |
| **Verification** | BaseService flag | Domain Layer |
| **BaseService Role** | HTTP + JWT + Verification | PURE HTTP transport |
| **Separation** | Mixed concerns | Clean separation |
| **CAPTCHA Logic** | BaseService | Domain Layer (same place as JWT) |

---

## ✅ Why Option 2 is Better

### **1. Clean Separation of Concerns**

```typescript
// BaseService - PURE transport (no business logic)
class BaseService {
  protected async makeRequest() {
    // Build request
    // Make HTTP call
    // Return raw response
  }
}

// Domain Layer - ALL business logic
class DomainVerifier {
  verifyResponse() {
    // Extract JWT
    // Save JWT
    // Clean response
    // Verify business rules
    // Return verified result
  }
}
```

### **2. Consistent Logic Location**

```
Domain Layer handles:
✅ JWT extraction
✅ JWT storage
✅ CAPTCHA verification
✅ Response validation
✅ Business rules

→ ALL trong CÙNG MỘT LAYER!
```

### **3. Easier to Test**

```typescript
// Test BaseService - simple HTTP mocking
test('makeRequest builds correct headers', () => {
  const response = await service.makeRequest(..., { jwt: 'test' });
  expect(httpClient.request).toHaveBeenCalledWith({
    headers: { 'Authorization': 'Bearer test' }
  });
});

// Test Domain Layer - business logic only
test('verifier extracts and saves JWT', () => {
  const verified = await verifier.verifyResponse({
    data: {...},
    jwt: 'new_token'
  });
  expect(jwtStore.get()).toBe('new_token');
});
```

### **4. Flexible JWT Storage**

```typescript
// Domain Layer có thể implement nhiều storage strategies
class DomainVerifier {
  constructor(
    private jwtStore: JwtStore  // Can be localStorage, Redux, cookie, etc.
  ) {}

  async verifyResponse(rawResponse) {
    if (rawResponse?.jwt) {
      // Use whatever storage strategy was provided
      this.jwtStore.save(rawResponse.jwt);
    }
  }
}

// App decides storage strategy
const verifier = new DomainVerifier(
  new LocalStorageJwtStore()  // or ReduxJwtStore, CookieJwtStore, etc.
);
```

---

## 🚀 Phase 2D Implementation Plan

**Domain Layer sẽ implement:**

```typescript
// /packages/core/src/domain/verification/verifier.ts
export interface VerificationPolicy<T> {
  (response: any): Promise<VerifiedResult<T>>;
}

export class DomainVerifier {
  // JWT storage
  private jwtStore: JwtStore;

  // Verification policies (from old verifier.js)
  private policies: Record<string, VerificationPolicy<any>>;

  async verifyResponse<T>(
    rawResponse: any,
    policyName: string
  ): Promise<VerifiedResult<T>> {
    // 1. Extract JWT
    // 2. Save JWT
    // 3. Clean response
    // 4. Verify with policy
    // 5. Return verified result
  }
}

// /packages/core/src/domain/jwt/jwt-store.ts
export interface JwtStore {
  save(jwt: string): void;
  get(): string | null;
  clear(): void;
}

export class LocalStorageJwtStore implements JwtStore {
  save(jwt: string) {
    localStorage.setItem('app_jwt', jwt);
  }
  // ...
}
```

---

## 📝 Migration Notes

**Current State (Phase 2C):**
- BaseService returns **RAW response** (with jwt field)
- Services unwrap and map themselves
- NO verification yet

**Future State (Phase 2D):**
- Domain Layer wraps services
- Handles JWT + CAPTCHA + Verification
- Services remain unchanged (backward compatible)

**Example Migration:**

```typescript
// Before (Phase 2C - current)
const service = createConversionService(httpClient, config);
const taskDto = await service.convert(params, protectionPayload);
// taskDto = raw mapped response

// After (Phase 2D - with domain layer)
const verifiedService = createVerifiedService(service, verifier);
const result = await verifiedService.convert(params, protectionPayload);
// result = { ok: true, status: 'success', data: taskDto, ... }
```

---

## ✅ Summary

**BaseService (PURE Transport):**
- ✅ Build protection headers/data
- ✅ Make HTTP request
- ✅ Return raw response
- ❌ NO JWT handling
- ❌ NO verification
- ❌ NO business logic

**Domain Layer (Business Logic - Phase 2D):**
- ✅ Extract JWT from raw response
- ✅ Save JWT (localStorage/Redux/etc.)
- ✅ Clean response (remove jwt field)
- ✅ Verify business rules
- ✅ Handle CAPTCHA logic
- ✅ Return VerifiedResult

**This is the CORRECT architecture! 🎯**
