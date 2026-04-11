/**
 * Expire Retry All Modal
 * Promise-based modal for expired/error download links with Retry All + optional Continue buttons.
 *
 * showRetryAllModal()                       → Retry All only
 * showRetryAllModal({ showContinue: true }) → Retry All + Continue (ZIP flow)
 * Returns Promise<'retry'|'continue'|'close'>
 */

type ModalAction = 'retry' | 'continue' | 'close';

interface RetryAllModalOptions {
    showContinue?: boolean;
    expiredCount?: number;
    errorCount?: number;
}

let resolveModal: ((action: ModalAction) => void) | null = null;

function settle(action: ModalAction): void {
    hideRetryAllModal();
    if (resolveModal) {
        resolveModal(action);
        resolveModal = null;
    }
}

function createModalIfNeeded(): void {
    if (document.getElementById('expire-retry-modal-overlay')) return;

    const modalHTML = `
        <div id="expire-retry-modal-overlay" class="expire-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="expire-retry-modal-title">
            <div class="expire-modal">
                <div class="expire-modal-header">
                    <h2 id="expire-retry-modal-title" class="expire-modal-title">Link Expired</h2>
                    <button id="expire-retry-close-btn" class="expire-modal-close-btn" aria-label="Close modal">&times;</button>
                </div>
                <div class="expire-modal-body">
                    <span class="expire-modal-icon">⚠️</span>
                    <p id="expire-retry-message">
                        Your <strong>download link has expired</strong>. Click <strong>Retry All</strong> to re-convert all expired and failed items.
                    </p>
                </div>
                <div class="expire-modal-footer" id="expire-retry-actions">
                    <button id="expire-retry-btn" class="expire-modal-btn expire-modal-btn-primary">Retry All</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('expire-retry-close-btn')!.addEventListener('click', () => settle('close'));

    document.getElementById('expire-retry-modal-overlay')!.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).id === 'expire-retry-modal-overlay') {
            settle('close');
        }
    });

    document.getElementById('expire-retry-btn')!.addEventListener('click', () => {
        settle('retry');
        document.dispatchEvent(new CustomEvent('retryAllExpiredItems'));
    });
}

export function showRetryAllModal(opts: RetryAllModalOptions = {}): Promise<ModalAction> {
    createModalIfNeeded();

    // Update message with counts
    const messageEl = document.getElementById('expire-retry-message');
    if (messageEl) {
        const parts: string[] = [];
        if (opts.expiredCount && opts.expiredCount > 0) parts.push(`<strong>${opts.expiredCount}</strong> expired`);
        if (opts.errorCount && opts.errorCount > 0) parts.push(`<strong>${opts.errorCount}</strong> failed`);

        if (parts.length > 0) {
            const total = (opts.expiredCount || 0) + (opts.errorCount || 0);
            messageEl.innerHTML = `${parts.join(' and ')} download link${total > 1 ? 's' : ''} found. Click <strong>Retry All</strong> to re-convert.`;
        } else {
            messageEl.innerHTML = 'Your <strong>download link has expired</strong>. Click <strong>Retry All</strong> to re-convert all expired and failed items.';
        }
    }

    // Toggle Continue button
    const actionsEl = document.getElementById('expire-retry-actions');
    let continueBtn = document.getElementById('expire-retry-continue-btn');

    if (opts.showContinue) {
        if (!continueBtn && actionsEl) {
            continueBtn = document.createElement('button');
            continueBtn.id = 'expire-retry-continue-btn';
            continueBtn.textContent = 'Continue';
            continueBtn.className = 'expire-modal-btn expire-modal-btn-secondary';
            actionsEl.appendChild(continueBtn);
            continueBtn.addEventListener('click', () => settle('continue'));
        }
        if (continueBtn) continueBtn.style.display = '';
    } else if (continueBtn) {
        continueBtn.style.display = 'none';
    }

    const overlay = document.getElementById('expire-retry-modal-overlay');
    if (overlay) {
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    return new Promise((resolve) => {
        resolveModal = resolve;
    });
}

function hideRetryAllModal(): void {
    const overlay = document.getElementById('expire-retry-modal-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }
}
