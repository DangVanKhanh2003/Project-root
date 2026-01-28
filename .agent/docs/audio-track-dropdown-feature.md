# Audio Track Dropdown Feature - Implementation Guide

## Tổng quan

Tài liệu này hướng dẫn cách triển khai tính năng **Audio Track Dropdown** - một dropdown có thể tìm kiếm (searchable) với cờ quốc gia SVG để cho phép người dùng chọn ngôn ngữ/audio track khi convert video YouTube.

### Tính năng chính:
- 🔍 **Searchable dropdown** - Có thể tìm kiếm theo tên ngôn ngữ hoặc mã ngôn ngữ
- 🚩 **SVG country flags** - Hiển thị cờ quốc gia cho mỗi ngôn ngữ
- 📱 **Mobile animation** - Trạng thái "icon-only" khi thu gọn, mở rộng khi click
- 💻 **Desktop min-width** - Hiển thị đầy đủ text + icon trên desktop
- ♿ **Accessibility** - Hỗ trợ keyboard navigation và ARIA attributes

---

## Cấu trúc files cần tạo/sửa

```
src/
├── features/
│   └── downloader/
│       ├── data/
│       │   └── languages.ts          # [TẠO MỚI] Data ngôn ngữ + cờ
│       └── ui-render/
│           └── dropdown-logic.ts     # [TẠO MỚI] Logic xử lý dropdown
├── styles/
│   └── components/
│       └── quality-select.css        # [SỬA] Thêm CSS cho audio dropdown
├── ui-components/
│   └── format-selector/
│       └── format-selector.css       # [SỬA] Responsive layout cho 800px breakpoint
├── main.ts                           # [SỬA] Import và init dropdown
├── _templates/                       # [SỬA] Thêm HTML structure vào template
└── public/assest/flat-svg/           # [COPY] SVG flag files
```

---

## Bước 1: Tạo file Languages Data

**File:** `src/features/downloader/data/languages.ts`

```typescript
export interface Language {
  code: string;
  name: string;
  flag: string; // SVG path hoặc inline SVG cho 'original'
}

export const LANGUAGES: Language[] = [
  // Option "Original" sử dụng inline SVG (icon Languages)
  { 
    code: 'original', 
    name: 'Original', 
    flag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages text-gray-400" aria-hidden="true"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>' 
  },
  // Các ngôn ngữ khác sử dụng path đến file SVG
  { code: 'af', name: 'Afrikaans', flag: '/assest/flat-svg/za.svg' },
  { code: 'sq', name: 'Albanian', flag: '/assest/flat-svg/al.svg' },
  { code: 'am', name: 'Amharic', flag: '/assest/flat-svg/et.svg' },
  { code: 'ar', name: 'Arabic', flag: '/assest/flat-svg/sa.svg' },
  { code: 'hy', name: 'Armenian', flag: '/assest/flat-svg/am.svg' },
  { code: 'az', name: 'Azerbaijani', flag: '/assest/flat-svg/az.svg' },
  { code: 'bn', name: 'Bengali', flag: '/assest/flat-svg/bd.svg' },
  { code: 'bs', name: 'Bosnian', flag: '/assest/flat-svg/ba.svg' },
  { code: 'bg', name: 'Bulgarian', flag: '/assest/flat-svg/bg.svg' },
  { code: 'my', name: 'Burmese', flag: '/assest/flat-svg/mm.svg' },
  { code: 'ca', name: 'Catalan', flag: '/assest/flat-svg/es.svg' },
  { code: 'zh-cn', name: 'Chinese', flag: '/assest/flat-svg/cn.svg' },
  { code: 'zh-tw', name: 'Taiwanese', flag: '/assest/flat-svg/tw.svg' },
  { code: 'hr', name: 'Croatian', flag: '/assest/flat-svg/hr.svg' },
  { code: 'cs', name: 'Czech', flag: '/assest/flat-svg/cz.svg' },
  { code: 'da', name: 'Danish', flag: '/assest/flat-svg/dk.svg' },
  { code: 'nl', name: 'Dutch', flag: '/assest/flat-svg/nl.svg' },
  { code: 'en', name: 'English', flag: '/assest/flat-svg/us.svg' },
  { code: 'et', name: 'Estonian', flag: '/assest/flat-svg/ee.svg' },
  { code: 'fil', name: 'Filipino', flag: '/assest/flat-svg/ph.svg' },
  { code: 'fi', name: 'Finnish', flag: '/assest/flat-svg/fi.svg' },
  { code: 'fr', name: 'French', flag: '/assest/flat-svg/fr.svg' },
  { code: 'ka', name: 'Georgian', flag: '/assest/flat-svg/ge.svg' },
  { code: 'de', name: 'German', flag: '/assest/flat-svg/de.svg' },
  { code: 'el', name: 'Greek', flag: '/assest/flat-svg/gr.svg' },
  { code: 'gu', name: 'Gujarati', flag: '/assest/flat-svg/in.svg' },
  { code: 'he', name: 'Hebrew', flag: '/assest/flat-svg/il.svg' },
  { code: 'hi', name: 'Hindi', flag: '/assest/flat-svg/in.svg' },
  { code: 'hu', name: 'Hungarian', flag: '/assest/flat-svg/hu.svg' },
  { code: 'is', name: 'Icelandic', flag: '/assest/flat-svg/is.svg' },
  { code: 'id', name: 'Indonesian', flag: '/assest/flat-svg/id.svg' },
  { code: 'it', name: 'Italian', flag: '/assest/flat-svg/it.svg' },
  { code: 'ja', name: 'Japanese', flag: '/assest/flat-svg/jp.svg' },
  { code: 'kn', name: 'Kannada', flag: '/assest/flat-svg/in.svg' },
  { code: 'kk', name: 'Kazakh', flag: '/assest/flat-svg/kz.svg' },
  { code: 'km', name: 'Khmer', flag: '/assest/flat-svg/kh.svg' },
  { code: 'ko', name: 'Korean', flag: '/assest/flat-svg/kr.svg' },
  { code: 'lo', name: 'Lao', flag: '/assest/flat-svg/la.svg' },
  { code: 'lv', name: 'Latvian', flag: '/assest/flat-svg/lv.svg' },
  { code: 'lt', name: 'Lithuanian', flag: '/assest/flat-svg/lt.svg' },
  { code: 'mk', name: 'Macedonian', flag: '/assest/flat-svg/mk.svg' },
  { code: 'ms', name: 'Malay', flag: '/assest/flat-svg/my.svg' },
  { code: 'ml', name: 'Malayalam', flag: '/assest/flat-svg/in.svg' },
  { code: 'mr', name: 'Marathi', flag: '/assest/flat-svg/in.svg' },
  { code: 'mn', name: 'Mongolian', flag: '/assest/flat-svg/mn.svg' },
  { code: 'ne', name: 'Nepali', flag: '/assest/flat-svg/np.svg' },
  { code: 'no', name: 'Norwegian', flag: '/assest/flat-svg/no.svg' },
  { code: 'fa', name: 'Persian', flag: '/assest/flat-svg/ir.svg' },
  { code: 'pl', name: 'Polish', flag: '/assest/flat-svg/pl.svg' },
  { code: 'pt', name: 'Portuguese', flag: '/assest/flat-svg/pt.svg' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', flag: '/assest/flat-svg/br.svg' },
  { code: 'pa', name: 'Punjabi', flag: '/assest/flat-svg/in.svg' },
  { code: 'ro', name: 'Romanian', flag: '/assest/flat-svg/ro.svg' },
  { code: 'ru', name: 'Russian', flag: '/assest/flat-svg/ru.svg' },
  { code: 'sr', name: 'Serbian', flag: '/assest/flat-svg/rs.svg' },
  { code: 'si', name: 'Sinhala', flag: '/assest/flat-svg/lk.svg' },
  { code: 'sk', name: 'Slovak', flag: '/assest/flat-svg/sk.svg' },
  { code: 'sl', name: 'Slovenian', flag: '/assest/flat-svg/si.svg' },
  { code: 'es', name: 'Spanish', flag: '/assest/flat-svg/es.svg' },
  { code: 'sw', name: 'Swahili', flag: '/assest/flat-svg/ke.svg' },
  { code: 'sv', name: 'Swedish', flag: '/assest/flat-svg/se.svg' },
  { code: 'ta', name: 'Tamil', flag: '/assest/flat-svg/in.svg' },
  { code: 'te', name: 'Telugu', flag: '/assest/flat-svg/in.svg' },
  { code: 'th', name: 'Thai', flag: '/assest/flat-svg/th.svg' },
  { code: 'tr', name: 'Turkish', flag: '/assest/flat-svg/tr.svg' },
  { code: 'uk', name: 'Ukrainian', flag: '/assest/flat-svg/ua.svg' },
  { code: 'ur', name: 'Urdu', flag: '/assest/flat-svg/pk.svg' },
  { code: 'uz', name: 'Uzbek', flag: '/assest/flat-svg/uz.svg' },
  { code: 'vi', name: 'Vietnamese', flag: '/assest/flat-svg/vn.svg' },
];
```

### Lưu ý quan trọng:
- **Option "original"**: Sử dụng **inline SVG string** thay vì đường dẫn file. Đây là icon "Languages" từ Lucide.
- **Các ngôn ngữ khác**: Sử dụng **path đến file SVG** (VD: `/assest/flat-svg/us.svg`)
- **Có thể tuỳ chỉnh** danh sách ngôn ngữ theo nhu cầu của từng project

---

## Bước 2: Tạo file Dropdown Logic

**File:** `src/features/downloader/ui-render/dropdown-logic.ts`

```typescript
import { LANGUAGES, type Language } from '../data/languages';

/**
 * Initialize custom audio dropdown logic
 */
export function initAudioDropdown(): void {
    const dropdown = document.getElementById('audio-track-dropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement;
    const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement;
    const optionsContainer = dropdown.querySelector('.dropdown-options') as HTMLElement;
    const searchInput = dropdown.querySelector('.dropdown-search input') as HTMLInputElement;
    const hiddenInput = document.getElementById('audio-track-value') as HTMLInputElement;
    const selectedText = dropdown.querySelector('.selected-text') as HTMLElement;
    const selectedFlag = dropdown.querySelector('.selected-flag') as HTMLElement;

    if (!trigger || !menu || !optionsContainer || !searchInput || !hiddenInput) return;

    // Render initial options
    renderOptions(LANGUAGES);

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing immediately
        toggleDropdown();
    });

    // Handle outside click to close
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target as Node)) {
            closeDropdown();
        }
    });

    // Handle search input
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = LANGUAGES.filter(lang =>
            lang.name.toLowerCase().includes(query) ||
            lang.code.toLowerCase().includes(query)
        );
        renderOptions(filtered);
    });

    // Delegate click for options
    optionsContainer.addEventListener('click', (e) => {
        const option = (e.target as HTMLElement).closest('.dropdown-option') as HTMLElement;
        if (!option) return;

        const code = option.dataset.code;
        const name = option.dataset.name;
        const flag = option.dataset.flag;

        if (code && name && flag) {
            selectOption(code, name, flag);
            closeDropdown();
        }
    });

    // Keyboard navigation for accessibility
    dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    // FUNCTIONS

    function toggleDropdown() {
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            openDropdown();
        } else {
            closeDropdown();
        }
    }

    function openDropdown() {
        menu.classList.remove('hidden');
        dropdown.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        searchInput.focus();
    }

    function closeDropdown() {
        menu.classList.add('hidden');
        dropdown.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        // Clear search input and restore full list
        if (searchInput.value) {
            searchInput.value = '';
            renderOptions(LANGUAGES);
        }
    }

    function selectOption(code: string, name: string, _flag: string) {
        hiddenInput.value = code;
        selectedText.textContent = name;
        // Flag hidden in trigger as per new design
        // selectedFlag.textContent = flag; 

        // Highlight selected option
        const options = optionsContainer.querySelectorAll('.dropdown-option');
        options.forEach(opt => {
            if ((opt as HTMLElement).dataset.code === code) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });

        // Trigger change event if needed for other listeners
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function renderOptions(items: Language[]) {
        if (items.length === 0) {
            optionsContainer.innerHTML = '<div class="dropdown-option" style="cursor: default; color: var(--text-muted);">No results found</div>';
            return;
        }

        const currentVal = hiddenInput.value;

        optionsContainer.innerHTML = items.map(lang => {
            const isOriginal = lang.code === 'original';
            // "original" dùng inline SVG, các option khác dùng <img>
            const flagHtml = isOriginal
                ? lang.flag
                : `<img src="${lang.flag}" alt="${lang.name}" decoding="async" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;

            return `
            <div class="dropdown-option ${lang.code === currentVal ? 'selected' : ''}" 
                 data-code="${lang.code}" 
                 data-name="${lang.name}"
                 data-flag="${isOriginal ? 'original' : lang.flag}"
                 role="option"
                 aria-selected="${lang.code === currentVal}">
                <div class="flag-wrapper" style="width: 24px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 2px; background: rgba(255,255,255,0.05);">
                    ${flagHtml}
                </div>
                <span class="name">${lang.name}</span>
            </div>`;
        }).join('');
    }
}
```

---

## Bước 3: Thêm HTML Structure vào Template

Tìm đến vị trí `.quality-wrapper` trong template (thường là file `.njk` hoặc `.html`), thêm `audio-dropdown-wrapper` **sau** `quality-dropdown-wrapper`:

```html
<div class="quality-wrapper">
    <!-- Quality Dropdown (existing) -->
    <div class="quality-dropdown-wrapper">
        <select id="quality-select-mp3" class="quality-select quality-select--mp3" 
                aria-label="Audio quality" data-quality-select>
            <option value="mp3-128" selected>MP3 - 128kbps</option>
            <option value="mp3-192">MP3 - 192kbps</option>
            <option value="mp3-320">MP3 - 320kbps</option>
            <!-- ... other options ... -->
        </select>
        <select id="quality-select-mp4" class="quality-select quality-select--mp4" 
                aria-label="Video quality" data-quality-select>
            <!-- ... mp4 options ... -->
        </select>
        <div class="select-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6" />
            </svg>
        </div>
    </div>

    <!-- NEW: Audio Track Dropdown -->
    <div class="audio-dropdown-wrapper">
        <div class="custom-dropdown" id="audio-track-dropdown">
            <div class="dropdown-trigger" tabindex="0" role="button" 
                 aria-haspopup="listbox" aria-expanded="false">
                <!-- Language Icon (Absolute positioned) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dropdown-trigger-icon">
                    <path d="m5 8 6 6"></path>
                    <path d="m4 14 6-6 2-3"></path>
                    <path d="M2 5h12"></path>
                    <path d="M7 2h1"></path>
                    <path d="m22 22-5-10-5 10"></path>
                    <path d="M14 18h6"></path>
                </svg>
                
                <div class="selected-content">
                    <span class="selected-text">Original</span>
                </div>
                <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>

            <div class="dropdown-menu hidden">
                <div class="dropdown-search">
                    <input type="text" placeholder="Search language..." aria-label="Search language">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <div class="dropdown-options" role="listbox">
                    <!-- Options populated via JS -->
                </div>
            </div>
            <input type="hidden" id="audio-track-value" value="original" name="audioTrack">
        </div>
    </div>
</div>
```

### Lưu ý khi sửa template:
- Mỗi project có thể có **nhiều templates khác nhau** (VD: `index.njk`, `youtube-to-mp3.njk`, v.v.)
- **TẤT CẢ templates** có `.quality-wrapper` đều cần được cập nhật
- Dùng lệnh tìm kiếm để xác định tất cả các file cần sửa:
  ```bash
  grep -r "quality-wrapper" --include="*.njk" --include="*.html" _templates/
  ```

---

## Bước 4: Thêm CSS Styles

**File:** `src/styles/components/quality-select.css`

Thêm CSS sau vào file (có thể thêm vào cuối file):

```css
/* ===== CUSTOM SEARCHABLE DROPDOWN ===== */
.custom-dropdown {
    position: relative;
    width: 100%;
    color: var(--text-main);
    user-select: none;
}

.dropdown-trigger {
    height: 56px;
    background: var(--bg-card);
    border: var(--border-glass);
    border-radius: var(--radius-md);
    padding: 0 16px 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: border-color 0.2s;
    position: relative;
}

[data-theme="light"] .dropdown-trigger {
    background: #fff;
    border: 1px solid #cbd5e1;
}

.dropdown-trigger:hover,
.dropdown-trigger:focus,
.custom-dropdown.active .dropdown-trigger {
    border-color: rgba(139, 92, 246, 0.8);
    outline: none;
}

.dropdown-trigger-icon {
    position: absolute;
    left: 12px;
    top: 55%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
}

.selected-content {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    width: 100%;
}

.selected-flag {
    font-size: 1.25rem;
    line-height: 1;
}

.selected-text {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dropdown-arrow {
    flex-shrink: 0;
    color: var(--text-muted);
    transition: transform 0.2s;
}

.custom-dropdown.active .dropdown-arrow {
    transform: rotate(180deg);
}

.dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    background: var(--bg-card);
    border: var(--border-glass);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    z-index: 50;
    overflow: hidden;
    animation: fadeIn 0.2s ease-out;
    will-change: transform, opacity;
    backface-visibility: hidden;
}

[data-theme="light"] .dropdown-menu {
    background: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.custom-dropdown .hidden {
    display: none !important;
}

.custom-dropdown.active .dropdown-menu {
    display: block;
}

.dropdown-search {
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
}

[data-theme="light"] .dropdown-search {
    border-bottom: 1px solid #e2e8f0;
}

.dropdown-search input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 8px 12px 8px 36px;
    color: var(--text-main);
    font-size: 0.9rem;
    outline: none;
}

[data-theme="light"] .dropdown-search input {
    background: #f1f5f9;
    color: #334155;
}

.dropdown-search input:focus {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(139, 92, 246, 0.5);
}

[data-theme="light"] .dropdown-search input:focus {
    background: #fff;
    border-color: rgba(139, 92, 246, 0.5);
}

.dropdown-search .search-icon {
    position: absolute;
    left: 20px;
    top: 55%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
}

.dropdown-options {
    max-height: 240px;
    overflow-y: auto;
    overscroll-behavior: contain;
    contain: layout style;
    -webkit-overflow-scrolling: touch;
}

.dropdown-option {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.15s;
}

.dropdown-option:hover,
.dropdown-option.focused {
    background: rgba(255, 255, 255, 0.05);
}

[data-theme="light"] .dropdown-option:hover,
[data-theme="light"] .dropdown-option.focused {
    background: #f8fafc;
}

.dropdown-option.selected {
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
}

[data-theme="light"] .dropdown-option.selected {
    background: #eff6ff;
    color: #6366f1;
}

.flag-wrapper {
    flex-shrink: 0;
}

.dropdown-option .flag {
    font-size: 1.25rem;
}

/* Scrollbar Styles */
.dropdown-options::-webkit-scrollbar {
    width: 6px;
}

.dropdown-options::-webkit-scrollbar-track {
    background: transparent;
}

.dropdown-options::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}

[data-theme="light"] .dropdown-options::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ===== MOBILE TRIGGER EXPANSION ANIMATION ===== */
@media (max-width: 640px) {
    .quality-wrapper {
        flex-grow: 1;
    }

    /* Default State: Quality takes available space, Audio is icon-only */
    .quality-dropdown-wrapper:nth-child(1) {
        flex: 1;
        transition: flex-basis 0.75s ease, flex-grow 0.75s ease, min-width 0.75s ease, opacity 0.5s;
        min-width: 0;
    }

    .audio-dropdown-wrapper {
        flex: 0 0 56px;
        transition: flex-basis 0.75s ease, flex-grow 0.75s ease, width 0.75s ease;
        z-index: 20;
    }

    /* Active State: Audio expands to ~200px */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) {
        flex: 0 0 200px;
        width: 200px;
    }

    /* Hide text/arrow when collapsed */
    .audio-dropdown-wrapper .selected-content,
    .audio-dropdown-wrapper .dropdown-arrow {
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition: opacity 0.5s, width 0.5s;
    }

    /* Show text/arrow when expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .selected-content,
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-arrow {
        opacity: 1;
        width: auto;
        transition: opacity 0.5s 0.25s, width 0.5s;
    }

    /* Trigger Styles - Collapsed: center icon */
    .audio-dropdown-wrapper .dropdown-trigger {
        padding: 0;
        justify-content: center;
        transition: padding 0.75s, justify-content 0.75s;
    }

    /* Center icon when collapsed */
    .audio-dropdown-wrapper .dropdown-trigger-icon {
        left: 50%;
        transform: translate(-50%, -50%);
        transition: left 0.75s, transform 0.75s;
    }

    /* Trigger Styles - Expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-trigger {
        padding: 0 16px 0 40px;
        justify-content: space-between;
    }

    /* Move icon to left when expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-trigger-icon {
        left: 12px;
        transform: translateY(-50%);
    }
}

/* Desktop Styles */
@media (min-width: 641px) {
    .quality-wrapper {
        flex-grow: 0;
    }

    .quality-dropdown-wrapper {
        flex: 1;
    }

    .audio-dropdown-wrapper {
        flex: 0 0 auto;
        min-width: 160px;
    }

    .dropdown-trigger {
        padding: 0 16px 0 40px;
    }

    .dropdown-trigger-icon {
        left: 12px;
        transform: translateY(-50%);
    }
}

/* Tiny Mobile Adjustments (Height 40px) */
@media (max-width: 480px) {
    .quality-select,
    .dropdown-trigger {
        height: 40px;
        font-size: 13px;
    }

    /* Adjust collapsed width to match new height */
    .audio-dropdown-wrapper {
        flex: 0 0 40px;
    }

    .audio-dropdown-wrapper .dropdown-trigger {
        padding: 0;
    }

    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-trigger {
        padding: 0 30px 0 40px;
    }

    .dropdown-trigger-icon {
        width: 14px;
    }

    .quality-select {
        padding: 0 30px 0 20px;
    }

    .quality-wrapper {
        gap: 8px;
    }
}

/* RTL Support */
[dir="rtl"] .dropdown-trigger {
    padding: 0 40px 0 16px;
}

[dir="rtl"] .dropdown-trigger-icon {
    left: auto;
    right: 12px;
}

[dir="rtl"] .dropdown-search .search-icon {
    left: auto;
    right: 20px;
}

[dir="rtl"] .dropdown-search input {
    padding: 8px 36px 8px 12px;
}
```

---

## Bước 5: Thêm CSS cho Responsive Layout (800px breakpoint)

**File:** `src/ui-components/format-selector/format-selector.css` 

Kiểm tra và đảm bảo có media query cho breakpoint 800px:

```css
/* Tablet/Mobile: < 800px */
@media (max-width: 800px) {
    .format-selector-wrapper {
        flex-direction: column-reverse;
        gap: 16px;
    }

    .format-selector {
        flex-direction: column;
        gap: 16px;
    }

    /* Row 1: Quality + Audio */
    .quality-wrapper {
        width: 100%;
        order: 1;
    }

    /* Row 2: Format Toggle + Convert Button */
    .format-toggle {
        order: 2;
        max-width: 150px;
    }

    .btn-convert {
        order: 3;
        flex: 1;
    }
}
```

---

## Bước 6: Initialize trong main.ts

**File:** `src/main.ts`

Thêm import và gọi `initAudioDropdown()`:

```typescript
// ... other imports and functions ...

/**
 * Initialize app
 */
function loadFeatures() {
    // ... other initializations ...
    
    // Initialize custom audio dropdown
    import('./features/downloader/ui-render/dropdown-logic').then(({ initAudioDropdown }) => {
        initAudioDropdown();
    });
}

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
    loadFeatures();
}
```

---

## Bước 7: Copy SVG Flag Assets

1. Download bộ flag SVG từ repository: [hampusborgos/country-flags](https://github.com/hampusborgos/country-flags)
2. Copy các file SVG vào thư mục: `public/assest/flat-svg/`
3. Đảm bảo đặt tên file match với config trong `languages.ts`:
   - `us.svg` cho English
   - `vn.svg` cho Vietnamese
   - `jp.svg` cho Japanese
   - v.v.

---

## Responsive Behavior Summary

| Breakpoint | Quality Wrapper | Audio Dropdown | Behavior |
|------------|-----------------|----------------|----------|
| **Desktop (800px+)** | Row với format + quality + audio + convert | Hiển thị icon + text (min-width: 160px) | Normal layout |
| **Tablet/Mobile (<800px)** | Row 1: Quality + Audio | Row 2: Format + Convert | Stacked layout |
| **Mobile (<640px)** | Quality fills space | **Icon-only, expands to 200px on click** | Animated expansion |
| **Tiny Mobile (<480px)** | Height 40px | Height 40px, collapsed 40px | Compact mode |

---

## Key Implementation Notes

### 1. Arrow Positioning
`.select-arrow` phải nằm **trong** `.quality-dropdown-wrapper` (không phải `.quality-wrapper`) để relative positioning hoạt động đúng.

### 2. SVG Flag Handling
- **Option 'original'**: Sử dụng **inline SVG string** (icon Languages)
- **Các option khác**: Sử dụng `<img src="path">` tags
- **KHÔNG** đặt SVG string vào `data-flag` attribute vì sẽ break HTML parsing

### 3. Animation Duration
- Transition chính: `0.75s`
- Opacity transitions: `0.5s` với delay `0.25s` để tạo hiệu ứng staggered

### 4. CSS :has() Selector
Sử dụng `:has()` để style parent elements based on child state:
```css
.audio-dropdown-wrapper:has(.custom-dropdown.active) { ... }
```

### 5. z-index
Audio dropdown wrapper cần `z-index: 20` trên mobile để đảm bảo menu dropdown hiển thị phía trên các elements khác.

### 6. Performance Optimization (Mobile)
Để tránh UI jank khi mở dropdown:
- **CSS**: Sử dụng `will-change: transform, opacity` và `backface-visibility: hidden`
- **Containment**: Sử dụng `contain: layout style` trên scrollable options container
- **Image Decoding**: Sử dụng `decoding="async"` trên flag images

---

## Checklist Implementation

- [ ] Tạo file `languages.ts` với Language interface và LANGUAGES array
- [ ] Tạo file `dropdown-logic.ts` với init và render functions
- [ ] Thêm HTML structure vào TẤT CẢ templates có `.quality-wrapper`
- [ ] Thêm CSS styles vào `quality-select.css`
- [ ] Thêm responsive CSS vào `format-selector.css` (800px breakpoint)
- [ ] Import và gọi `initAudioDropdown()` trong `main.ts`
- [ ] Copy SVG flag assets vào `public/assest/flat-svg/`
- [ ] Test trên desktop, tablet, và mobile
- [ ] Verify animation smooth trên mobile
- [ ] Test search functionality
- [ ] Test keyboard navigation (Escape to close)

---

## Troubleshooting

### 1. Dropdown không hiển thị
- Kiểm tra HTML có đúng ID `audio-track-dropdown`
- Kiểm tra `initAudioDropdown()` đã được gọi
- Kiểm tra CSS đã được import

### 2. Flags không load
- Kiểm tra đường dẫn trong `languages.ts` có đúng
- Kiểm tra files SVG có tồn tại trong `public/assest/flat-svg/`
- Check network tab trong DevTools

### 3. Animation bị giật trên mobile
- Thêm `will-change: transform, opacity` vào `.dropdown-menu`
- Đảm bảo sử dụng `contain: layout style` trên `.dropdown-options`
- Sử dụng `decoding="async"` trên images

### 4. Search không hoạt động
- Kiểm tra event listener trên search input
- Verify `LANGUAGES` array được import đúng

---

## Prompt Template cho AI

Sử dụng prompt sau để yêu cầu AI implement feature này cho project mới:

```
Đọc tài liệu tại `.agent/docs/audio-track-dropdown-feature.md` và triển khai feature Audio Track Dropdown cho project này.

Yêu cầu:
1. Tạo file languages.ts với danh sách ngôn ngữ và cờ quốc gia
2. Tạo file dropdown-logic.ts với logic xử lý dropdown
3. Thêm HTML structure vào TẤT CẢ templates có .quality-wrapper
4. Thêm CSS styles cho dropdown và mobile animation
5. Initialize dropdown trong main.ts
6. Copy SVG flag assets (nếu chưa có)

Lưu ý:
- Xác định tất cả templates cần sửa bằng grep
- Đảm bảo responsive hoạt động đúng trên mobile
- Test animation cho smooth experience
```
