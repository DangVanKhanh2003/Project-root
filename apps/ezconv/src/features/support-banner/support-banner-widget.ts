/**
 * Support Banner Widget
 * WHY: Show a combined Trustpilot review + Ko-fi donation banner below hero-container.
 * CONTRACT: Exposes show/hide API for widget-level-manager.
 */

import { ensureHeroBelowContainerSlot } from '../hero-below-container-slot';
import { getTipMessageKoFiLink } from '../supporter-pricing';

const SUPPORT_BANNER_ID = 'support-banner-wrapper';
const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/review/ezconv.pro';
const DEFAULT_KOFI_URL = 'https://ko-fi.com/Ezconv';

let bannerRequestId = 0;

// ============================================================
// I18N
// ============================================================

type SupportBannerI18n = {
    reviewUs: string;
    onTrustpilot: string;
    buyMeACoffee: string;
    toKeepAdFree: string;
};

const I18N_BY_LANG: Record<string, SupportBannerI18n> = {
    en: {
        reviewUs: 'Review us on',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'buy me a coffee',
        toKeepAdFree: 'so we can keep this website ad-free'
    },
    ar: {
        reviewUs: 'قيّمنا على',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'اشترِ لي قهوة',
        toKeepAdFree: 'لإبقاء هذا الموقع دون إعلانات'
    },
    bn: {
        reviewUs: 'আমাদের রিভিউ করুন',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'আমাকে এক কাপ কফি কিনে দিন',
        toKeepAdFree: 'এই সাইটটি বিজ্ঞাপনমুক্ত রাখতে'
    },
    de: {
        reviewUs: 'Bewerten Sie uns auf',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Spendiere mir einen Kaffee',
        toKeepAdFree: 'damit diese Seite werbefrei bleibt'
    },
    es: {
        reviewUs: 'Reseñanos en',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Invítame a un café',
        toKeepAdFree: 'para mantener este sitio sin anuncios'
    },
    fr: {
        reviewUs: 'Évaluez-nous sur',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Offrez-moi un café',
        toKeepAdFree: 'pour garder ce site sans publicité'
    },
    hi: {
        reviewUs: 'हमें रिव्यू दें',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'मुझे एक कॉफी खरीदकर दें',
        toKeepAdFree: 'इस साइट को विज्ञापन-मुक्त रखने के लिए'
    },
    id: {
        reviewUs: 'Ulas kami di',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Traktir saya kopi',
        toKeepAdFree: 'agar situs ini tetap bebas iklan'
    },
    it: {
        reviewUs: 'Recensiscici su',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Offrimi un caffè',
        toKeepAdFree: 'per mantenere questo sito senza pubblicità'
    },
    ja: {
        reviewUs: 'レビューしてください',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'コーヒーをおごってください',
        toKeepAdFree: 'このサイトを広告なしで維持するために'
    },
    ko: {
        reviewUs: '리뷰를 남겨주세요',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: '커피 한 잔 후원해 주세요',
        toKeepAdFree: '이 사이트를 광고 없이 유지하기 위해'
    },
    ms: {
        reviewUs: 'Ulas kami di',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Belanja saya secawan kopi',
        toKeepAdFree: 'supaya laman web ini kekal tanpa iklan'
    },
    my: {
        reviewUs: 'ကျွန်ုပ်တို့ကို သုံးသပ်ပေးပါ',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'ကော်ဖီတစ်ခွက် လှူပေးပါ',
        toKeepAdFree: 'ဤဝဘ်ဆိုဒ်ကို ကြော်ငြာမပါဘဲ ထိန်းသိမ်းရန်'
    },
    pt: {
        reviewUs: 'Avalie-nos no',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Pague-me um café',
        toKeepAdFree: 'para manter este site sem anúncios'
    },
    ru: {
        reviewUs: 'Оцените нас на',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Угостите меня чашкой кофе',
        toKeepAdFree: 'чтобы сайт оставался без рекламы'
    },
    th: {
        reviewUs: 'รีวิวเราบน',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'เลี้ยงกาแฟให้ฉันสักแก้ว',
        toKeepAdFree: 'เพื่อให้เว็บไซต์นี้ไม่มีโฆษณา'
    },
    tr: {
        reviewUs: 'Bizi değerlendirin',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Bana bir kahve ısmarlayın',
        toKeepAdFree: 'bu siteyi reklamsız tutabilmemiz için'
    },
    ur: {
        reviewUs: 'ہمیں ریویو دیں',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'مجھے ایک کپ کافی پلا دیں',
        toKeepAdFree: 'اس سائٹ کو اشتہارات سے پاک رکھنے کے لیے'
    },
    vi: {
        reviewUs: 'Đánh giá chúng tôi trên',
        onTrustpilot: 'Trustpilot',
        buyMeACoffee: 'Mua cho tôi một ly cà phê',
        toKeepAdFree: 'để duy trì trang web này không quảng cáo'
    }
};

function resolveI18n(): SupportBannerI18n {
    const lang = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    return I18N_BY_LANG[lang] || I18N_BY_LANG.en;
}

// ============================================================
// RENDER
// ============================================================

function renderBanner(wrapper: HTMLElement, koFiUrl: string): void {
    const t = resolveI18n();

    wrapper.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:12px 24px;padding:10px 16px;font-size:14px;flex-wrap:wrap;">
            <a href="${TRUSTPILOT_REVIEW_URL}" target="_blank" rel="noopener noreferrer"
               style="display:inline-flex;align-items:center;gap:5px;color:var(--text-body, #333);text-decoration:none;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31 29" fill="none" aria-hidden="true" style="width:18px;height:18px;flex-shrink:0;"><path fill="#00B67A" d="M30.141707 11.07005H18.63164L15.076408.177071l-3.566342 10.892977L0 11.059002l9.321376 6.739063-3.566343 10.88193 9.321375-6.728016 9.310266 6.728016-3.555233-10.88193 9.310266-6.728016z"/><path fill="#005128" d="M21.631369 20.26169l-.799928-2.463625-5.755033 4.153914z"/></svg>
                <span>${t.reviewUs} <strong style="color:var(--text-body, #333);">${t.onTrustpilot}</strong></span>
            </a>
            <span class="support-banner-separator" style="width:1px;height:20px;background:var(--border-default, #ccc);flex-shrink:0;" aria-hidden="true"></span>
            <a href="${koFiUrl}" target="_blank" rel="nofollow noopener noreferrer"
               style="display:inline-flex;align-items:center;gap:5px;text-decoration:none;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" aria-hidden="true" style="width:1rem;height:1rem;fill:#f45d22;flex-shrink:0;"><path d="M96 64c0-17.7 14.3-32 32-32l320 0 64 0c70.7 0 128 57.3 128 128s-57.3 128-128 128l-32 0c0 53-43 96-96 96l-192 0c-53 0-96-43-96-96L96 64zM480 224l32 0c35.3 0 64-28.7 64-64s-28.7-64-64-64l-32 0 0 128zM32 416l512 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 480c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>
                <span style="color:var(--text-body, #333);"><strong style="color:#f45d22;">${t.buyMeACoffee}</strong> ${t.toKeepAdFree}</span>
            </a>
        </div>
    `;
}

// ============================================================
// PUBLIC API
// ============================================================

export function showSupportBanner(): void {
    const requestId = ++bannerRequestId;

    const wrapper = ensureHeroBelowContainerSlot(SUPPORT_BANNER_ID, {
        marginTop: '20px'
    });
    if (!wrapper) return;

    renderBanner(wrapper, DEFAULT_KOFI_URL);

    void getTipMessageKoFiLink()
        .then((koFiLink) => {
            if (requestId !== bannerRequestId || !koFiLink || koFiLink === DEFAULT_KOFI_URL) {
                return;
            }
            const currentWrapper = document.getElementById(SUPPORT_BANNER_ID);
            if (currentWrapper) {
                renderBanner(currentWrapper, koFiLink);
            }
        })
        .catch(() => {
            // Keep fallback Ko-fi link
        });
}

export function hideSupportBanner(): void {
    bannerRequestId += 1;
    const wrapper = document.getElementById(SUPPORT_BANNER_ID);
    if (wrapper) wrapper.remove();
}
