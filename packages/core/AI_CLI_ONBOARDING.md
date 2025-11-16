# AI CLI Onboarding Guide - @downloader/core Package

**🎯 OBJECTIVE: Hiểu project và tiếp tục triển khai Phase 2E - Multifile Service Integration**

---

## 📌 START HERE - Your Mission

Bạn là AI CLI được giao nhiệm vụ **tiếp tục triển khai TypeScript monorepo migration** cho dự án @downloader/core.

**Current Status:** Phase 2D đã hoàn thành (Domain Layer - VerifiedServices). Bạn cần tiếp tục **Phase 2E**.

**Your Task:** Đọc và hiểu project architecture, sau đó tiếp tục implement missing services và hoàn thiện domain layer integration.

---

## 🔍 STEP 1: Hiểu Project Overview

### Required Reading (Thứ tự đọc)

**1. Read Project Status & Roadmap:**
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/REFACTOR_COMPARISON.md
```
- Đọc để hiểu: Migration phases, current status, what's done, what's next

**2. Read Domain Layer Guide (MOST IMPORTANT):**
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/DOMAIN_LAYER_GUIDE.md
```
- Đây là MAIN API mà site projects sẽ sử dụng
- Hiểu 14 methods hiện có
- Hiểu flow: Setup → Use API → Handle VerifiedResult

**3. Read JWT Storage Strategy:**
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/LOCALSTORAGE_KEY_COLLISION.md
```
- Hiểu tại sao cần namespaced keys
- Hiểu createNamespacedKey() helper

**4. Read Quick Start:**
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/VERIFIED_SERVICES_QUICKSTART.md
```
- Example usage patterns

---

## 🏗️ STEP 2: Hiểu Architecture

### Core Concepts

**Project Structure:**
```
@downloader/core/
├── src/
│   ├── domain/              # ← MAIN LAYER (Site projects chỉ dùng tầng này)
│   │   ├── verified-services.ts      # Main API wrapper
│   │   ├── verification/
│   │   │   ├── verifier.ts           # JWT extraction & verification
│   │   │   ├── types.ts              # VerifiedResult, policies
│   │   │   ├── messages.ts           # Error messages
│   │   │   └── policies.ts           # DEFAULT_POLICIES
│   │   └── jwt/
│   │       └── jwt-store.interface.ts # JWT storage abstractions
│   │
│   ├── services/            # ← SERVICE LAYER (Internal - domain layer calls these)
│   │   ├── base/
│   │   │   └── base-service.ts       # Abstract base for all services
│   │   ├── v1/
│   │   │   ├── interfaces/           # Service contracts
│   │   │   └── implementations/      # Service implementations
│   │   ├── v2/
│   │   └── public-api/
│   │
│   ├── http/                # ← HTTP LAYER (Transport)
│   │   └── http-client.ts
│   │
│   └── models/              # ← DATA MODELS
│       ├── dto/             # Domain Transfer Objects (clean, verified data)
│       └── remote/          # Remote API request/response types
```

### Flow Architecture

```
Site Project
    ↓ imports
Domain Layer (verified-services.ts)
    ↓ uses
Service Layer (search.service.ts, media.service.ts, etc.)
    ↓ uses
HTTP Client
    ↓ calls
Remote Backend API
```

**Key Pattern:**
1. Site project calls `api.extractMedia()`
2. VerifiedServices auto-injects JWT from localStorage
3. Service method calls backend API
4. Backend returns `{ data, jwt: 'new-token' }`
5. Verifier extracts JWT → saves to localStorage
6. Verifier cleans response (removes jwt field)
7. Verifier verifies with policy
8. Returns `VerifiedResult<T>` to site project

---

## 📊 STEP 3: Check Current Status

### What's Completed ✅

**Phase 2A - HTTP Client:** ✅ DONE
- Axios-based HTTP client with interceptors
- File: `/src/http/http-client.ts`

**Phase 2B - Base Service:** ✅ DONE
- Abstract BaseService class
- JWT/CAPTCHA payload handling
- File: `/src/services/base/base-service.ts`

**Phase 2C - Core Services (V1, V2):** ✅ DONE
- Search, Media, Conversion, Playlist, Decrypt, Feedback
- SearchV2, Queue, YouTubeDownload
- Files: `/src/services/v1/implementations/*.service.ts`, `/src/services/v2/implementations/*.service.ts`

**Phase 2D - Domain Layer:** ✅ DONE
- DomainVerifier (JWT extraction + verification)
- VerifiedServices (main API wrapper)
- JWT Stores (LocalStorage, InMemory, Custom)
- Files:
  - `/src/domain/verified-services.ts`
  - `/src/domain/verification/verifier.ts`
  - `/src/domain/jwt/jwt-store.interface.ts`

**Current API Coverage: 14 methods from 9 services**

### What's Missing ❌

**Phase 2E - Missing Services:**

1. **IMultifileService** (2 methods) - THIẾU
   - `startMultifileSession(params, protectionPayload?)` - Có JWT/CAPTCHA
   - `getMultifileStatus(params)` - Không có protection
   - Interface: `/src/services/v1/interfaces/multifile.interface.ts`
   - Implementation: `/src/services/v1/implementations/multifile.service.ts`

2. **IYouTubePublicApiService** (1 method) - THIẾU
   - `getMetadata(url)` - Không có protection
   - Interface: `/src/services/public-api/interfaces/public-api.interface.ts`
   - Implementation: `/src/services/public-api/implementations/public-api.service.ts`

---

## 🎯 STEP 4: Your Next Task - Phase 2E

### Task: Add Missing Services to Domain Layer

**Goal:** Add Multifile and YouTubePublicApi services to VerifiedServices API

### Sub-tasks:

#### Task 2E-1: Add IMultifileService ✅ Priority HIGH

**What to do:**

1. **Update CoreServices interface** in `/src/domain/verified-services.ts`:
   ```typescript
   import type { IMultifileService } from '../services/v1/interfaces/multifile.interface';

   export interface CoreServices {
     // ... existing services
     multifile: IMultifileService;  // ← ADD THIS
   }
   ```

2. **Add to methodRegistry** in `createVerifiedServices()`:
   ```typescript
   const methodRegistry = {
     // ... existing methods

     // Multifile (with protection for start session)
     'startMultifileSession': (params: any, payload?: ProtectionPayload) =>
       services.multifile.startMultifileSession(params, payload),
     'getMultifileStatus': (params: any) =>
       services.multifile.getMultifileStatus(params),
   };
   ```

3. **Add to return object**:
   ```typescript
   return {
     // ... existing methods

     // ========================================
     // Multifile
     // ========================================

     startMultifileSession: (
       params: Parameters<IMultifileService['startMultifileSession']>[0],
       protectionPayload?: ProtectionPayload
     ) => {
       const payload = getProtectionPayload(protectionPayload);
       return wrap('startMultifileSession', params, payload);
     },

     getMultifileStatus: (params: Parameters<IMultifileService['getMultifileStatus']>[0]) =>
       wrap('getMultifileStatus', params),
   };
   ```

4. **Update setup documentation** in `DOMAIN_LAYER_GUIDE.md`:
   - Add import: `createMultifileService`
   - Add to coreServices object: `multifile: createMultifileService(httpClient, apiConfig)`
   - Add API reference section for multifile methods

5. **Verify factory function exists:**
   - Check `/src/services/v1/index.ts` exports `createMultifileService`
   - If not, create factory function

#### Task 2E-2: Add IYouTubePublicApiService ✅ Priority MEDIUM

**What to do:**

1. **Update CoreServices interface**:
   ```typescript
   import type { IYouTubePublicApiService } from '../services/public-api/interfaces/public-api.interface';

   export interface CoreServices {
     // ... existing services
     youtubePublicApi: IYouTubePublicApiService;  // ← ADD THIS
   }
   ```

2. **Add to methodRegistry**:
   ```typescript
   const methodRegistry = {
     // ... existing methods

     // YouTube Public API
     'getMetadata': (url: string) =>
       services.youtubePublicApi.getMetadata(url),
   };
   ```

3. **Add to return object**:
   ```typescript
   return {
     // ... existing methods

     // ========================================
     // YouTube Public API
     // ========================================

     getMetadata: (url: string) =>
       wrap('getMetadata', url),
   };
   ```

4. **Update documentation**

5. **Verify factory function exists**

#### Task 2E-3: Update Documentation

**Files to update:**

1. **DOMAIN_LAYER_GUIDE.md**
   - Add multifile methods to API Reference
   - Add youtubePublicApi method to API Reference
   - Add usage examples
   - Update method count (14 → 17 methods)

2. **VERIFIED_SERVICES_QUICKSTART.md**
   - Add multifile and youtubePublicApi to setup example

3. **REFACTOR_COMPARISON.md**
   - Mark Phase 2E as DONE
   - Update progress tracking

---

## 🔧 STEP 5: Implementation Checklist

### Before You Start

- [ ] Read all required documents in STEP 1
- [ ] Understand architecture in STEP 2
- [ ] Check existing implementations in `/src/domain/verified-services.ts`
- [ ] Look at existing service interfaces to understand patterns

### During Implementation

- [ ] Add imports for new service interfaces
- [ ] Update CoreServices interface
- [ ] Add methods to methodRegistry (exact method names!)
- [ ] Add methods to return object with proper typing
- [ ] Run `npm run build` to verify no TypeScript errors
- [ ] Update documentation files

### After Implementation

- [ ] Verify all 17 methods are present
- [ ] Verify method names match interface exactly
- [ ] Verify build succeeds: `npm run build`
- [ ] Update REFACTOR_COMPARISON.md status
- [ ] Test that factory functions exist and work

---

## 📁 Key Files to Edit

### Must Edit:

1. `/src/domain/verified-services.ts`
   - Add new service imports
   - Update CoreServices interface
   - Add to methodRegistry
   - Add to return object

2. `/src/domain/index.ts`
   - Verify exports are correct

3. `DOMAIN_LAYER_GUIDE.md`
   - Add new API methods to reference
   - Add usage examples
   - Update method count

4. `VERIFIED_SERVICES_QUICKSTART.md`
   - Update setup example

5. `REFACTOR_COMPARISON.md`
   - Update phase status

### May Need to Check:

1. `/src/services/v1/index.ts`
   - Verify `createMultifileService` exists

2. `/src/services/public-api/index.ts`
   - Verify `createYouTubePublicApiService` exists

3. `/src/index.ts`
   - Verify all exports

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T:

1. **Don't use wrong method names in registry**
   - Registry key MUST match interface method name exactly
   - Bad: `'multifile'` → Good: `'startMultifileSession'`

2. **Don't forget protection payload for protected methods**
   - `startMultifileSession` needs `protectionPayload?` parameter
   - Use `getProtectionPayload()` helper

3. **Don't skip TypeScript typing**
   - Use `Parameters<IService['methodName']>[0]` for type safety

4. **Don't forget to build and verify**
   - Always run `npm run build` after changes

### ✅ DO:

1. **Follow existing patterns** in verified-services.ts
2. **Use exact method names** from interfaces
3. **Test build after every change**
4. **Update all documentation files**

---

## 🎓 Learning Resources

### Pattern Examples

**Pattern 1: Simple method (no protection):**
```typescript
// Registry
'getMultifileStatus': (params: any) =>
  services.multifile.getMultifileStatus(params),

// Return object
getMultifileStatus: (params: Parameters<IMultifileService['getMultifileStatus']>[0]) =>
  wrap('getMultifileStatus', params),
```

**Pattern 2: Protected method (with JWT/CAPTCHA):**
```typescript
// Registry
'startMultifileSession': (params: any, payload?: ProtectionPayload) =>
  services.multifile.startMultifileSession(params, payload),

// Return object
startMultifileSession: (
  params: Parameters<IMultifileService['startMultifileSession']>[0],
  protectionPayload?: ProtectionPayload
) => {
  const payload = getProtectionPayload(protectionPayload);
  return wrap('startMultifileSession', params, payload);
},
```

**Pattern 3: Method with multiple parameters:**
```typescript
// Registry
'searchV2': (query: string, options?: any) =>
  services.searchV2.searchV2(query, options),

// Return object
searchV2: (query: string, options?: Parameters<ISearchV2Service['searchV2']>[1]) =>
  wrap('searchV2', query, options),
```

---

## 🎯 Success Criteria

### You're Done When:

- [ ] **17 methods total** in VerifiedServices (14 existing + 3 new)
- [ ] **Build succeeds** without TypeScript errors
- [ ] **All method names** match interface methods exactly
- [ ] **Documentation updated** with new APIs
- [ ] **REFACTOR_COMPARISON.md** shows Phase 2E complete

### Final Check Command:

```bash
cd /Users/macos/Documents/work/downloader/Project-root/packages/core
npm run build
```

If build succeeds → Task complete! ✅

---

## 🚀 What Happens After Phase 2E?

**Next phases will be:**

- **Phase 2F:** Testing & validation
- **Phase 3:** Site project integration
- **Phase 4:** Documentation & migration guide

But for now, **focus on Phase 2E only.**

---

## 💡 Pro Tips

1. **Read existing code first** - Don't guess patterns, look at what's already there
2. **Copy-paste-modify** - Use existing methods as templates
3. **Build often** - Catch errors early
4. **One task at a time** - Do Multifile first, then YouTubePublicApi
5. **Ask for confirmation** - Show your plan before implementing

---

## 📞 Getting Help

**If stuck, check these files for reference:**

- **How VerifiedServices works:** `/src/domain/verified-services.ts` (existing code)
- **Service interfaces:** `/src/services/v1/interfaces/*.interface.ts`
- **Implementation examples:** `/src/services/v1/implementations/*.service.ts`
- **Usage examples:** `DOMAIN_LAYER_GUIDE.md`

**Common questions:**

Q: Method name to use?
A: Check interface file - use EXACT method name

Q: Does method need protection?
A: Check interface - if has `protectionPayload?` parameter → yes

Q: How to type parameters?
A: Use `Parameters<IServiceName['methodName']>[0]`

---

## ✅ Ready to Start?

**Your workflow:**

1. ✅ Read all documents (STEP 1-3)
2. ✅ Understand current status (STEP 4)
3. 📝 Create implementation plan
4. 👤 Get user confirmation on plan
5. 💻 Implement Task 2E-1 (Multifile)
6. ✅ Build & verify
7. 💻 Implement Task 2E-2 (YouTubePublicApi)
8. ✅ Build & verify
9. 📝 Update documentation
10. 🎉 Mark Phase 2E complete

**Start by confirming you understand the task!**

Say: "I've read the onboarding guide. I understand I need to add Multifile and YouTubePublicApi services to VerifiedServices. Let me create an implementation plan."
