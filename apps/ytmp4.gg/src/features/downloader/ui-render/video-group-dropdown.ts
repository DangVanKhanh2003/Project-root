type VideoGroup = 'mp4' | 'webm' | 'mkv';
type VideoValueMode = 'dash' | 'p';

interface VideoGroupDropdownOptions {
    valueMode?: VideoValueMode;
    dropdownClassName?: string;
    wrapperGroupedClass?: string;
}

interface DropdownWithSelect extends HTMLElement {
    __nativeSelect?: HTMLSelectElement;
    __valueMode?: VideoValueMode;
}

const VIDEO_GROUPS: readonly VideoGroup[] = ['mp4', 'webm', 'mkv'];
const VIDEO_RESOLUTIONS: readonly string[] = ['2160', '1440', '1080', '720', '480', '360', '144'];
const DROPDOWN_SELECTOR = '[data-custom-video-group-dropdown]';

let ownerCounter = 0;
let globalListenersBound = false;

function getQualityLabel(resolution: string): string {
    if (resolution === '2160') return '4K';
    if (resolution === '1440') return '2K';
    return `${resolution}P`;
}

function getValueMode(dropdown: DropdownWithSelect): VideoValueMode {
    return dropdown.__valueMode || 'dash';
}

function getGroupFromValue(value: string, mode: VideoValueMode): VideoGroup | null {
    const normalized = (value || '').toLowerCase().trim();

    if (mode === 'dash') {
        const match = normalized.match(/^(mp4|webm|mkv)-\d+$/);
        return match ? (match[1] as VideoGroup) : null;
    }

    const grouped = normalized.match(/^(mp4|webm|mkv)-\d+p$/);
    if (grouped) {
        return grouped[1] as VideoGroup;
    }

    if (/^\d+p$/.test(normalized)) {
        return 'mp4';
    }

    return null;
}

function getResolutionFromValue(value: string, mode: VideoValueMode): string | null {
    const normalized = (value || '').toLowerCase().trim();

    if (mode === 'dash') {
        const match = normalized.match(/^(?:mp4|webm|mkv)-(\d+)$/);
        return match ? match[1] : null;
    }

    const grouped = normalized.match(/^(?:mp4|webm|mkv)-(\d+)p$/);
    if (grouped) {
        return grouped[1];
    }

    const plain = normalized.match(/^(\d+)p$/);
    return plain ? plain[1] : null;
}

function buildValue(group: VideoGroup, resolution: string, mode: VideoValueMode): string {
    if (mode === 'dash') {
        return `${group}-${resolution}`;
    }

    return group === 'mp4' ? `${resolution}p` : `${group}-${resolution}p`;
}

function parseOpenGroups(raw: string | undefined, selectedGroup: VideoGroup): Set<VideoGroup> {
    const groups = new Set<VideoGroup>();

    if (raw !== undefined) {
        raw.split(',').forEach((part) => {
            const normalized = part.trim().toLowerCase();
            if (normalized === 'mp4' || normalized === 'webm' || normalized === 'mkv') {
                groups.add(normalized as VideoGroup);
            }
        });
    } else {
        groups.add(selectedGroup);
    }

    return groups;
}

function setOpenGroups(dropdown: HTMLElement, groups: Set<VideoGroup>): void {
    dropdown.dataset.openGroups = Array.from(groups).join(',');
}

function getSelectedLabel(select: HTMLSelectElement, mode: VideoValueMode): string {
    const selectedValue = select.value || '';
    const group = getGroupFromValue(selectedValue, mode);
    const resolution = getResolutionFromValue(selectedValue, mode);

    if (group && resolution) {
        return `${group.toUpperCase()} - ${getQualityLabel(resolution)}`;
    }

    const selectedOption = select.selectedOptions?.[0];
    return selectedOption?.textContent?.trim() || selectedValue;
}

function renderDropdown(dropdown: DropdownWithSelect): void {
    const select = dropdown.__nativeSelect;
    if (!select) return;

    const mode = getValueMode(dropdown);
    const selectedValue = select.value || buildValue('mp4', '720', mode);
    const selectedGroup = getGroupFromValue(selectedValue, mode) || 'mp4';
    const openGroups = parseOpenGroups(dropdown.dataset.openGroups, selectedGroup);
    const menuOpen = dropdown.dataset.menuOpen === '1';

    const groupsHtml = VIDEO_GROUPS.map((group) => {
        const isOpen = openGroups.has(group);
        const itemsHtml = VIDEO_RESOLUTIONS.map((resolution) => {
            const value = buildValue(group, resolution, mode);
            const selectedClass = value === selectedValue ? ' is-selected' : '';
            const label = `${group.toUpperCase()} - ${getQualityLabel(resolution)}`;
            return `<button type="button" class="video-group-item${selectedClass}" data-custom-group-item="${value}">${label}</button>`;
        }).join('');

        return `
            <div class="video-group-section${isOpen ? ' is-open' : ''}" data-video-group="${group}">
                <button type="button" class="video-group-header" data-custom-group-toggle="${group}">
                    <span class="video-group-header-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></span>
                    <span class="video-group-header-label">${group.toUpperCase()}</span>
                </button>
                <div class="video-group-items"${isOpen ? '' : ' hidden'}>
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');

    dropdown.innerHTML = `
        <button type="button" class="video-group-trigger" data-custom-video-group-trigger aria-expanded="${menuOpen ? 'true' : 'false'}">
            <span class="video-group-trigger-label">${getSelectedLabel(select, mode)}</span>
            <span class="video-group-trigger-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </span>
        </button>
        <div class="video-group-menu"${menuOpen ? '' : ' hidden'}>
            ${groupsHtml}
        </div>
    `;

    const trigger = dropdown.querySelector('[data-custom-video-group-trigger]') as HTMLElement | null;
    if (trigger) {
        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdown.dataset.menuOpen = dropdown.dataset.menuOpen === '1' ? '0' : '1';
            renderDropdown(dropdown);
        });
    }

    dropdown.querySelectorAll<HTMLElement>('[data-custom-group-toggle]').forEach((toggle) => {
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const group = (toggle.dataset.customGroupToggle || '').toLowerCase() as VideoGroup;
            if (group !== 'mp4' && group !== 'webm' && group !== 'mkv') return;

            const currentGroups = parseOpenGroups(dropdown.dataset.openGroups, selectedGroup);
            if (currentGroups.has(group)) {
                currentGroups.delete(group);
            } else {
                currentGroups.add(group);
            }

            setOpenGroups(dropdown, currentGroups);
            dropdown.dataset.menuOpen = '1';
            renderDropdown(dropdown);
        });
    });

    dropdown.querySelectorAll<HTMLElement>('[data-custom-group-item]').forEach((item) => {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            const value = item.dataset.customGroupItem || '';
            if (!value) return;

            select.value = value;
            const newGroup = getGroupFromValue(value, mode);
            const groups = parseOpenGroups(dropdown.dataset.openGroups, newGroup || 'mp4');
            if (newGroup) {
                groups.add(newGroup);
            }
            setOpenGroups(dropdown, groups);

            dropdown.dataset.menuOpen = '0';
            renderDropdown(dropdown);
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
}

function getOwnerId(select: HTMLSelectElement): string {
    const existing = select.dataset.videoGroupOwnerId;
    if (existing) return existing;

    ownerCounter += 1;
    const nextId = `video-group-owner-${ownerCounter}`;
    select.dataset.videoGroupOwnerId = nextId;
    return nextId;
}

function closeDropdown(dropdown: DropdownWithSelect): void {
    if (dropdown.dataset.menuOpen !== '1') return;
    dropdown.dataset.menuOpen = '0';
    renderDropdown(dropdown);
}

function closeAllDropdowns(): void {
    document.querySelectorAll<DropdownWithSelect>(DROPDOWN_SELECTOR).forEach((dropdown) => {
        closeDropdown(dropdown);
    });
}

function bindGlobalListeners(): void {
    if (globalListenersBound) return;

    document.addEventListener('click', (event) => {
        const path = event.composedPath ? event.composedPath() : [];
        const isInside = path.some((node) => {
            const el = node as HTMLElement | null;
            return !!el?.closest?.(DROPDOWN_SELECTOR);
        });

        if (!isInside) {
            closeAllDropdowns();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });

    globalListenersBound = true;
}

export function syncCustomVideoGroupDropdown(select: HTMLSelectElement, options: VideoGroupDropdownOptions = {}): void {
    if (!select) return;

    const parent = select.parentElement as HTMLElement | null;
    if (!parent) return;

    const valueMode = options.valueMode || 'dash';
    const ownerId = getOwnerId(select);
    const dropdownClassName = options.dropdownClassName ? ` ${options.dropdownClassName}` : '';

    if (options.wrapperGroupedClass) {
        parent.classList.add(options.wrapperGroupedClass);
    }

    select.classList.add('quality-select--native-hidden');

    let dropdown = parent.querySelector<DropdownWithSelect>(`${DROPDOWN_SELECTOR}[data-select-owner="${ownerId}"]`);
    if (!dropdown) {
        dropdown = document.createElement('div') as DropdownWithSelect;
        dropdown.className = `video-group-dropdown${dropdownClassName}`;
        dropdown.setAttribute('data-custom-video-group-dropdown', '');
        dropdown.setAttribute('data-select-owner', ownerId);
        select.insertAdjacentElement('afterend', dropdown);
    }

    dropdown.__nativeSelect = select;
    dropdown.__valueMode = valueMode;

    renderDropdown(dropdown);
    bindGlobalListeners();
}
