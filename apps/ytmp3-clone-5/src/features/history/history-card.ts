/**
 * History Card Component
 * ---------------------------------------------------------
 * Displays recent conversion history in a Google-style card
 * Uses localStorage to persist history across sessions
 */

export interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  format: 'mp3' | 'mp4';
  quality: string;
  timestamp: number;
  url: string;
}

// Configuration
const STORAGE_KEY = 'ytmp3_history';
const HIDDEN_KEY = 'ytmp3_history_hidden';
const MAX_ITEMS = 20; // Store up to 20 items
const DISPLAY_ITEMS = 5; // Show 5 items in card

/**
 * Fake data for testing UI
 */
const FAKE_HISTORY: HistoryItem[] = [
  {
    id: '1',
    videoId: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    format: 'mp3',
    quality: '320kbps',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    id: '2',
    videoId: '9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE (Official Video)',
    thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg',
    format: 'mp4',
    quality: '1080p',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    url: 'https://youtube.com/watch?v=9bZkp7q19f0'
  },
  {
    id: '3',
    videoId: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
    format: 'mp3',
    quality: '192kbps',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    url: 'https://youtube.com/watch?v=kJQP7kiw5Fk'
  },
  {
    id: '4',
    videoId: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
    format: 'mp4',
    quality: '720p',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    url: 'https://youtube.com/watch?v=JGwWNGJdvx8'
  },
  {
    id: '5',
    videoId: 'RgKAFK5djSk',
    title: 'Wiz Khalifa - See You Again ft. Charlie Puth (Furious 7 Soundtrack)',
    thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg',
    format: 'mp3',
    quality: '320kbps',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    url: 'https://youtube.com/watch?v=RgKAFK5djSk'
  }
];

/**
 * Initialize fake data in localStorage (for testing)
 */
function initFakeData(): void {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(FAKE_HISTORY));
  }
}

/**
 * Get history items from localStorage
 */
export function getHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as HistoryItem[];
  } catch {
    return [];
  }
}

/**
 * Add item to history
 */
export function addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
  const history = getHistory();

  // Check if item already exists (by videoId + format)
  const existingIndex = history.findIndex(
    h => h.videoId === item.videoId && h.format === item.format
  );

  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID?.() || Date.now().toString(),
    timestamp: Date.now()
  };

  if (existingIndex >= 0) {
    // Update existing item and move to top
    history.splice(existingIndex, 1);
  }

  // Add to beginning
  history.unshift(newItem);

  // Limit items
  if (history.length > MAX_ITEMS) {
    history.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  // Re-render card
  renderHistoryCard();
}

/**
 * Remove item from history
 */
export function removeFromHistory(id: string): void {
  const history = getHistory();
  const filtered = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  renderHistoryCard();
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
  renderHistoryCard();
}

/**
 * Check if history card is hidden
 */
export function isHistoryHidden(): boolean {
  return localStorage.getItem(HIDDEN_KEY) === 'true';
}

/**
 * Hide history card
 */
export function hideHistoryCard(): void {
  localStorage.setItem(HIDDEN_KEY, 'true');
  renderHistoryCard();
}

/**
 * Show history card
 */
export function showHistoryCard(): void {
  localStorage.removeItem(HIDDEN_KEY);
  renderHistoryCard();
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Generate HTML for a single history item
 */
function renderHistoryItem(item: HistoryItem): string {
  const relativeTime = formatRelativeTime(item.timestamp);
  const formatClass = item.format === 'mp3' ? 'history-card__format--mp3' : 'history-card__format--mp4';

  return `
    <li class="history-card__item" data-id="${item.id}" data-url="${item.url}">
      <div class="history-card__thumbnail">
        <img src="${item.thumbnail}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;20&quot; height=&quot;20&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;currentColor&quot;><path d=&quot;M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z&quot;/></svg>'; this.parentElement.classList.add('history-card__thumbnail--fallback');" />
      </div>
      <div class="history-card__content">
        <span class="history-card__video-title">${escapeHtml(item.title)}</span>
        <div class="history-card__meta">
          <span class="history-card__format ${formatClass}">${item.format.toUpperCase()}</span>
          <span class="history-card__meta-separator">•</span>
          <span>${item.quality}</span>
          <span class="history-card__meta-separator">•</span>
          <span>${relativeTime}</span>
        </div>
      </div>
      <button class="history-card__delete-btn" data-delete="${item.id}" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </li>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render the history card
 */
export function renderHistoryCard(): void {
  const container = document.getElementById('history-card-container');
  if (!container) return;

  // Check if card is hidden by user preference
  if (isHistoryHidden()) {
    container.innerHTML = '';
    return;
  }

  const history = getHistory();
  const displayItems = history.slice(0, DISPLAY_ITEMS);

  // Hide card if no history
  if (displayItems.length === 0) {
    container.innerHTML = '';
    return;
  }

  const hasMore = history.length > DISPLAY_ITEMS;

  container.innerHTML = `
    <div class="history-card">
      <div class="history-card__header">
        <h3 class="history-card__title">Recent conversions</h3>
        <div class="history-card__menu-wrapper">
          <button class="history-card__menu-btn" id="history-menu-btn" title="Options">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="12" cy="19" r="2"></circle>
            </svg>
          </button>
          <div class="history-card__dropdown" id="history-dropdown">
            <button class="history-card__dropdown-item" id="hide-history-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <span>Hide this card</span>
            </button>
            <button class="history-card__dropdown-item history-card__dropdown-item--danger" id="clear-history-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Clear all history</span>
            </button>
          </div>
        </div>
      </div>
      <ul class="history-card__list">
        ${displayItems.map(item => renderHistoryItem(item)).join('')}
      </ul>
      ${hasMore ? `
        <div class="history-card__footer">
          <a href="#" class="history-card__view-all" id="view-all-history">View all (${history.length})</a>
        </div>
      ` : ''}
    </div>
  `;

  // Attach event listeners
  attachHistoryEventListeners();
}

/**
 * Attach event listeners to history card
 */
function attachHistoryEventListeners(): void {
  const container = document.getElementById('history-card-container');
  if (!container) return;

  // Click on item -> Fill search input with URL
  container.querySelectorAll('.history-card__item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Ignore if clicking delete button
      if (target.closest('.history-card__delete-btn')) return;

      const url = item.getAttribute('data-url');
      if (url) {
        const input = document.getElementById('videoUrl') as HTMLInputElement;
        if (input) {
          input.value = url;
          input.focus();
          // Trigger input event for any listeners
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });
  });

  // Delete button
  container.querySelectorAll('.history-card__delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-delete');
      if (id) {
        removeFromHistory(id);
      }
    });
  });

  // Menu button - toggle dropdown
  const menuBtn = document.getElementById('history-menu-btn');
  const dropdown = document.getElementById('history-dropdown');

  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.history-card__menu-wrapper')) {
        dropdown.classList.remove('show');
      }
    });
  }

  // Hide history button
  const hideBtn = document.getElementById('hide-history-btn');
  if (hideBtn) {
    hideBtn.addEventListener('click', () => {
      hideHistoryCard();
    });
  }

  // Clear history button
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        clearHistory();
      }
    });
  }

  // View all link
  const viewAllLink = document.getElementById('view-all-history');
  if (viewAllLink) {
    viewAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Could open a modal or expand the list
      alert('Full history view coming soon!');
    });
  }
}

/**
 * Initialize history card
 */
export function initHistoryCard(): void {
  // Init fake data for testing
  initFakeData();

  // Render card
  renderHistoryCard();
}
