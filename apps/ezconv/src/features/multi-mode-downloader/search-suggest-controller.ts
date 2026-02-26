import { extractVideoId } from '@downloader/core';
import { createSearchResultCard, createSkeletonCard, type VideoData } from '@downloader/ui-components';
import { api } from '../../api';
import { normalizeURL, parseYouTubeURLs } from '../downloader/logic/multiple-download/url-parser';

interface SearchItem {
    videoId: string;
    title: string;
    thumbnailUrl: string;
    duration?: string;
    views?: string;
    uploaderName?: string;
}

const SUGGEST_DEBOUNCE_MS = 280;
const SEARCH_PAGE_LIMIT = 20;

export function initSearchSuggestController(): void {
    const urlsInput = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    const suggestionContainer = document.getElementById('keyword-suggestion-container') as HTMLElement | null;
    const resultsSection = document.getElementById('keyword-search-results-section') as HTMLElement | null;
    const resultsContainer = document.getElementById('keyword-search-results-container') as HTMLElement | null;

    if (!urlsInput || !suggestionContainer || !resultsSection || !resultsContainer) {
        return;
    }

    let debounceTimer: number | null = null;
    let latestSuggestRequestId = 0;
    let suggestionItems: string[] = [];
    let highlightedSuggestionIndex = -1;
    let currentKeyword = '';
    let currentResults: SearchItem[] = [];
    let nextPageToken: string | null = null;
    let hasNextPage = false;
    let isLoadingMore = false;

    const hideSuggestions = (): void => {
        suggestionItems = [];
        highlightedSuggestionIndex = -1;
        suggestionContainer.innerHTML = '';
        suggestionContainer.classList.remove('suggestion-container--visible');
    };

    const resetSearchState = (): void => {
        currentKeyword = '';
        currentResults = [];
        nextPageToken = null;
        hasNextPage = false;
        isLoadingMore = false;
    };

    const clearSearchResults = (): void => {
        resetSearchState();
        resultsContainer.innerHTML = '';
        resultsSection.style.display = 'none';
    };

    const renderSuggestions = (items: string[]): void => {
        if (items.length === 0) {
            hideSuggestions();
            return;
        }

        suggestionContainer.innerHTML = `
            <div class="keyword-suggest-list" role="listbox" aria-label="Search suggestions">
                ${items.map((item, index) => `
                    <button
                        type="button"
                        class="keyword-suggest-item${index === highlightedSuggestionIndex ? ' is-highlighted' : ''}"
                        data-suggestion-index="${index}"
                    >
                        ${escapeHtml(item)}
                    </button>
                `).join('')}
            </div>
        `;
        suggestionContainer.classList.add('suggestion-container--visible');
    };

    const fetchSuggestions = async (query: string): Promise<void> => {
        const requestId = ++latestSuggestRequestId;

        try {
            const result = await api.getSuggestions({ q: query });
            if (requestId !== latestSuggestRequestId) return;

            if (!result.ok || !result.data) {
                hideSuggestions();
                return;
            }

            const raw = result.data;
            const values = Array.isArray(raw) ? raw : (typeof raw === 'object' ? Object.values(raw) : []);
            const normalized = values
                .map((value) => String(value || '').trim())
                .filter(Boolean)
                .slice(0, 8);

            suggestionItems = normalized;
            highlightedSuggestionIndex = -1;
            renderSuggestions(normalized);
        } catch {
            if (requestId === latestSuggestRequestId) {
                hideSuggestions();
            }
        }
    };

    const scheduleSuggestions = (query: string): void => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = window.setTimeout(() => {
            fetchSuggestions(query);
        }, SUGGEST_DEBOUNCE_MS);
    };

    const getKeywordFromTextarea = (): string => {
        const lines = urlsInput.value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length !== 1) {
            return '';
        }

        const keyword = lines[0];
        if (!keyword || looksLikeUrl(keyword) || parseYouTubeURLs(keyword).length > 0) {
            return '';
        }

        return keyword;
    };

    const getSelectedVideoIdsFromTextarea = (): Set<string> => {
        const parsed = parseYouTubeURLs(urlsInput.value);
        return new Set(parsed.map((item) => item.videoId).filter((id): id is string => Boolean(id)));
    };

    const syncCheckboxesFromTextarea = (): void => {
        const selectedIds = getSelectedVideoIdsFromTextarea();
        const checkboxes = resultsContainer.querySelectorAll<HTMLInputElement>('.keyword-result-checkbox');
        checkboxes.forEach((checkbox) => {
            const videoId = checkbox.dataset.videoId || '';
            checkbox.checked = selectedIds.has(videoId);
        });
    };

    const setTextareaLines = (lines: string[]): void => {
        const normalizedLines = normalizeTextareaLines(lines);
        urlsInput.value = normalizedLines.length > 0 ? `${normalizedLines.join('\n')}\n` : '';
        urlsInput.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const toggleVideoInTextarea = (videoId: string, videoUrl: string, checked: boolean): void => {
        const rawLines = urlsInput.value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (checked) {
            const exists = rawLines.some((line) => extractVideoId(line) === videoId);
            if (!exists) {
                rawLines.push(videoUrl);
            }
            setTextareaLines(rawLines);
            return;
        }

        const filtered = rawLines.filter((line) => extractVideoId(line) !== videoId);
        setTextareaLines(filtered);
    };

    const renderSearchResults = (items: SearchItem[], loadingSkeletonCount: number = 0): void => {
        if (items.length === 0) {
            resultsContainer.innerHTML = `
                <div class="keyword-results-message">
                    No videos found for this keyword.
                </div>
            `;
            resultsSection.style.display = 'block';
            return;
        }

        const selectedIds = getSelectedVideoIdsFromTextarea();
        const html = items.map((item) => {
            const videoUrl = normalizeURL(item.videoId);
            const checked = selectedIds.has(item.videoId);
            const card = createSearchResultCard({
                id: item.videoId,
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                displayDuration: item.duration || '',
                displayViews: item.views || '',
                displayDate: '',
                metadata: {
                    uploaderName: item.uploaderName || '',
                },
            } as VideoData);
            const cardWithCheckbox = injectCheckboxIntoCard(card, item.videoId, videoUrl, checked);

            return `
                <article class="keyword-result-card-wrap" data-video-id="${item.videoId}" data-video-url="${videoUrl}">
                    ${cardWithCheckbox}
                </article>
            `;
        }).join('');
        const loadingSkeletonHtml = loadingSkeletonCount > 0
            ? Array.from({ length: loadingSkeletonCount }, () => createSkeletonCard()).join('')
            : '';

        const loadMoreHtml = hasNextPage ? `
            <div class="keyword-search-load-more-wrap">
                <button type="button" class="keyword-search-load-more-btn" data-action="load-more-search" ${isLoadingMore ? 'disabled' : ''}>
                    ${isLoadingMore ? 'Loading...' : 'Load more'}
                </button>
            </div>
        ` : '';

        resultsContainer.innerHTML = `
            <div class="search-results">
                <div class="search-results-grid">
                    ${html}
                    ${loadingSkeletonHtml}
                </div>
                ${loadMoreHtml}
            </div>
        `;
        resultsSection.style.display = 'block';
    };

    const renderLoadingResults = (): void => {
        resultsContainer.innerHTML = `
            <div class="search-results">
                <div class="search-results-grid">
                    ${Array.from({ length: 8 }, () => createSkeletonCard()).join('')}
                </div>
            </div>
        `;
        resultsSection.style.display = 'block';
    };

    const runSearch = async (keyword: string): Promise<void> => {
        resetSearchState();
        currentKeyword = keyword;
        renderLoadingResults();
        hideSuggestions();

        try {
            const result = await api.searchV2(keyword, { limit: SEARCH_PAGE_LIMIT });
            if (!result.ok || !result.data) {
                resultsContainer.innerHTML = `<div class="keyword-results-message">No videos found for this keyword.</div>`;
                return;
            }

            const data = result.data as any;
            const rawItems = Array.isArray(data.videos) ? data.videos : (Array.isArray(data.items) ? data.items : []);
            const mapped = rawItems
                .map(mapSearchItem)
                .filter((item): item is SearchItem => Boolean(item));

            const pagination = readPagination(data);
            currentResults = mapped;
            nextPageToken = pagination.nextPageToken;
            hasNextPage = pagination.hasNextPage;

            renderSearchResults(currentResults);
        } catch {
            resultsContainer.innerHTML = `<div class="keyword-results-message">Search failed. Please try again.</div>`;
        }
    };

    const loadMoreSearchResults = async (): Promise<void> => {
        if (!currentKeyword || !hasNextPage || !nextPageToken || isLoadingMore) {
            return;
        }

        isLoadingMore = true;
        renderSearchResults(currentResults, 6);

        try {
            const result = await api.searchV2(currentKeyword, {
                limit: SEARCH_PAGE_LIMIT,
                pageToken: nextPageToken,
                nextPageToken,
            } as any);

            if (!result.ok || !result.data) {
                isLoadingMore = false;
                renderSearchResults(currentResults);
                return;
            }

            const data = result.data as any;
            const rawItems = Array.isArray(data.videos) ? data.videos : (Array.isArray(data.items) ? data.items : []);
            const mapped = rawItems
                .map(mapSearchItem)
                .filter((item): item is SearchItem => Boolean(item));

            const existingIds = new Set(currentResults.map((item) => item.videoId));
            const appended = mapped.filter((item) => !existingIds.has(item.videoId));
            currentResults = [...currentResults, ...appended];

            const pagination = readPagination(data);
            nextPageToken = pagination.nextPageToken;
            hasNextPage = pagination.hasNextPage;
        } catch {
            // Keep current results and allow retry on next click.
        } finally {
            isLoadingMore = false;
            renderSearchResults(currentResults);
        }
    };

    urlsInput.addEventListener('input', () => {
        syncCheckboxesFromTextarea();
        const query = getKeywordFromTextarea();
        highlightedSuggestionIndex = -1;

        if (!query) {
            hideSuggestions();
            return;
        }

        scheduleSuggestions(query);
    });

    urlsInput.addEventListener('keydown', (event) => {
        const query = getKeywordFromTextarea();

        if (event.key === 'ArrowDown' && suggestionItems.length > 0) {
            event.preventDefault();
            event.stopImmediatePropagation();
            highlightedSuggestionIndex = highlightedSuggestionIndex >= suggestionItems.length - 1
                ? 0
                : highlightedSuggestionIndex + 1;
            renderSuggestions(suggestionItems);
            return;
        }

        if (event.key === 'ArrowUp' && suggestionItems.length > 0) {
            event.preventDefault();
            event.stopImmediatePropagation();
            highlightedSuggestionIndex = highlightedSuggestionIndex <= 0
                ? suggestionItems.length - 1
                : highlightedSuggestionIndex - 1;
            renderSuggestions(suggestionItems);
            return;
        }

        if (event.key === 'Enter' && highlightedSuggestionIndex >= 0 && suggestionItems.length > 0) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const selectedSuggestion = suggestionItems[highlightedSuggestionIndex];
            if (selectedSuggestion) {
                urlsInput.value = selectedSuggestion;
                urlsInput.dispatchEvent(new Event('input', { bubbles: true }));
                runSearch(selectedSuggestion);
            }
            return;
        }

        if (event.key === 'Escape') {
            event.stopImmediatePropagation();
            hideSuggestions();
            return;
        }

        if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && query) {
            event.preventDefault();
            event.stopImmediatePropagation();
            runSearch(query);
        }
    });

    suggestionContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const item = target.closest('.keyword-suggest-item') as HTMLElement | null;
        if (!item) return;

        const index = Number(item.dataset.suggestionIndex);
        const suggestion = suggestionItems[index];
        if (!suggestion) return;

        urlsInput.value = suggestion;
        urlsInput.dispatchEvent(new Event('input', { bubbles: true }));
        runSearch(suggestion);
    });

    resultsContainer.addEventListener('change', (event) => {
        const target = event.target as HTMLElement;
        const checkbox = target.closest('.keyword-result-checkbox') as HTMLInputElement | null;
        if (!checkbox) return;

        const videoId = checkbox.dataset.videoId || '';
        const videoUrl = checkbox.dataset.videoUrl || '';
        if (!videoId || !videoUrl) return;

        toggleVideoInTextarea(videoId, videoUrl, checkbox.checked);
    });

    resultsContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const actionBtn = target.closest('[data-action]') as HTMLElement | null;
        if (actionBtn?.dataset.action === 'load-more-search') {
            loadMoreSearchResults();
            return;
        }

        if (target.closest('.keyword-result-checkbox')) {
            return;
        }

        const cardWrap = target.closest('.keyword-result-card-wrap') as HTMLElement | null;
        if (!cardWrap) return;
        const checkbox = cardWrap.querySelector<HTMLInputElement>('.keyword-result-checkbox');
        if (!checkbox) return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    document.addEventListener('multi-download:convert-click', () => {
        hideSuggestions();
        clearSearchResults();
    });

    document.addEventListener('click', (event) => {
        const target = event.target as Node;
        if (suggestionContainer.contains(target) || urlsInput.contains(target as Node)) {
            return;
        }
        hideSuggestions();
    });
}

function readPagination(data: any): { nextPageToken: string | null; hasNextPage: boolean } {
    const pagination = data?.pagination && typeof data.pagination === 'object' ? data.pagination : {};
    const token = String(
        pagination.nextPageToken
        || data?.nextPageToken
        || pagination.pageToken
        || data?.pageToken
        || ''
    ).trim();

    const hasNext = Boolean(
        pagination.hasNextPage
        || data?.hasNextPage
        || token
    );

    return {
        nextPageToken: token || null,
        hasNextPage: hasNext && !!token,
    };
}

function mapSearchItem(raw: any): SearchItem | null {
    const idCandidates = [
        raw?.id,
        raw?.videoId,
        raw?.url,
        raw?.watchUrl,
    ];

    let videoId: string | null = null;
    for (const candidate of idCandidates) {
        if (typeof candidate !== 'string') continue;
        const directId = /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
        videoId = directId || extractVideoId(candidate);
        if (videoId) break;
    }

    if (!videoId) {
        return null;
    }

    return {
        videoId,
        title: String(raw?.title || 'Untitled video'),
        thumbnailUrl: String(raw?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
        duration: formatDuration(raw?.duration),
        views: formatViews(raw?.viewCount),
        uploaderName: String(raw?.uploaderName || raw?.channelTitle || ''),
    };
}

function formatDuration(duration: unknown): string {
    if (typeof duration === 'string' && duration.includes(':')) {
        return duration;
    }

    const seconds = Number(duration);
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '';
    }

    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remain = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
    }
    return `${minutes}:${String(remain).padStart(2, '0')}`;
}

function formatViews(count: unknown): string {
    const value = Number(count);
    if (!Number.isFinite(value) || value < 0) {
        return '';
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M views`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K views`;
    }
    return `${Math.floor(value)} views`;
}

function normalizeTextareaLines(lines: string[]): string[] {
    const normalized: string[] = [];
    const seenVideoIds = new Set<string>();
    const seenRaw = new Set<string>();

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const videoId = extractVideoId(line);
        if (videoId) {
            if (seenVideoIds.has(videoId)) {
                continue;
            }
            seenVideoIds.add(videoId);
            normalized.push(normalizeURL(videoId));
            continue;
        }

        if (seenRaw.has(line)) {
            continue;
        }
        seenRaw.add(line);
        normalized.push(line);
    }

    return normalized;
}

function looksLikeUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function injectCheckboxIntoCard(cardHtml: string, videoId: string, videoUrl: string, checked: boolean): string {
    const checkboxHtml = `
        <label class="keyword-result-overlay-check" aria-label="Select video">
            <input
                type="checkbox"
                class="keyword-result-checkbox"
                data-video-id="${videoId}"
                data-video-url="${videoUrl}"
                ${checked ? 'checked' : ''}
            />
        </label>
    `;

    return cardHtml.replace('<div class="card-thumbnail">', `<div class="card-thumbnail">${checkboxHtml}`);
}
