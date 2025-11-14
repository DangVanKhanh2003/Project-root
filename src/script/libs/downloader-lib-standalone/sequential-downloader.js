/**
 * Sequential Download Strategy
 *
 * This file contains the logic for downloading multiple files one by one
 * by simulating anchor clicks. It is designed as a simple and reliable
 * fallback when more advanced APIs are not available or are failing.
 */

/**
 * A helper function to create a delay.
 * @param {number} ms - Milliseconds to wait.
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Starts the sequential download process for a list of files.
 *
 * @param {Array<Object>} files - An array of file objects, each with a `url` and `name` property.
 * @param {Object} options - Configuration options for the download process.
 * @param {Function} options.onProgress - A callback function invoked after each file download is initiated.
 *        It receives an object with `completed` and `total` properties.
 * @param {Function} options.onComplete - A callback function invoked when all downloads have been initiated.
 * @param {Function} options.onError - A callback function for any errors.
 * @param {Function} options.shouldCancel - A function that returns true if the download should be cancelled.
 */
export async function startSequentialDownload(files, options) {
    const { onProgress, onComplete, onError, shouldCancel } = options;


    for (let i = 0; i < files.length; i++) {
        if (shouldCancel && shouldCancel()) {
            return;
        }

        const file = files[i];

        try {
            // Update progress before starting the download
            if (onProgress) {
                onProgress({
                    completed: i,
                    total: files.length,
                    currentFile: file.name,
                });
            }

            const anchor = document.createElement('a');
            // Using original URL as requested, without proxy
            anchor.href = file.url;
            anchor.download = file.name || `file-${i + 1}`;
            anchor.rel = 'noopener noreferrer';
            anchor.style.display = 'none';

            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);


            // Wait before starting the next download to avoid browser blocking
            // Don't wait after the last file
            if (i < files.length - 1) {
                await delay(2500); // 2.5 second delay
            }

        } catch (error) {
            if (onError) {
                onError(error);
            }
            // Optional: decide if you want to stop on error or continue
        }
    }

    // Final progress update
    if (onProgress) {
        onProgress({
            completed: files.length,
            total: files.length,
            currentFile: '',
        });
    }

    if (onComplete) {
        onComplete();
    }

}
