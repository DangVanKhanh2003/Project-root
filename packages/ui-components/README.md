# @downloader/ui-components

Shared UI components for downloader applications with support for customization via CSS custom properties and Dependency Injection.

## Installation

```bash
pnpm add @downloader/ui-components
```

## Components

### 1. ExpireModal

Modal for showing expired download links.

**Usage:**

```typescript
import { ExpireModal } from '@downloader/ui-components';

const modal = new ExpireModal({
  videoTitle: 'My Video',
  onTryAgain: () => {
    // Retry download
  }
});

modal.show();
```

**CSS:** Import `@downloader/ui-components/ExpireModal/expire-modal.css`

---

### 2. SkeletonCard

Loading skeleton for search result cards.

**Usage:**

```typescript
import { createSkeletonCard, createSkeletonCards } from '@downloader/ui-components';

// Single skeleton
container.innerHTML = createSkeletonCard();

// Multiple skeletons
container.innerHTML = createSkeletonCards(5);
```

**CSS:** Import `@downloader/ui-components/SkeletonCard/skeleton.css`

---

### 3. SearchResultCard

Video card component with thumbnail and metadata.

**Usage:**

```typescript
import { createSearchResultCard } from '@downloader/ui-components';

const html = createSearchResultCard({
  id: 'VIDEO_ID',
  title: 'Video Title',
  thumbnailUrl: 'https://...',
  displayDuration: '3:45',
  metadata: {
    uploaderName: 'Channel Name'
  },
  displayViews: '1.2M views',
  displayDate: '2 days ago'
});

container.innerHTML = html;
```

**CSS:** Import `@downloader/ui-components/SearchResultCard/search-result-card.css`

---

### 4. SuggestionDropdown

Dropdown for search suggestions with keyboard navigation.

**Usage:**

```typescript
import { SuggestionDropdown } from '@downloader/ui-components';

const dropdown = new SuggestionDropdown({
  containerId: 'suggestion-container',
  inputId: 'search-input'
});

dropdown.init();

// Render with state
dropdown.render({
  showSuggestions: true,
  suggestions: ['video 1', 'video 2'],
  highlightedIndex: 0,
  originalQuery: 'video'
});
```

**CSS:** Import `@downloader/ui-components/SuggestionDropdown/suggestion-dropdown.css`

---

### 5. FormatSelector (with Dependency Injection)

Format selector (MP3/MP4) with quality dropdown. Uses DI pattern for state independence.

**Usage:**

```typescript
import { FormatSelector, FormatStateManager } from '@downloader/ui-components';

// 1. Implement state manager interface
class MyStateManager implements FormatStateManager {
  getSelectedFormat() { return this.state.selectedFormat; }
  setSelectedFormat(format) { this.state.selectedFormat = format; }
  // ... implement all methods
}

// 2. Create selector with injected state manager
const selector = new FormatSelector({
  containerId: 'format-selector-container',
  stateManager: new MyStateManager(),
  onFormatChange: (format) => console.log('Format changed:', format)
});

// 3. Render
selector.render();
```

**CSS:** Import `@downloader/ui-components/FormatSelector/format-selector.css`

---

## CSS Customization

All components support customization via CSS custom properties. Override in your app:

```css
:root {
  /* ExpireModal */
  --expire-modal-primary-color: #your-color;
  --expire-modal-bg: #your-bg;

  /* Skeleton */
  --skeleton-color-dark: #your-dark-color;
  --skeleton-duration: 2s;
}
```

See `src/styles/variables.css` for all available properties.

---

## TypeScript Support

All components are written in TypeScript with full type definitions.

```typescript
import type { VideoData, CardOptions } from '@downloader/ui-components';
```

---

## License

MIT
