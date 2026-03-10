import { supporterService } from './api';

const form = document.getElementById('reset-key-form') as HTMLFormElement | null;
const emailInput = document.getElementById('reset-email-input') as HTMLInputElement | null;
const submitBtn = document.getElementById('reset-key-submit') as HTMLButtonElement | null;
const messageEl = document.getElementById('reset-key-message') as HTMLDivElement | null;

function showMessage(text: string, type: 'success' | 'error' | 'loading') {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `license-message show ${type}`;
}

function setLoading(loading: boolean) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Sending...' : 'Reset License Key';
}

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput?.value.trim() ?? '';

    if (!email) {
        showMessage('Please enter your email address.', 'error');
        emailInput?.focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        emailInput?.focus();
        return;
    }

    setLoading(true);
    if (messageEl) messageEl.className = 'license-message';

    try {
        await supporterService.resetKey(email);
        showMessage(
            '\u2713 If this email has a valid license, a new key has been sent to your inbox. Please also check your Spam/Junk folder.',
            'success'
        );
    } catch {
        showMessage(
            'Something went wrong. Please try again later.',
            'error'
        );
    } finally {
        setLoading(false);
    }
});
