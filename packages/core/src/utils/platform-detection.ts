/**
 * Platform Detection Utilities
 *
 * Detects user platform (iOS, Android, Windows, Mac, etc.)
 */

/**
 * Check if current platform is iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Check if current platform is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
}

/**
 * Check if current platform is Windows
 */
export function isWindows(): boolean {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /windows|win32|win64/.test(userAgent);
}

/**
 * Check if current platform is Mac
 */
export function isMac(): boolean {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /macintosh|mac os x/.test(userAgent) && !isIOS();
}

/**
 * Check if current platform is mobile (iOS or Android)
 */
export function isMobile(): boolean {
  return isIOS() || isAndroid();
}

/**
 * Check if current platform is desktop
 */
export function isDesktop(): boolean {
  return !isMobile();
}

/**
 * Get platform name
 */
export function getPlatform(): 'ios' | 'android' | 'windows' | 'mac' | 'unknown' {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  if (isWindows()) return 'windows';
  if (isMac()) return 'mac';
  return 'unknown';
}
