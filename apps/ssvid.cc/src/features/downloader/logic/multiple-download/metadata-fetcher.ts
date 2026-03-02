import { api } from '../../../../api';
import { apiLogger } from '../../../../libs/api-logger/api-logger';
import { VideoMeta } from '../../state/types';
import { extractVideoId } from '@downloader/core';

const MAX_CONCURRENT = 5;

interface MetadataResult {
    id: string;
    success: boolean;
    meta?: VideoMeta;
    error?: string;
}

export async function fetchMetadataBatch(
    items: Array<{ id: string; url: string }>,
    onItemComplete: (result: MetadataResult) => void
): Promise<void> {
    let activeCount = 0;
    let index = 0;

    return new Promise<void>((resolve) => {
        let completedCount = 0;

        function processNext() {
            while (activeCount < MAX_CONCURRENT && index < items.length) {
                const item = items[index++];
                activeCount++;

                fetchSingleMetadata(item.url)
                    .then((meta) => {
                        onItemComplete({ id: item.id, success: true, meta });
                    })
                    .catch((error) => {
                        onItemComplete({
                            id: item.id,
                            success: false,
                            meta: createFallbackMeta(item.url),
                            error: error instanceof Error ? error.message : 'Failed to fetch info',
                        });
                    })
                    .finally(() => {
                        activeCount--;
                        completedCount++;
                        if (completedCount >= items.length) {
                            resolve();
                        } else {
                            processNext();
                        }
                    });
            }
        }

        if (items.length === 0) {
            resolve();
            return;
        }

        processNext();
    });
}

export async function fetchSingleMetadata(url: string): Promise<VideoMeta> {
    const result = await api.getMetadataYoutube(url);

    apiLogger.log({
        type: result.ok ? 'success' : 'error',
        endpoint: 'getMetadataYoutube',
        requestData: { url },
        responseData: result.ok ? { message: 'success' } : result,
        errorData: result.ok ? undefined : result.message
    });

    if (!result.ok || !result.data) {
        throw new Error(result.message || 'Metadata fetch failed');
    }

    const data = result.data as any;

    const title = data.title || data.meta?.title || 'Unknown Video';
    const author = data.authorName || data.author_name || data.meta?.author || 'Unknown Channel';
    const thumbnail = data.thumbnailUrl || data.thumbnail_url || data.meta?.thumbnail || '';
    const duration = data.duration || data.meta?.duration || 0;
    const vid = data.vid || data.meta?.vid || extractVideoId(url) || '';

    return {
        title,
        originalUrl: url,
        status: 'ready',
        author,
        thumbnail,
        duration,
        url,
        vid,
        source: 'youtube',
        isFakeData: false,
    };
}

function createFallbackMeta(url: string): VideoMeta {
    const vid = extractVideoId(url) || '';
    return {
        title: vid ? `Video ${vid}` : 'Unknown Video',
        originalUrl: url,
        status: 'error',
        author: '',
        thumbnail: vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '',
        duration: 0,
        url,
        vid,
        source: 'youtube',
        isFakeData: true,
    };
}
