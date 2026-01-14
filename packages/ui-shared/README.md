# @downloader/ui-shared

Shared UI utilities and components for downloader applications.

**Browser-only package** - Provides DOM-dependent UI utilities for building downloader sites.

## 📦 Installation

```bash
# In your site project (e.g., apps/yt1s-test)
npm install @downloader/ui-shared
# or
pnpm add @downloader/ui-shared
```

## 🎯 What's Inside

This package contains **UI utilities** that are:
- **Browser-only** (requires DOM)
- **Reusable** across multiple downloader sites
- **Independent** of business logic (core logic is in `@downloader/core`)

### Modules

1. **Scroll Management** (`@downloader/ui-shared/scroll`)
   - Centralized scroll system
   - Responsive scroll behaviors
   - Navbar offset calculations
   - Infinite scroll support

2. **CAPTCHA UI** (`@downloader/ui-shared/captcha`)
   - Cloudflare Turnstile integration
   - Google reCAPTCHA v2 integration
   - Modal UI for user interaction
   - Automatic fallback (Turnstile → reCAPTCHA)

3. **Download Utilities** (`@downloader/ui-shared/download`)
   - Sequential file downloads (DOM-based)
   - Single file download helpers
   - Progress tracking
   - Cancel support

## 📖 Usage Guide

### Scroll Management

```typescript
import { ScrollManager, initImmediateScroll } from '@downloader/ui-shared/scroll';

// Initialize scroll manager
const scrollManager = new ScrollManager({
  debug: true, // Enable logging in development
  navbar: {
    selector: '.navbar',
    offsetPadding: 20
  }
});
scrollManager.init();

// Scroll to element with navbar offset
await scrollManager.scrollToElement('#results', {
  behavior: 'smooth',
  offset: 'auto' // Automatically calculates navbar height
});

// Form submission scroll behavior
await initImmediateScroll('url'); // 'url' | 'keyword' | 'playlist'

// Scroll to top
await scrollManager.scrollToTop();

// Infinite scroll detection
scrollManager.registerInfiniteScrollCallback((distanceFromBottom) => {
  console.log(`${distanceFromBottom}px from bottom - load more content`);
});
```

**Key Features:**
- ✅ Mobile-first responsive design
- ✅ Automatic navbar height calculation
- ✅ Reduced motion support (respects `prefers-reduced-motion`)
- ✅ Throttled/debounced scroll events
- ✅ Viewport breakpoint detection

### CAPTCHA UI

```typescript
import { CaptchaModal, configureCaptcha } from '@downloader/ui-shared/captcha';

// Configure CAPTCHA site keys
configureCaptcha({
  turnstileSiteKey: 'your-turnstile-site-key',
  recaptchaSiteKey: 'your-recaptcha-site-key'
});

// Show CAPTCHA modal and get token
const modal = new CaptchaModal();
try {
  const result = await modal.getCaptchaToken();
  console.log('CAPTCHA verified:', result.type, result.token);

  // Use token with @downloader/core protected API
  const response = await api.extractMedia(
    { url: videoUrl },
    { captcha: result } // Pass CAPTCHA token
  );
} catch (error) {
  console.error('CAPTCHA failed:', error);
}
```

**CAPTCHA Flow:**
1. **Attempt Turnstile** (invisible, no user interaction)
2. **Fallback to reCAPTCHA** (shows modal if Turnstile fails)
3. **Return token** for API authentication

**Integration with @downloader/core:**

```typescript
import { api } from './api'; // Your @downloader/core setup
import { CaptchaModal } from '@downloader/ui-shared/captcha';

async function downloadVideo(url: string) {
  const captchaModal = new CaptchaModal();

  try {
    // Get CAPTCHA token
    const captchaResult = await captchaModal.getCaptchaToken();

    // Call protected API with token
    const result = await api.extractMedia(
      { url },
      { captcha: captchaResult }
    );

    if (result.ok) {
      console.log('Video extracted:', result.data);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

### Download Utilities

```typescript
import { startSequentialDownload, downloadFile } from '@downloader/ui-shared/download';

// Sequential downloads (multiple files)
const files = [
  { url: 'https://example.com/file1.mp4', name: 'video1.mp4' },
  { url: 'https://example.com/file2.mp4', name: 'video2.mp4' },
  { url: 'https://example.com/file3.mp4', name: 'video3.mp4' },
];

await startSequentialDownload(files, {
  onProgress: (progress) => {
    console.log(`${progress.completed}/${progress.total} - ${progress.currentFile}`);
  },
  onComplete: () => {
    console.log('All downloads triggered!');
  },
  onError: (error) => {
    console.error('Download error:', error);
  },
  shouldCancel: () => userCancelled, // Optional cancel function
  delayBetweenFiles: 2500, // 2.5 seconds delay (default)
});

// Single file download
downloadFile('https://example.com/video.mp4', 'my-video.mp4');
```

**How it works:**
- Creates invisible `<a>` elements with download attribute
- Programmatically clicks them to trigger browser download
- Adds delays between downloads to avoid browser blocking
- Simple, reliable fallback for batch downloads

**Use cases:**
- Multi-file downloads (playlists, galleries)
- Fallback when server-side ZIP is unavailable
- Simple download triggers

## 🎨 Styling

### CAPTCHA Modal CSS

Import the CAPTCHA modal styles in your application:

```typescript
// In your main entry point
import '@downloader/ui-shared/styles/captcha-modal.css';
```

Or in HTML:
```html
<link rel="stylesheet" href="node_modules/@downloader/ui-shared/dist/styles/captcha-modal.css">
```

**CSS Classes:**
- `.captcha-modal` - Modal container
- `.captcha-modal.visible` - Visible state
- `.captcha-modal-overlay` - Dark overlay
- `.captcha-modal-content` - Modal content box
- `.captcha-modal-header` - Header with title
- `.captcha-modal-body` - Body with reCAPTCHA widget
- `.recaptcha-container` - reCAPTCHA widget container

### Scroll Management CSS

The scroll manager uses CSS custom properties:

```css
/* Automatically set by ScrollManager */
:root {
  --navbar-height: 80px; /* Dynamic value */
}

/* Use in your CSS */
.content-area {
  scroll-padding-top: var(--navbar-height);
}
```

## 🔧 API Reference

### ScrollManager

```typescript
class ScrollManager {
  constructor(config?: ScrollConfig);

  // Initialization
  init(): void;
  destroy(): void;

  // Scroll operations
  scrollToElement(target: string | Element, options?: ScrollOptions): Promise<void>;
  scrollToTop(options?: ScrollOptions): Promise<void>;

  // Navbar height
  getNavbarHeight(): number;
  forceUpdateNavbarHeight(): void;

  // Viewport detection
  isMobile(): boolean;
  isDesktop(): boolean;

  // Infinite scroll
  registerInfiniteScrollCallback(callback: (distance: number) => void): void;
  unregisterInfiniteScrollCallback(): void;
}
```

**ScrollOptions:**
```typescript
interface ScrollOptions {
  behavior?: 'smooth' | 'auto';
  offset?: number | 'auto';
  customOffset?: number | null;
  onStart?: () => void;
  onComplete?: () => void;
  useNativeScrollPadding?: boolean;
}
```

### CaptchaModal

```typescript
class CaptchaModal {
  constructor(options?: CaptchaModalOptions);

  // Get CAPTCHA token (shows modal if needed)
  getCaptchaToken(): Promise<CaptchaResult>;

  // Manual control
  hide(): void;
  destroy(): void;
}

interface CaptchaResult {
  token: string;
  type: 'turnstile' | 'recaptcha';
}
```

**CAPTCHA Provider Functions:**
```typescript
// Configure site keys
configureCaptcha(config: Partial<CaptchaConfig>): void;

// Get tokens directly
getTurnstileToken(callbacks?: CaptchaCallbacks): Promise<string>;
getRecaptchaToken(containerId: string, callbacks?: CaptchaCallbacks): Promise<string>;
getCaptchaToken(callbacks?: CaptchaCallbacks): Promise<CaptchaResult>;
```

## 🏗️ Architecture

### Separation of Concerns

```
@downloader/ui-shared          (UI utilities - Browser-only)
├── scroll/                    (Scroll management)
│   ├── scroll-manager.ts      (Core scroll system)
│   └── scroll-behavior.ts     (Form submission behaviors)
└── captcha/                   (CAPTCHA UI)
    ├── captcha-provider.ts    (Token acquisition logic)
    └── captcha-modal.ts       (Modal UI component)

@downloader/core               (Business logic - DOM-independent)
├── domain/                    (API layer with JWT auto-injection)
├── services/                  (Backend communication)
└── http/                      (HTTP client)
```

**Design Principles:**
- ✅ **ui-shared** handles **DOM interactions** (scrolling, modals, UI)
- ✅ **core** handles **business logic** (API calls, JWT, data processing)
- ✅ **Clean separation** - No business logic in ui-shared
- ✅ **Reusable** - Same UI utilities across all sites

### Why Not in @downloader/core?

`@downloader/core` is DOM-independent to maximize reusability:
- ✅ Can be used in Node.js environments
- ✅ Can be used in browser extensions
- ✅ Can be used in server-side rendering
- ✅ Pure TypeScript, no browser dependencies

`@downloader/ui-shared` is explicitly browser-only:
- ❌ Requires `window`, `document`, DOM APIs
- ❌ Cannot run in Node.js
- ✅ Provides UI components and utilities

## 🔗 Integration Example

Complete integration in a site project:

```typescript
// src/api/index.ts - Setup @downloader/core
import { createVerifiedServices, createHttpClient, ... } from '@downloader/core';
export const api = createVerifiedServices(coreServices, verifier);

// src/script/main.ts - Setup UI utilities
import { ScrollManager } from '@downloader/ui-shared/scroll';
import { configureCaptcha } from '@downloader/ui-shared/captcha';
import '@downloader/ui-shared/styles/captcha-modal.css';

const scrollManager = new ScrollManager({ debug: true });
scrollManager.init();

configureCaptcha({
  turnstileSiteKey: 'your-key',
  recaptchaSiteKey: 'your-key'
});

// src/features/downloader/input-form.ts - Use both packages
import { api } from '../../api';
import { CaptchaModal } from '@downloader/ui-shared/captcha';
import { initImmediateScroll } from '@downloader/ui-shared/scroll';

async function handleSubmit(url: string) {
  // Scroll to results area
  await initImmediateScroll('url');

  // Get CAPTCHA if needed
  const captchaModal = new CaptchaModal();
  const captchaResult = await captchaModal.getCaptchaToken();

  // Call API with CAPTCHA
  const result = await api.extractMedia({ url }, { captcha: captchaResult });

  if (result.ok) {
    renderResults(result.data);
  }
}
```

## 📝 Migration Notes

### From Old captcha-core

**REMOVED:**
- ❌ `jwt.js` - JWT handling is now in `@downloader/core/domain/jwt`
- ❌ `withCaptchaProtection` HOF - Replaced by `@downloader/core` verified-services

**KEPT:**
- ✅ CAPTCHA token acquisition (Turnstile + reCAPTCHA)
- ✅ Modal UI component
- ✅ Automatic fallback logic

**Migration:**
```typescript
// OLD (captcha-core)
import { withCaptchaProtection } from './captcha-core/captcha-ui';
const protectedFn = withCaptchaProtection(apiFunction);

// NEW (@downloader/core + @downloader/ui-shared)
import { api } from './api'; // Uses @downloader/core verified-services
import { CaptchaModal } from '@downloader/ui-shared/captcha';

const captchaModal = new CaptchaModal();
const result = await captchaModal.getCaptchaToken();
await api.extractMedia({ url }, { captcha: result });
```

### From Old scroll-core

**CHANGES:**
- ✅ Converted to TypeScript
- ✅ Same API, better types
- ✅ No breaking changes

**Migration:**
```typescript
// OLD (scroll-core)
import scrollManager from './scroll-core/scroll-manager.js';

// NEW (@downloader/ui-shared)
import { scrollManager } from '@downloader/ui-shared/scroll';

// Same usage - no changes needed
scrollManager.init();
await scrollManager.scrollToElement('#results');
```

## 🚀 Development

```bash
# Build package
cd packages/ui-shared
npm run build

# Clean build artifacts
npm run clean
```

## 📚 See Also

- **@downloader/core** - Business logic and API layer
- **DOMAIN_LAYER_GUIDE.md** - Guide for using @downloader/core
- **AI_CLI_ONBOARDING.md** - Developer onboarding guide

## 🤝 Contributing

When adding new UI utilities:
1. ✅ Ensure they are **browser-only** (require DOM)
2. ✅ Ensure they are **reusable** across sites
3. ✅ Keep **business logic** in @downloader/core
4. ✅ Export types for TypeScript support
5. ✅ Update this README with usage examples

## 📄 License

Same as parent project.
