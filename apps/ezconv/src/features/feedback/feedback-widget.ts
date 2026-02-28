import { api } from '../../api';
import { getState as getDownloaderState } from '../downloader/state/state-manager';

const CONFIG = {
  CSS_ID: 'fb-widget-css',
  WRAPPER_ID: 'fb-widget-wrap',
};

const TRANSLATIONS: Record<string, string> = {
  bubbleText: 'Suggest an idea',
  title: 'Suggest an idea',
  emailLabel: 'Contact Email',
  ideaLabel: 'Your Idea',
  ideaPlaceholder: 'I think the site should have...',
  submitBtn: 'Send Idea',
  sending: 'Sending...',
  successTitle: 'Thank you!',
  successMsg: 'Your feedback has been sent.<br/>We will review it soon.',
  errorMsg: 'Something went wrong. Please try again.',
};

type WidgetElements = {
  panel?: HTMLElement | null;
  bubble?: HTMLButtonElement | null;
  closeBtn?: HTMLButtonElement | null;
  form?: HTMLFormElement | null;
  emailInp?: HTMLInputElement | null;
  ideaInp?: HTMLTextAreaElement | null;
  submitBtn?: HTMLButtonElement | null;
  btnText?: HTMLElement | null;
  btnIcon?: HTMLElement | null;
  btnLoader?: HTMLElement | null;
  viewForm?: HTMLElement | null;
  viewSuccess?: HTMLElement | null;
};

const state = {
  initialized: false,
  isOpen: false,
};

let elements: WidgetElements = {};

function t(key: string): string {
  return TRANSLATIONS[key] || key;
}

function getInputValue(): string {
  const textarea = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
  return textarea?.value?.trim() || '';
}

function injectStyles(): void {
  if (document.getElementById(CONFIG.CSS_ID)) return;

  const style = document.createElement('style');
  style.id = CONFIG.CSS_ID;
  style.innerHTML = `
    .fb-wrap {
      position: fixed;
      right: 10px;
      bottom: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
      z-index: 9999;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      box-sizing: border-box;
    }
    .fb-wrap * { box-sizing: border-box; }
    .fb-bubble {
      height: 46px;
      width: fit-content;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
      background: #fff;
      color: #334155;
      cursor: pointer;
      box-shadow: 0 18px 45px rgba(2, 6, 23, 0.12), 0 2px 6px rgba(2, 6, 23, 0.10);
      transition: transform .2s ease, box-shadow .2s ease;
      user-select: none;
      font-family: inherit;
    }
    .fb-bubble:hover {
      box-shadow: 0 24px 70px rgba(2, 6, 23, 0.16), 0 3px 8px rgba(2, 6, 23, 0.12);
      background: #f8fafc;
    }
    .fb-bubble svg { width: 14px; height: 14px; }
    .fb-bubble .icon { color: #eab308; fill: #eab308; display: block !important; }
    .fb-bubble span { font-size: 16px; }
    .fb-bubble-text { white-space: nowrap; }
    @media (max-width: 768px) {
      .fb-bubble { width: 46px; min-width: 46px; justify-content: center; padding: 0; }
      .fb-bubble svg { width: 22px; height: 22px; }
      .fb-bubble-text { display: none; }
    }
    .fb-panel {
      width: 300px;
      max-width: calc(100vw - 48px);
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(2, 6, 23, 0.16);
      overflow: hidden;
      transform-origin: bottom right;
      animation: fbIn .28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .fb-hidden { display: none !important; }
    @keyframes fbIn {
      from { opacity: 0; transform: translateY(10px) scale(.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fbSpin { to { transform: rotate(360deg); } }
    .fb-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
    }
    .fb-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      color: #1f2937;
    }
    .fb-close {
      border: 0;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 999px;
      transition: background .15s ease, color .15s ease, transform .12s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .fb-close:hover { color: #475569; background: #e2e8f0; }
    .fb-close:active { transform: scale(.96); }
    .fb-close svg { width: 16px; height: 16px; }
    .fb-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .fb-field label {
      display: block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 6px 4px;
    }
    .fb-field label .req { color: #f87171; }
    .fb-control { position: relative; }
    .fb-control .ic {
      position: absolute;
      left: 12px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
      pointer-events: none;
      transition: color .15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      top: 50%;
      transform: translateY(-50%);
    }
    .fb-control .fb-textarea ~ .ic { top: 12px; transform: none; }
    .fb-input, .fb-textarea {
      width: 100%;
      font-size: 16px;
      padding: 10px 12px 10px 36px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #0f172a;
      outline: none;
      transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
      font-family: inherit;
    }
    .fb-textarea { resize: none; padding-left: 12px; }
    .fb-input::placeholder, .fb-textarea::placeholder { color: #94a3b8; }
    .fb-input:focus, .fb-textarea:focus {
      background: #fff;
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.10);
    }
    .fb-submit {
      width: 100%;
      border: 0;
      border-radius: 14px;
      padding: 11px 12px;
      background: #0f172a;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: transform .12s ease, background .15s ease, opacity .15s ease;
      box-shadow: 0 12px 24px rgba(2, 6, 23, 0.10);
      margin-top: 4px;
      font-family: inherit;
    }
    .fb-submit:hover { background: #111c33; }
    .fb-submit:active { transform: scale(.98); }
    .fb-submit:disabled { opacity: .6; cursor: not-allowed; }
    .fb-submit svg { width: 14px; height: 14px; }
    .fb-spinner { animation: fbSpin 1s linear infinite; }
    .fb-success {
      padding: 28px 18px;
      min-height: 230px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 8px;
      animation: fbIn .28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .fb-badge {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      background: #ecfdf5;
      color: #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
    }
    .fb-badge svg { width: 28px; height: 28px; }
    .fb-success h3 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
    .fb-success p { margin: 0; font-size: 14px; color: #64748b; line-height: 1.5; }
  `;
  document.head.appendChild(style);
}

function createStructure(): void {
  const container = document.createElement('div');
  container.id = CONFIG.WRAPPER_ID;
  container.className = 'fb-wrap';

  const icons = {
    x: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    loader: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
    checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  };

  container.innerHTML = `
    <div id="fb-panel" class="fb-panel fb-hidden">
      <div id="fb-view-form">
        <div class="fb-head">
          <h3 class="fb-title">
            <span style="color:#eab308;display:flex;">${icons.lightbulb}</span>
            ${t('title')}
          </h3>
          <button id="fb-close" class="fb-close" type="button" aria-label="Close">${icons.x}</button>
        </div>
        <form id="fb-form" class="fb-body">
          <div class="fb-field">
            <label>${t('emailLabel')}</label>
            <div class="fb-control">
              <input id="fb-email" class="fb-input" type="email" placeholder="name@example.com" autocomplete="email" />
              <span class="ic">${icons.mail}</span>
            </div>
          </div>
          <div class="fb-field">
            <label>${t('ideaLabel')} <span class="req">*</span></label>
            <div class="fb-control">
              <textarea id="fb-idea" class="fb-textarea" rows="3" placeholder="${t('ideaPlaceholder')}" required></textarea>
            </div>
          </div>
          <button id="fb-submit" class="fb-submit" type="submit">
            <span id="fb-btn-text">${t('submitBtn')}</span>
            <span id="fb-btn-icon">${icons.send}</span>
            <span id="fb-btn-loader" class="fb-hidden fb-spinner">${icons.loader}</span>
          </button>
        </form>
      </div>

      <div id="fb-view-success" class="fb-success fb-hidden">
        <div class="fb-badge">${icons.checkCircle}</div>
        <h3>${t('successTitle')}</h3>
        <p>${t('successMsg')}</p>
      </div>
    </div>

    <button id="fb-bubble" class="fb-bubble" type="button">
      <span class="icon">${icons.lightbulb}</span>
      <span class="fb-bubble-text">${t('bubbleText')}</span>
    </button>
  `;

  document.body.appendChild(container);

  elements = {
    panel: container.querySelector('#fb-panel'),
    bubble: container.querySelector('#fb-bubble'),
    closeBtn: container.querySelector('#fb-close'),
    form: container.querySelector('#fb-form'),
    emailInp: container.querySelector('#fb-email'),
    ideaInp: container.querySelector('#fb-idea'),
    submitBtn: container.querySelector('#fb-submit'),
    btnText: container.querySelector('#fb-btn-text'),
    btnIcon: container.querySelector('#fb-btn-icon'),
    btnLoader: container.querySelector('#fb-btn-loader'),
    viewForm: container.querySelector('#fb-view-form'),
    viewSuccess: container.querySelector('#fb-view-success'),
  };
}

function openPanel(): void {
  if (!elements.panel) return;
  elements.panel.classList.remove('fb-hidden');
  elements.panel.style.animation = 'none';
  void elements.panel.offsetWidth;
  elements.panel.style.animation = '';
  state.isOpen = true;
}

function closePanel(): void {
  if (!elements.panel) return;
  elements.panel.classList.add('fb-hidden');
  state.isOpen = false;
  setTimeout(resetForm, 250);
}

function resetForm(): void {
  if (!elements.form || !elements.viewForm || !elements.viewSuccess || !elements.submitBtn || !elements.btnText || !elements.btnIcon || !elements.btnLoader) {
    return;
  }
  elements.viewForm.classList.remove('fb-hidden');
  elements.viewSuccess.classList.add('fb-hidden');
  elements.form.reset();
  elements.submitBtn.disabled = false;
  elements.btnText.textContent = t('submitBtn');
  elements.btnIcon.classList.remove('fb-hidden');
  elements.btnLoader.classList.add('fb-hidden');
}

function buildSanitizedContext() {
  const rawState = getDownloaderState();
  let cloned: any = null;
  try {
    cloned = JSON.parse(JSON.stringify(rawState));
  } catch {
    cloned = null;
  }

  if (cloned && typeof cloned === 'object') {
    if ('searchV2Results' in cloned) cloned.searchV2Results = null;
    if ('searchV2Pagination' in cloned) cloned.searchV2Pagination = null;
    if ('results' in cloned) cloned.results = null;
    if ('searchPagination' in cloned) cloned.searchPagination = null;
  }

  return cloned;
}

async function submitFeedback(description: string, email: string): Promise<void> {
  const context = buildSanitizedContext();
  const link = getInputValue();
  const page = window.location.pathname;

  // Preserve existing app API service initialization pattern.
  // Access ensures the service tree is initialized before submission.
  void api.core;

  const result = await api.sendFeedbackWidget({
    title: 'Feedback Widget',
    description,
    page,
    email,
    link,
    state: context,
  });

  const payload = result?.data as any;
  if (!result.ok || (payload && typeof payload === 'object' && payload.ok === false)) {
    throw new Error(result.message || payload?.message || 'Failed to send feedback');
  }
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault();
  if (!elements.ideaInp || !elements.emailInp || !elements.submitBtn || !elements.btnText || !elements.btnIcon || !elements.btnLoader || !elements.viewForm || !elements.viewSuccess) {
    return;
  }

  const description = elements.ideaInp.value.trim();
  if (!description) return;
  const email = elements.emailInp.value.trim();

  elements.submitBtn.disabled = true;
  elements.btnText.textContent = t('sending');
  elements.btnIcon.classList.add('fb-hidden');
  elements.btnLoader.classList.remove('fb-hidden');

  try {
    await submitFeedback(description, email);
    elements.viewForm.classList.add('fb-hidden');
    elements.viewSuccess.classList.remove('fb-hidden');
    setTimeout(() => closePanel(), 1500);
  } catch {
    alert(t('errorMsg'));
    elements.submitBtn.disabled = false;
    elements.btnText.textContent = t('submitBtn');
    elements.btnIcon.classList.remove('fb-hidden');
    elements.btnLoader.classList.add('fb-hidden');
  }
}

function setupEvents(): void {
  if (!elements.bubble || !elements.closeBtn || !elements.panel || !elements.form) return;

  elements.bubble.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.isOpen) closePanel();
    else openPanel();
  });

  elements.closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePanel();
  });

  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (
      state.isOpen &&
      elements.panel &&
      elements.bubble &&
      !elements.panel.contains(target) &&
      !elements.bubble.contains(target)
    ) {
      closePanel();
    }
  });

  elements.panel.addEventListener('click', (e) => e.stopPropagation());
  elements.form.addEventListener('submit', handleSubmit);
}

export function initFeedbackWidget(): void {
  if (state.initialized) return;
  injectStyles();
  createStructure();
  setupEvents();
  state.initialized = true;
}
