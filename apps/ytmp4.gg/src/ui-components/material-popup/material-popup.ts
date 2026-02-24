
export interface PopupOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    type?: 'info' | 'warning' | 'error';
}

export class MaterialPopup {
    static show(options: PopupOptions) {
        const {
            title,
            message,
            confirmText = 'OK',
            cancelText,
            onConfirm,
            onCancel,
            type = 'info'
        } = options;

        // Clean up any existing popups
        const existing = document.querySelector('.m3-dialog-overlay');
        if (existing) {
            existing.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'm3-dialog-overlay';

        const dialogClass = type === 'info' ? 'm3-dialog' : `m3-dialog ${type}`;

        const warningIcon = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        `;

        const infoIcon = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;

        const errorIcon = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        `;

        let iconContent = '';
        if (type === 'warning') iconContent = warningIcon;
        else if (type === 'error') iconContent = errorIcon;
        else iconContent = infoIcon;

        const cancelButtonHtml = cancelText 
            ? `<button class="m3-button-text m3-cancel-btn" type="button" style="margin-top: 8px; width: 100%; border-radius: 99px; height: 40px; color: #6b7280; font-weight: 500;">${cancelText}</button>`
            : '';

        overlay.innerHTML = `
            <div class="${dialogClass}">
                <div class="m3-dialog-icon-wrapper">${iconContent}</div>
                <h2 class="m3-dialog-title">${title}</h2>
                <div class="m3-dialog-body">
                    <p class="m3-dialog-message">${message}</p>
                </div>
                <div class="m3-dialog-actions">
                    <button class="m3-button-solid m3-confirm-btn" type="button">${confirmText}</button>
                    ${cancelButtonHtml}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('is-visible');
        });

        const close = () => {
            overlay.classList.remove('is-visible');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        };

        const confirmBtn = overlay.querySelector('.m3-confirm-btn');
        confirmBtn?.addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });

        if (cancelText) {
            const cancelBtn = overlay.querySelector('.m3-cancel-btn');
            cancelBtn?.addEventListener('click', () => {
                close();
                if (onCancel) onCancel();
            });
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
                if (onCancel) onCancel();
            }
        });
    }
}
