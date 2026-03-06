/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface EzConvIntroApi {
  injectBanner: (container: HTMLElement, options?: Record<string, unknown>) => void;
  showPopup: (options?: Record<string, unknown>) => void;
  hidePopup: () => void;
  preloadPopup?: (options?: Record<string, unknown>) => void;
}

interface Window {
  EzConvIntro?: EzConvIntroApi;
}
