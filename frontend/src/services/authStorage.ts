/**
 * Single source of truth for where the auth token lives on the client.
 * Kept separate from api/client.ts so other modules (e.g. a future
 * "remember me" toggle) can read/write it without importing the whole
 * API layer.
 */

const TOKEN_KEY = "neurovista.auth_token";

/**
 * "Remember me" (login form) controls WHICH storage the token goes in:
 * localStorage survives closing the browser, sessionStorage clears when
 * the tab/browser closes. Both are checked on read so a token written
 * under either policy is still found.
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, remember = true): void {
  try {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* private browsing / storage disabled — session just won't persist */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
