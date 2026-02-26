/**
 * Advanced Settings Controller
 * Manages the Advanced Settings panel, Playlist Mode toggle, and Trim/Cut toggle
 * for the unified download page.
 */

import { loadVideoForTrim, resetTrimEditor } from './trim-controller';

let _playlistModeOn = false;
let _trimModeOn = false;

export function isPlaylistMode(): boolean { return _playlistModeOn; }
export function isTrimMode(): boolean { return _trimModeOn; }
export function resetTrimModeToDefault(): void {
    if (_trimModeOn) {
        applyTrimMode(false);
    } else {
        // Keep editor state consistent even if mode flag/UI got out of sync.
        resetTrimEditor();
        hideCuttingInterface();
    }
}

// ==========================================
// Internal helpers
// ==========================================

function updateSwitchUI(switchId: string, on: boolean): void {
    const sw = document.getElementById(switchId);
    if (!sw) return;
    sw.setAttribute('aria-checked', String(on));
}

function countUrls(): number {
    const textarea = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    if (!textarea || !textarea.value.trim()) return 0;
    return textarea.value.trim().split(/[\n\s,]+/).filter(s => s.length > 0).length;
}

function showInlineError(msg: string): void {
    const el = document.getElementById('error-message');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { if (el.textContent === msg) el.style.display = 'none'; }, 3500);
}

export function showCuttingInterface(): void {
    const el = document.getElementById('cutting-interface');
    if (el) el.removeAttribute('hidden');
}

export function hideCuttingInterface(): void {
    const el = document.getElementById('cutting-interface');
    if (el) el.setAttribute('hidden', '');
}

// ==========================================
// State setters
// ==========================================

function applyPlaylistMode(on: boolean): void {
    _playlistModeOn = on;
    // Playlist ON → force Trim OFF
    if (on && _trimModeOn) {
        _trimModeOn = false;
        updateSwitchUI('trim-mode-toggle', false);
        hideCuttingInterface();
    }
    updateSwitchUI('playlist-mode-toggle', on);
}

function applyTrimMode(on: boolean): void {
    _trimModeOn = on;
    // Trim ON → force Playlist OFF
    if (on && _playlistModeOn) {
        _playlistModeOn = false;
        updateSwitchUI('playlist-mode-toggle', false);
    }
    updateSwitchUI('trim-mode-toggle', on);
    if (on) {
        showCuttingInterface();
        // Load player for the current URL if present
        const textarea = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
        const url = textarea?.value.trim().split(/[\n\s,]+/).filter(Boolean)[0] || '';
        if (url) loadVideoForTrim(url);
    } else {
        hideCuttingInterface();
        resetTrimEditor();
    }
}

// ==========================================
// Init
// ==========================================

export function initAdvancedSettings(): void {
    // --- Advanced Settings panel toggle ---
    const toggleBtn = document.getElementById('advanced-settings-toggle');
    const panel = document.getElementById('advanced-settings-panel');
    const convertBtn = document.getElementById('addUrlsBtn');
    const form = document.getElementById('multi-download-form');
    const convertOriginalParent = convertBtn?.parentElement;
    const convertOriginalNextSibling = convertBtn?.nextSibling ?? null;

    const syncConvertButtonPosition = (expanded: boolean): void => {
        if (!panel || !convertBtn || !convertOriginalParent) return;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const shouldMoveBelowPanel = isMobile && expanded;
        form?.classList.toggle('advanced-expanded-mobile', shouldMoveBelowPanel);

        if (shouldMoveBelowPanel) {
            const parent = panel.parentElement;
            if (parent) {
                parent.insertBefore(convertBtn, panel.nextSibling);
                convertBtn.classList.add('convert-below-advanced');
            }
            return;
        }

        if (convertBtn.parentElement !== convertOriginalParent) {
            if (convertOriginalNextSibling && convertOriginalNextSibling.parentNode === convertOriginalParent) {
                convertOriginalParent.insertBefore(convertBtn, convertOriginalNextSibling);
            } else {
                convertOriginalParent.appendChild(convertBtn);
            }
        }
        convertBtn.classList.remove('convert-below-advanced');
    };

    if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', () => {
            const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            const nextExpanded = !expanded;
            toggleBtn.setAttribute('aria-expanded', String(nextExpanded));
            if (expanded) {
                panel.setAttribute('hidden', '');
            } else {
                panel.removeAttribute('hidden');
            }
            syncConvertButtonPosition(nextExpanded);
        });
    }

    syncConvertButtonPosition(false);
    window.addEventListener('resize', () => {
        const expanded = toggleBtn?.getAttribute('aria-expanded') === 'true';
        syncConvertButtonPosition(expanded);
    });

    // --- Playlist Mode switch ---
    const playlistSwitch = document.getElementById('playlist-mode-toggle');
    if (playlistSwitch) {
        playlistSwitch.addEventListener('click', () => {
            applyPlaylistMode(!_playlistModeOn);
        });
    }

    // --- Trim/Cut switch ---
    const trimSwitch = document.getElementById('trim-mode-toggle');
    if (trimSwitch) {
        trimSwitch.addEventListener('click', () => {
            if (_trimModeOn) {
                applyTrimMode(false);
                return;
            }
            const count = countUrls();
            if (count === 0) {
                showInlineError('Paste a YouTube URL before enabling Trim/Cut.');
                return;
            }
            if (count > 1) {
                showInlineError('Trim/Cut requires exactly 1 URL. Remove extra URLs first.');
                return;
            }
            applyTrimMode(true);
        });
    }

    // --- Textarea: auto-off if >1 URL; reload player if URL changes while trim ON ---
    const textarea = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    if (textarea) {
        textarea.addEventListener('input', () => {
            if (!_trimModeOn) return;
            const count = countUrls();
            if (count > 1) {
                applyTrimMode(false);
                showInlineError('Trim/Cut turned off — multiple URLs detected.');
                return;
            }
            // URL changed (or cleared) — reset and reload
            resetTrimEditor();
            const url = textarea.value.trim().split(/[\n\s,]+/).filter(Boolean)[0] || '';
            if (url) loadVideoForTrim(url);
        });
    }
}
