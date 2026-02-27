/**
 * Advanced Settings Controller
 * Manages the Advanced Settings panel, Playlist Mode toggle, and Trim/Cut toggle
 * for the unified download page.
 */

import { ensureTrimEditorDefaults, loadVideoForTrim, resetTrimEditor } from './trim-controller';

let _playlistModeOn = false;
let _trimModeOn = false;
let _channelModeOn = false;

export function isPlaylistMode(): boolean { return _playlistModeOn; }
export function isTrimMode(): boolean { return _trimModeOn; }
export function isChannelMode(): boolean { return _channelModeOn; }

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
    // Playlist ON → force Trim OFF + Channel OFF
    if (on && _trimModeOn) {
        _trimModeOn = false;
        updateSwitchUI('trim-mode-toggle', false);
        hideCuttingInterface();
    }
    if (on && _channelModeOn) {
        _channelModeOn = false;
        updateSwitchUI('channel-mode-toggle', false);
    }
    updateSwitchUI('playlist-mode-toggle', on);
}

function applyTrimMode(on: boolean): void {
    _trimModeOn = on;
    // Trim ON → force Playlist OFF + Channel OFF
    if (on && _playlistModeOn) {
        _playlistModeOn = false;
        updateSwitchUI('playlist-mode-toggle', false);
    }
    if (on && _channelModeOn) {
        _channelModeOn = false;
        updateSwitchUI('channel-mode-toggle', false);
    }
    updateSwitchUI('trim-mode-toggle', on);
    if (on) {
        showCuttingInterface();
        void ensureTrimEditorDefaults();
        // Load player for the current URL if present
        const textarea = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
        const url = textarea?.value.trim().split(/[\n\s,]+/).filter(Boolean)[0] || '';
        if (url) void loadVideoForTrim(url);
    } else {
        hideCuttingInterface();
        resetTrimEditor();
    }
}

function applyChannelMode(on: boolean): void {
    _channelModeOn = on;
    // Channel ON → force Playlist OFF + Trim OFF
    if (on && _playlistModeOn) {
        _playlistModeOn = false;
        updateSwitchUI('playlist-mode-toggle', false);
    }
    if (on && _trimModeOn) {
        _trimModeOn = false;
        updateSwitchUI('trim-mode-toggle', false);
        hideCuttingInterface();
    }
    updateSwitchUI('channel-mode-toggle', on);
}

// ==========================================
// Init
// ==========================================

export function initAdvancedSettings(): void {
    // --- Advanced Settings panel toggle ---
    const toggleBtn = document.getElementById('advanced-settings-toggle');
    const panel = document.getElementById('advanced-settings-panel');

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
        });
    }

    // --- Playlist Mode switch ---
    const playlistSwitch = document.getElementById('playlist-mode-toggle');
    if (playlistSwitch) {
        playlistSwitch.addEventListener('click', () => {
            applyPlaylistMode(!_playlistModeOn);
        });
    }

    // --- Channel Mode switch ---
    const channelSwitch = document.getElementById('channel-mode-toggle');
    if (channelSwitch) {
        channelSwitch.addEventListener('click', () => {
            if (_channelModeOn) {
                applyChannelMode(false);
                return;
            }
            const count = countUrls();
            if (count > 1) {
                showInlineError('Channel Mode requires only 1 URL. Remove extra URLs first.');
                return;
            }
            applyChannelMode(true);
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
            if (count > 1) {
                showInlineError('Trim/Cut requires exactly 1 URL. Remove extra URLs first.');
                return;
            }
            applyTrimMode(true);
        });
    }

    // --- Textarea: show error if >1 URL while trim/channel ON ---
    const textarea = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    if (textarea) {
        textarea.addEventListener('input', () => {
            const count = countUrls();
            if (_trimModeOn) {
                if (count > 1) {
                    showInlineError('Trim/Cut mode only supports 1 URL. Remove extra URLs.');
                } else {
                    // URL changed (or cleared) — reset and reload
                    resetTrimEditor();
                    const url = textarea.value.trim().split(/[\n\s,]+/).filter(Boolean)[0] || '';
                    if (url) loadVideoForTrim(url);
                }
            }
            if (_channelModeOn && count > 1) {
                showInlineError('Channel Mode only supports 1 URL. Remove extra URLs.');
            }
        });
    }
}
