/**
 * Type definitions for i18n data injected by 11ty templates
 */

interface I18nData {
  nav: {
    home: string;
    youtubeToMp4: string;
    youtubeToMp3: string;
    youtubeShorts: string;
    language: string;
  };
  hero: {
    placeholder: string;
    pasteLabel: string;
    clearLabel: string;
    submitButton: string;
    termsText: string;
    termsLink: string;
  };
  formatSelector: {
    autoSubmit: string;
    autoSubmitTooltip: string;
    formats: {
      mp4: string;
      mp3: string;
    };
    quality: {
      videoLabel: string;
      audioLabel: string;
    };
    options: {
      mp4: Record<string, string>;
      mp3: Record<string, string>;
    };
  };
  status: {
    processing: string;
    preparing: string;
    merging: string;
    zipping: string;
    ready: string;
    completed: string;
    failed: string;
  };
  buttons: {
    download: string;
    tryAgain: string;
    cancel: string;
    seeMore: string;
    seeLess: string;
    bulkDownload: string;
  };
  gallery: {
    title: string;
    noItems: string;
    selected: string;
    selectAll: string;
    deselectAll: string;
  };
  mobile: {
    menuToggleLabel: string;
    menuCloseLabel: string;
    langButtonLabel: string;
  };
  footer: {
    copyright: string;
    about: string;
    contact: string;
    terms: string;
    privacy: string;
  };
  errors: {
    invalidUrl: string;
    networkError: string;
    processingError: string;
    timeout: string;
    downloadExpired: string;
    conversionFailed: string;
  };
  messages: {
    downloadReady: string;
    processing: string;
    pleaseWait: string;
  };
}

declare global {
  interface Window {
    __i18n__: I18nData;
    __pageData__: any;
    __lang__: string;
  }
}

export {};
