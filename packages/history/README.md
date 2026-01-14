# @downloader/history

Shared history module for tracking and displaying user's conversion history across all downloader sites in the monorepo.

## Features

- localStorage-based history storage (max 100 items)
- Auto-save on form submit with YouTube API metadata fetching
- Google NTP-style history card UI
- Click to re-convert with auto-fill
- Skeleton loading for CLS prevention
- Configurable display count and storage options

## Installation

Add to your app's `package.json`:

```json
{
  "dependencies": {
    "@downloader/history": "workspace:*"
  }
}
```

Add path alias to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@downloader/history": ["../../packages/history/src/index.ts"],
      "@downloader/history/*": ["../../packages/history/*"]
    }
  }
}
```

Add Vite alias to `vite.config.ts`:

```ts
resolve: {
  alias: {
    '@downloader/history': path.resolve(__dirname, '../../packages/history/src/index.ts'),
  }
}
```

## Usage

### 1. Import CSS

In your main CSS file, import the history card styles:

```css
/* Use relative path since Vite alias doesn't work for CSS */
@import '../../../../packages/history/styles/history-card.css';
```

### 2. Add HTML Container

```html
<section class="history-section">
    <div id="history-card-container"></div>
</section>
```

### 3. Initialize History UI

```typescript
import { initHistoryUI, registerApplyHandlers } from '@downloader/history';

// Define handlers for when user clicks a history item
const applyHandlers = {
  setUrl: (url: string) => {
    const input = document.getElementById('videoUrl') as HTMLInputElement;
    if (input) input.value = url;
  },
  setFormat: (format: 'mp3' | 'mp4') => {
    // Update your format selector
  },
  setQuality: (quality: string) => {
    // Update your quality selector
  },
  setAudioFormat: (audioFormat: string) => {
    // Update audio format if applicable
  },
  triggerConvert: () => {
    // Trigger form submit
    document.getElementById('downloadForm')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
  }
};

// Register handlers before init
registerApplyHandlers(applyHandlers);

// Initialize with config
initHistoryUI('#history-card-container', {
  initialCount: 5,        // Show 5 items initially
  loadMoreCount: 10,      // Load 10 more on "See more" click
  maxStorageItems: 100,   // Max items in localStorage
  storageKey: 'downloader_history'
});
```

### 4. Save to History on Form Submit

```typescript
import { saveConversionToHistory, notifyHistoryUpdate } from '@downloader/history';

async function handleFormSubmit(url: string) {
  // Get video metadata (title, author, thumbnail)
  const metadata = await fetchVideoMetadata(url);

  // Save to history
  saveConversionToHistory({
    url,
    title: metadata.title,
    author: metadata.author,
    thumbnail: metadata.thumbnail,
    format: 'mp3',           // or 'mp4'
    quality: '320',          // e.g., '320' for 320kbps, '1080' for 1080p
    audioFormat: 'mp3'       // optional, for audio formats
  });

  // Notify UI to refresh
  notifyHistoryUpdate();
}
```

## CLS Prevention (Skeleton Loading)

To prevent Cumulative Layout Shift, add this inline script right after your container:

```html
<section class="history-section">
    <div id="history-card-container"></div>
    <script>
    (function(){try{var d=localStorage.getItem('downloader_history');if(!d)return;var items=(JSON.parse(d).items||[]);var c=Math.min(items.length,5);if(c===0)return;var s='';for(var i=0;i<c;i++){s+='<li class="history-card__item history-card__item--skeleton"><div class="skeleton-thumbnail"></div><div class="skeleton-content"><div class="skeleton-title"></div><div class="skeleton-meta"></div></div></li>';}var m=items.length>5?'<div class="history-card__footer"><button class="history-card__view-all skeleton-btn">See more</button></div>':'';document.getElementById('history-card-container').innerHTML='<div class="history-card"><div class="history-card__header"><h3 class="history-card__title">Recent Downloads</h3></div><div class="history-card__details"><ul class="history-card__list">'+s+'</ul>'+m+'</div></div>';}catch(e){}})();
    </script>
</section>
```

This script:
- Runs immediately (before JS bundle loads)
- Reads localStorage to get item count
- Renders exact number of skeleton items (1-5)
- Shows "See more" button if items > 5
- Uses shimmer animation for loading effect

## API Reference

### Types

```typescript
interface HistoryItem {
  id: string;
  url: string;
  title: string;
  author?: string;
  thumbnail: string;
  format: 'mp3' | 'mp4';
  quality: string;
  audioFormat?: string;
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'twitter' | 'other';
  createdAt: number;
}

interface HistoryDisplayConfig {
  initialCount: number;      // Default: 5
  loadMoreCount: number;     // Default: 10
  maxStorageItems: number;   // Default: 100
  storageKey: string;        // Default: 'downloader_history'
}

interface ApplyHistoryHandlers {
  setUrl: (url: string) => void;
  setFormat: (format: 'mp3' | 'mp4') => void;
  setQuality: (quality: string) => void;
  setAudioFormat?: (format: string) => void;
  triggerConvert: () => void;
}
```

### Functions

| Function | Description |
|----------|-------------|
| `initHistoryUI(selector, config?)` | Initialize history card UI |
| `registerApplyHandlers(handlers)` | Register handlers for item click |
| `saveConversionToHistory(params)` | Save item to history |
| `notifyHistoryUpdate()` | Trigger UI refresh |
| `refreshHistoryCard()` | Manually refresh the card |
| `destroyHistoryUI()` | Cleanup (remove event listeners) |
| `getHistory(offset, limit)` | Get history items with pagination |
| `getHistoryCount()` | Get total item count |
| `removeFromHistory(id)` | Remove single item |
| `clearHistory()` | Clear all history |

## Styling

The history card uses Google NTP (New Tab Page) style design. You can override CSS variables:

```css
:root {
  --google-blue-600: rgb(26, 115, 232);
  --google-grey-100: rgb(241, 243, 244);
  --google-grey-700: rgb(95, 99, 104);
  --google-grey-900: rgb(32, 33, 36);
}
```

## Example: ytmp3-clone-5

See `apps/ytmp3-clone-5/src/features/history/history-card.ts` for a complete implementation example.
