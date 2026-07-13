/* =========================================================
   Vaultline dashboard — gated by the session token set during
   login on index.html. No token, no page.
   ========================================================= */

const dashGuard = document.getElementById('dashGuard');
const guardMessage = document.getElementById('guardMessage');
const dashScene = document.getElementById('dashScene');

function denyAccess() {
  guardMessage.textContent = 'No active session — redirecting to sign in…';
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 900);
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function renderDashboard(session) {
  const initials = session.username.slice(0, 2).toUpperCase();
  const persisted = Boolean(localStorage.getItem('vaultline_session'));

  document.getElementById('dashAvatar').textContent = initials;
  document.getElementById('dashUsername').textContent = session.username;
  document.getElementById('dashGreeting').textContent = `Welcome back, ${session.username}`;
  document.getElementById('cardUsername').textContent = session.username;
  document.getElementById('cardLoginTime').textContent = formatTime(session.loginAt);
  document.getElementById('cardToken').textContent = session.token.slice(0, 18) + '…';
  document.getElementById('cardScope').textContent = persisted ? 'This browser (remembered)' : 'This tab only';

  dashGuard.hidden = true;
  dashScene.hidden = false;
}

(function init() {
  const session = vaultGetSession();
  if (!session) {
    denyAccess();
    return;
  }
  // Brief delay only so the check doesn't feel like a content flash —
  // short enough to feel instant.
  setTimeout(() => renderDashboard(session), 120);
})();

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  vaultEndSession();
  window.location.href = 'index.html';
});

// If another tab signs out and shares localStorage, bounce this one too.
window.addEventListener('storage', () => {
  if (!vaultGetSession()) {
    window.location.href = 'index.html';
  }
});
