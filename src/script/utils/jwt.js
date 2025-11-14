
const JWT_KEY = 'app_jwt';
const EXPIRATION_MS = 11 * 60 * 60 * 1000 + 55 * 60 * 1000; // 11 hours 55 minutes in milliseconds

/**
 * Saves the JWT and its expiration timestamp to localStorage.
 * @param {string} token - The JWT to save.
 */
export function saveJwt(token) {
    if (!token) return;
    const now = new Date().getTime();
    const item = {
        token: token,
        expiry: now + EXPIRATION_MS,
    };
    localStorage.setItem(JWT_KEY, JSON.stringify(item));
}

/**
 * Retrieves a valid, non-expired JWT from localStorage.
 * @returns {string|null} The token if it exists and is not expired, otherwise null.
 */
export function getValidJwt() {
    const itemStr = localStorage.getItem(JWT_KEY);
    if (!itemStr) {
        return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date().getTime();

    if (now > item.expiry) {
        localStorage.removeItem(JWT_KEY);
        return null;
    }

    return item.token;
}

/**
 * Removes the JWT from localStorage.
 */
export function clearJwt() {
    localStorage.removeItem(JWT_KEY);
}
