export interface SharedPopupOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  buttonLayout?: 'stack' | 'row';
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'error';
}

export interface SharedPopupPresenter {
  show: (options: SharedPopupOptions) => void;
}

export interface ConfirmPlaylistRedirectPopupOptions {
  popup: SharedPopupPresenter;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmRedirectPopupOptions {
  popup: SharedPopupPresenter;
  target: 'channel' | 'playlist';
  cancelText?: string;
}

const REDIRECT_TEXT = {
  channel: {
    title: 'Go to channel downloader',
    message: 'This looks like a YouTube channel URL. Would you like to go to the channel downloader page?',
    confirmText: 'Channel page',
  },
  playlist: {
    title: 'Go to playlist page',
    message: 'Would you like to download a playlist instead? Go to the playlist downloader page.',
    confirmText: 'Playlist page',
  },
} as const;

export async function confirmRedirectPopup(options: ConfirmRedirectPopupOptions): Promise<boolean> {
  const { popup, target, cancelText = 'Cancel' } = options;
  const text = REDIRECT_TEXT[target];

  return new Promise((resolve) => {
    let settled = false;
    const settle = (go: boolean) => {
      if (settled) return;
      settled = true;
      resolve(go);
    };

    popup.show({
      title: text.title,
      message: text.message,
      type: 'info',
      confirmText: text.confirmText,
      cancelText,
      buttonLayout: 'row',
      onConfirm: () => settle(true),
      onCancel: () => settle(false),
    });
  });
}

export async function confirmPlaylistRedirectPopup(
  options: ConfirmPlaylistRedirectPopupOptions
): Promise<boolean> {
  const {
    popup,
    title = 'Go to playlist page',
    message = 'Would you like to download a playlist instead? Go to the playlist downloader page.',
    confirmText = 'Playlist page',
    cancelText = 'Continue',
  } = options;

  return new Promise((resolve) => {
    let settled = false;
    const settle = (goToPlaylistPage: boolean) => {
      if (settled) return;
      settled = true;
      resolve(goToPlaylistPage);
    };

    popup.show({
      title,
      message,
      type: 'info',
      confirmText,
      cancelText,
      buttonLayout: 'row',
      onConfirm: () => settle(true),
      onCancel: () => settle(false),
    });
  });
}
