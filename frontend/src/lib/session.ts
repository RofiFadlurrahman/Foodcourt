// Per-tab session helpers.
//
// BUGFIX: previously these keys lived in localStorage, which is shared
// across every tab in the same browser. That meant: log in as admin in
// Tab A, log in as tenant in Tab B → Tab A's session_user was overwritten
// with the tenant payload, and refreshing Tab A would redirect the user
// out of the admin dashboard because role check would fail.
//
// sessionStorage is per-tab, so each tab keeps its own login independently.
// Closing the tab logs it out — which is the natural behavior we want.

const SESSION_USER_KEY = "session_user";
const SESSION_TENANT_KEY = "session_tenant";
const THEME_KEY = "foodcourt_theme"; // theme stays in localStorage (global)

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export function getSessionUser<T>(): T | null {
  const w = safeWindow();
  if (!w) return null;
  const raw = w.sessionStorage.getItem(SESSION_USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setSessionUser<T>(user: T): void {
  const w = safeWindow();
  if (!w) return;
  w.sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  const w = safeWindow();
  if (!w) return;
  w.sessionStorage.removeItem(SESSION_USER_KEY);
}

export function getSessionTenant<T>(): T | null {
  const w = safeWindow();
  if (!w) return null;
  const raw = w.sessionStorage.getItem(SESSION_TENANT_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setSessionTenant<T>(tenant: T): void {
  const w = safeWindow();
  if (!w) return;
  w.sessionStorage.setItem(SESSION_TENANT_KEY, JSON.stringify(tenant));
}

export function clearSessionTenant(): void {
  const w = safeWindow();
  if (!w) return;
  w.sessionStorage.removeItem(SESSION_TENANT_KEY);
}

export function clearAllSession(): void {
  clearSessionUser();
  clearSessionTenant();
}

// Theme is global, stays in localStorage so all tabs share the same mode.
export function getStoredTheme(): string | null {
  const w = safeWindow();
  if (!w) return null;
  return w.localStorage.getItem(THEME_KEY);
}

export function setStoredTheme(theme: string): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(THEME_KEY, theme);
}
