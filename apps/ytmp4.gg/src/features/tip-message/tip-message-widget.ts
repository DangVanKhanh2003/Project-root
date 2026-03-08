/**
 * Tip Message Widget
 * WHY: Show a small donation prompt inside the hero-card, above the support platforms bar.
 * CONTRACT: Exposes show/hide API for widget-level-manager.
 */

import { getTipMessageKoFiLink } from '../supporter-pricing';

const TIP_MESSAGE_WRAPPER_ID = 'tip-message-wrapper';
const DEFAULT_KOFI_URL = 'https://ko-fi.com/metaconvert4';
let tipMessageRequestId = 0;

type TipMessageI18n = {
    tipMessagePlease: string;
    tipMessageCoffee: string;
    tipMessageSuffix: string;
};

type TipMessageOptions = {
    url?: string;
    i18n?: Partial<TipMessageI18n>;
};

const I18N_BY_LANG: Record<string, TipMessageI18n> = {
    en: {
        tipMessagePlease: 'Please',
        tipMessageCoffee: 'buy me a coffee',
        tipMessageSuffix: 'so we can keep this website ad-free'
    },
    ar: {
        tipMessagePlease: 'من فضلك',
        tipMessageCoffee: 'اشترِ لي قهوة',
        tipMessageSuffix: 'حتى نتمكن من إبقاء هذا الموقع دون إعلانات'
    },
    bn: {
        tipMessagePlease: 'অনুগ্রহ করে',
        tipMessageCoffee: 'আমাকে এক কাপ কফি কিনে দিন',
        tipMessageSuffix: 'যাতে আমরা এই ওয়েবসাইটটি বিজ্ঞাপনমুক্ত রাখতে পারি'
    },
    de: {
        tipMessagePlease: 'Bitte',
        tipMessageCoffee: 'spendiere mir einen Kaffee',
        tipMessageSuffix: 'damit wir diese Website werbefrei halten können'
    },
    es: {
        tipMessagePlease: 'Por favor',
        tipMessageCoffee: 'invítame a un café',
        tipMessageSuffix: 'para que podamos mantener este sitio web sin anuncios'
    },
    fr: {
        tipMessagePlease: "S'il vous plaît",
        tipMessageCoffee: 'offrez-moi un café',
        tipMessageSuffix: 'afin que nous puissions garder ce site sans publicité'
    },
    hi: {
        tipMessagePlease: 'कृपया',
        tipMessageCoffee: 'मुझे एक कॉफी खरीदकर दें',
        tipMessageSuffix: 'ताकि हम इस वेबसाइट को विज्ञापन-मुक्त रख सकें'
    },
    id: {
        tipMessagePlease: 'Tolong',
        tipMessageCoffee: 'traktir saya kopi',
        tipMessageSuffix: 'agar kami bisa menjaga situs ini tetap bebas iklan'
    },
    it: {
        tipMessagePlease: 'Per favore',
        tipMessageCoffee: 'offrimi un caffè',
        tipMessageSuffix: 'così possiamo mantenere questo sito senza pubblicità'
    },
    ja: {
        tipMessagePlease: 'お願いします',
        tipMessageCoffee: 'コーヒーをおごってください',
        tipMessageSuffix: 'このサイトを広告なしで維持するために'
    },
    ko: {
        tipMessagePlease: '부탁드려요',
        tipMessageCoffee: '커피 한 잔 후원해 주세요',
        tipMessageSuffix: '이 웹사이트를 광고 없이 운영할 수 있도록'
    },
    ms: {
        tipMessagePlease: 'Tolong',
        tipMessageCoffee: 'belanja saya secawan kopi',
        tipMessageSuffix: 'supaya kami dapat mengekalkan laman web ini tanpa iklan'
    },
    my: {
        tipMessagePlease: 'ကျေးဇူးပြု၍',
        tipMessageCoffee: 'ကော်ဖီတစ်ခွက် လှူပေးပါ',
        tipMessageSuffix: 'ဤဝဘ်ဆိုဒ်ကို ကြော်ငြာမပါဘဲ ဆက်လက်ထိန်းသိမ်းနိုင်ရန်'
    },
    pt: {
        tipMessagePlease: 'Por favor',
        tipMessageCoffee: 'pague-me um café',
        tipMessageSuffix: 'para que possamos manter este site sem anúncios'
    },
    ru: {
        tipMessagePlease: 'Пожалуйста',
        tipMessageCoffee: 'угостите меня чашкой кофе',
        tipMessageSuffix: 'чтобы мы могли поддерживать этот сайт без рекламы'
    },
    th: {
        tipMessagePlease: 'โปรด',
        tipMessageCoffee: 'เลี้ยงกาแฟให้ฉันสักแก้ว',
        tipMessageSuffix: 'เพื่อให้เราสามารถดูแลเว็บไซต์นี้ให้ไม่มีโฆษณาได้'
    },
    tr: {
        tipMessagePlease: 'Lütfen',
        tipMessageCoffee: 'bana bir kahve ısmarlayın',
        tipMessageSuffix: 'böylece bu web sitesini reklamsız tutabiliriz'
    },
    ur: {
        tipMessagePlease: 'براہِ کرم',
        tipMessageCoffee: 'مجھے ایک کپ کافی پلا دیں',
        tipMessageSuffix: 'تاکہ ہم اس ویب سائٹ کو اشتہارات سے پاک رکھ سکیں'
    },
    vi: {
        tipMessagePlease: 'Hãy',
        tipMessageCoffee: 'ủng hộ chúng tôi',
        tipMessageSuffix: 'để có thể duy trì trang web này không quảng cáo'
    }
};

function resolveI18n(override?: Partial<TipMessageI18n>): TipMessageI18n {
    const lang = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    const base = I18N_BY_LANG[lang] || I18N_BY_LANG.en;
    return {
        tipMessagePlease: override?.tipMessagePlease || base.tipMessagePlease,
        tipMessageCoffee: override?.tipMessageCoffee || base.tipMessageCoffee,
        tipMessageSuffix: override?.tipMessageSuffix || base.tipMessageSuffix
    };
}

function resolveKoFiHref(url?: string): string {
    if (!url) return DEFAULT_KOFI_URL;
    return url.trim() || DEFAULT_KOFI_URL;
}

function ensureWrapper(): HTMLElement | null {
    let wrapper = document.getElementById(TIP_MESSAGE_WRAPPER_ID);
    if (wrapper) return wrapper;

    const heroCard = document.querySelector('.hero-card') as HTMLElement | null;
    if (!heroCard) return null;

    wrapper = document.createElement('div');
    wrapper.id = TIP_MESSAGE_WRAPPER_ID;

    // Insert before .support-platforms-bar if it exists, otherwise append to hero-card
    const supportBar = heroCard.querySelector('.support-platforms-bar') as HTMLElement | null;
    if (supportBar) {
        heroCard.insertBefore(wrapper, supportBar);
    } else {
        heroCard.appendChild(wrapper);
    }

    return wrapper;
}

export function showTipMessageWidget(options: TipMessageOptions = {}): void {
    const requestId = ++tipMessageRequestId;
    const wrapper = ensureWrapper();
    if (!wrapper) return;

    // Hide support platforms bar when showing tip message
    const supportBar = document.querySelector('.support-platforms-bar') as HTMLElement | null;
    if (supportBar) {
        supportBar.style.display = 'none';
    }

    const t = resolveI18n(options.i18n);
    const koFiHref = resolveKoFiHref(options.url);

    wrapper.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:16px 16px 0px;text-align:center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="width:1rem;height:1rem;fill:#f45d22;flex-shrink:0;"><path d="M96 64c0-17.7 14.3-32 32-32l320 0 64 0c70.7 0 128 57.3 128 128s-57.3 128-128 128l-32 0c0 53-43 96-96 96l-192 0c-53 0-96-43-96-96L96 64zM480 224l32 0c35.3 0 64-28.7 64-64s-28.7-64-64-64l-32 0 0 128zM32 416l512 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 480c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>
            <span style="color:var(--text-body);">
                ${t.tipMessagePlease}
                <a href="${koFiHref}" target="_blank" rel="nofollow noopener noreferrer" style="text-decoration:underline;font-weight:700;color:#f45d22 !important;">
                    ${t.tipMessageCoffee}
                </a>
                ${t.tipMessageSuffix}
            </span>
        </div>
    `;

    if (typeof options.url === 'string' && options.url.trim()) {
        return;
    }

    void getTipMessageKoFiLink()
        .then((koFiLink) => {
            if (requestId !== tipMessageRequestId || !koFiLink || koFiLink === koFiHref) {
                return;
            }

            showTipMessageWidget({
                ...options,
                url: koFiLink
            });
        })
        .catch(() => {
            // Keep fallback Ko-fi link when pricing API is unavailable.
        });
}

export function hideTipMessageWidget(): void {
    tipMessageRequestId += 1;
    const wrapper = document.getElementById(TIP_MESSAGE_WRAPPER_ID);
    if (wrapper) wrapper.remove();

    // Restore support platforms bar when hiding tip message
    const supportBar = document.querySelector('.support-platforms-bar') as HTMLElement | null;
    if (supportBar) {
        supportBar.style.removeProperty('display');
    }
}
