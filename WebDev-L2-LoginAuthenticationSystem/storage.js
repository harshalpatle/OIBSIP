/* =========================================================
   Vaultline — shared auth storage helpers
   Users live in localStorage as { usernameLower: { displayName, salt, hash, createdAt } }.
   Passwords are never stored in plain text: each is hashed with
   SHA-256 + a random per-user salt via the browser's Web Crypto API.
   This is a front-end demo (no server), so treat it as a working
   auth *flow*, not production-grade security.
   ========================================================= */

const VAULT_USERS_KEY = 'vaultline_users';
const VAULT_SESSION_KEY = 'vaultline_session';

function vaultLoadUsers() {
  try {
    return JSON.parse(localStorage.getItem(VAULT_USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function vaultSaveUsers(users) {
  localStorage.setItem(VAULT_USERS_KEY, JSON.stringify(users));
}

function vaultRandomHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

async function vaultSha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

async function vaultHashPassword(password, salt) {
  return vaultSha256Hex(`${salt}:${password}`);
}

function vaultGetSession() {
  try {
    const raw = sessionStorage.getItem(VAULT_SESSION_KEY) || localStorage.getItem(VAULT_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.token || !session.username) return null;
    return session;
  } catch {
    return null;
  }
}

function vaultStartSession(displayName, remember) {
  const session = {
    username: displayName,
    token: vaultRandomHex(24),
    loginAt: Date.now(),
  };
  // "Remember me" persists the session across browser restarts (localStorage);
  // otherwise it lives only for the current tab (sessionStorage).
  if (remember) {
    localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(VAULT_SESSION_KEY);
  } else {
    sessionStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(VAULT_SESSION_KEY);
  }
  return session;
}

function vaultEndSession() {
  sessionStorage.removeItem(VAULT_SESSION_KEY);
  localStorage.removeItem(VAULT_SESSION_KEY);
}
