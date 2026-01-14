# @downloader/core

TypeScript core package for video downloader backend integration.

---

## 🤖 For AI CLI Developers

**If you're an AI CLI starting work on this project, START HERE:**

### 👉 Read This First:
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/AI_CLI_ONBOARDING.md
```

**This file contains:**
- ✅ Project overview & architecture
- ✅ Current status & what's completed
- ✅ Your task & what needs to be done
- ✅ Step-by-step implementation guide
- ✅ Success criteria

**Copy the prompt from:**
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/AI_CLI_PROMPT.md
```

### Quick Start for AI:

```bash
# 1. Read onboarding guide
# 2. Find and read all Required Reading files
# 3. Create implementation plan
# 4. Get user confirmation
# 5. Implement
```

**DO NOT code immediately!** Read the onboarding guide first.

---

## 📚 For Human Developers

### Installation

```bash
npm install @downloader/core
```

### Quick Start

**For Site Projects (RECOMMENDED):**

Read the Domain Layer Guide:
```
./DOMAIN_LAYER_GUIDE.md
```

Site projects should ONLY use the Domain Layer API. Do NOT import internal services directly.

**Example Setup:**

```typescript
import {
  createHttpClient,
  createVerifier,
  createVerifiedServices,
  LocalStorageJwtStore,
  createNamespacedKey,
  DEFAULT_POLICIES,

  // Service factories
  createSearchService,
  createMediaService,
  createConversionService,
  // ... other services
} from '@downloader/core';

// 1. Create JWT Store
const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('myapp', 'downloader')
);

// 2. Create Verifier
const verifier = createVerifier({
  jwtStore,
  policies: DEFAULT_POLICIES,
  verbose: true
});

// 3. Create HTTP Client & Services
const httpClient = createHttpClient({
  baseURL: 'https://api.your-backend.com',
  timeout: 30000
});

const coreServices = {
  search: createSearchService(httpClient, { baseURL: '...', timeout: 30000 }),
  media: createMediaService(httpClient, { baseURL: '...', timeout: 30000 }),
  // ... other services
};

// 4. Create Verified Services API
export const api = createVerifiedServices(coreServices, verifier);

// 5. Use the API
const result = await api.searchTitle({ keyword: 'cats', from: 'youtube' });
if (result.ok) {
  console.log('Videos:', result.data.videos);
}
```

**See full documentation:**
- [Domain Layer Guide](./DOMAIN_LAYER_GUIDE.md) - Complete API reference
- [Quick Start](./VERIFIED_SERVICES_QUICKSTART.md) - Usage examples
- [JWT Storage](./LOCALSTORAGE_KEY_COLLISION.md) - Prevent key collisions

---

## 🏗️ Project Structure

```
@downloader/core/
├── src/
│   ├── domain/              # Main API layer (site projects use this)
│   │   ├── verified-services.ts
│   │   ├── verification/
│   │   └── jwt/
│   │
│   ├── services/            # Service implementations (internal)
│   │   ├── base/
│   │   ├── v1/
│   │   ├── v2/
│   │   └── public-api/
│   │
│   ├── http/                # HTTP client
│   ├── models/              # DTOs and types
│   └── config/
│
├── DOMAIN_LAYER_GUIDE.md    # 📖 Main documentation
├── AI_CLI_ONBOARDING.md     # 🤖 For AI CLI developers
└── REFACTOR_COMPARISON.md   # Project status & roadmap
```

---

## 🎯 Available APIs (14 methods)

### Search
- `api.searchTitle()` - Search videos
- `api.getSuggestions()` - Get search suggestions
- `api.searchV2()` - Search with pagination

### Media
- `api.extractMedia()` - Extract video info (auto JWT)
- `api.extractMediaDirect()` - Direct extraction (auto JWT)

### Conversion
- `api.convert()` - Start conversion task (auto JWT)
- `api.checkTask()` - Check conversion status

### Playlist
- `api.extractPlaylist()` - Extract playlist videos

### Decrypt
- `api.decodeUrl()` - Decode single URL (auto JWT)
- `api.decodeList()` - Decode multiple URLs (auto JWT)

### Other
- `api.sendFeedback()` - Send user feedback
- `api.addVideoToQueue()` - Add to processing queue
- `api.downloadYouTube()` - Download video (with abort)
- `api.getDownloadProgress()` - Check download progress

**All methods return `VerifiedResult<T>` with standardized error handling.**

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run build:watch

# Type check
npx tsc --noEmit
```

---

## 📦 Build Output

```
dist/
├── index.js
├── index.d.ts
└── ... (compiled files)
```

---

## 🚀 Key Features

✅ **Auto JWT Management** - JWT automatically injected, extracted, and stored
✅ **CAPTCHA Support** - Manual CAPTCHA payload handling
✅ **Standardized Responses** - All methods return `VerifiedResult<T>`
✅ **Type Safe** - Full TypeScript support with type inference
✅ **Verification Policies** - Response validation with custom policies
✅ **Collision Prevention** - Namespaced localStorage keys
✅ **Multiple Stores** - LocalStorage, InMemory, or Custom JWT stores

---

## 📖 Documentation Index

| File | Purpose |
|------|---------|
| `DOMAIN_LAYER_GUIDE.md` | Complete API reference for site projects |
| `VERIFIED_SERVICES_QUICKSTART.md` | Quick start examples |
| `LOCALSTORAGE_KEY_COLLISION.md` | JWT storage best practices |
| `REFACTOR_COMPARISON.md` | Project status & migration phases |
| `AI_CLI_ONBOARDING.md` | For AI CLI developers |
| `AI_CLI_PROMPT.md` | Prompts for AI CLI |

---

## 🤝 Contributing

**For AI CLI developers:**
1. Read `AI_CLI_ONBOARDING.md`
2. Follow the step-by-step guide
3. Create plan before coding
4. Get confirmation before implementing

**For human developers:**
1. Read `DOMAIN_LAYER_GUIDE.md`
2. Follow existing patterns
3. Run `npm run build` before committing
4. Update documentation when adding features

---

## 📝 License

[Your License Here]

---

## 🆘 Support

**Questions about:**
- **Using the API?** → Read `DOMAIN_LAYER_GUIDE.md`
- **Contributing?** → Read `AI_CLI_ONBOARDING.md`
- **Project status?** → Read `REFACTOR_COMPARISON.md`

**Issues:**
- File issues at [Your Repo URL]

---

**Last Updated:** 2025-11-16
**Current Phase:** Phase 2E - Multifile Service Integration
