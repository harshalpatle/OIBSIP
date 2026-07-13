/* =========================================================
   Vaultline — sign-in page logic
   ========================================================= */

const loginForm = document.getElementById('loginForm');
const banner = document.getElementById('banner');
const loginSubmit = document.getElementById('loginSubmit');
const card = document.querySelector('.auth-card');

function showBanner(message, kind) {
  banner.innerHTML = '';
  const icon = document.createElement('span');
  icon.innerHTML = kind === 'success'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
  const text = document.createElement('span');
  text.textContent = message;
  banner.append(icon, text);
  banner.hidden = false;
  banner.className = 'banner ' + (kind === 'success' ? 'is-success' : 'is-error');
}
function hideBanner() {
  banner.hidden = true;
  banner.className = 'banner';
}

function setFieldError(inputId, message) {
  const errEl = document.querySelector(`.field-error[data-for="${inputId}"]`);
  const inputEl = document.getElementById(inputId);
  if (errEl) errEl.textContent = message || '';
  if (inputEl) inputEl.classList.toggle('is-invalid', Boolean(message));
}
function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => (el.textContent = ''));
  form.querySelectorAll('input').forEach(el => el.classList.remove('is-invalid'));
}
function shakeCard() {
  card.classList.remove('is-shaking');
  void card.offsetWidth;
  card.classList.add('is-shaking');
}

/* password peek */
document.querySelectorAll('.peek').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const isPassword = target.type === 'password';
    target.type = isPassword ? 'text' : 'password';
    btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    btn.style.color = isPassword ? 'var(--accent)' : '';
  });
});

/* forgot password (no backend — demo notice) */
document.getElementById('forgotLink').addEventListener('click', () => {
  hideBanner();
  showBanner('This is a local demo, so there\u2019s no email to reset from. Create a new account instead.', 'error');
});

/* login submit */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors(loginForm);
  hideBanner();

  const usernameEl = document.getElementById('loginUsername');
  const passwordEl = document.getElementById('loginPassword');
  const remember = document.getElementById('rememberMe').checked;
  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  let hasError = false;
  if (!username) { setFieldError('loginUsername', 'Enter your username.'); hasError = true; }
  if (!password) { setFieldError('loginPassword', 'Enter your password.'); hasError = true; }
  if (hasError) { shakeCard(); return; }

  loginSubmit.disabled = true;
  loginSubmit.classList.add('is-loading');

  const users = vaultLoadUsers();
  const record = users[username.toLowerCase()];

  // Always hash something so a wrong username and a wrong password
  // take roughly the same amount of time.
  const saltForCheck = record ? record.salt : 'no-such-user-salt';
  const attemptHash = await vaultHashPassword(password, saltForCheck);

  // Small delay so the loading state reads as real work, matching
  // the feel of an app checking credentials against a server.
  await new Promise(r => setTimeout(r, 350));

  loginSubmit.disabled = false;
  loginSubmit.classList.remove('is-loading');

  if (!record || attemptHash !== record.hash) {
    showBanner('Incorrect username or password.', 'error');
    shakeCard();
    return;
  }

  vaultStartSession(record.displayName, remember);
  showBanner(`Welcome back, ${record.displayName}. Redirecting…`, 'success');

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 500);
});

/* prefill username after a successful registration redirect */
(function prefillFromRegistration() {
  const params = new URLSearchParams(window.location.search);
  const username = params.get('username');
  if (username) {
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').focus();
    showBanner('Account created. Sign in to continue.', 'success');
  }
})();

/* if already signed in, skip straight to the dashboard prompt */
(function checkExistingSession() {
  const session = vaultGetSession();
  if (session) {
    showBanner(`You're already signed in as ${session.username}.`, 'success');
    const goBtn = document.createElement('a');
    goBtn.href = 'dashboard.html';
    goBtn.textContent = 'Go to secured page →';
    goBtn.style.display = 'block';
    goBtn.style.marginTop = '2px';
    goBtn.style.textAlign = 'center';
    goBtn.style.fontSize = '14px';
    goBtn.style.fontWeight = '600';
    goBtn.style.color = 'var(--accent)';
    goBtn.style.textDecoration = 'none';
    banner.after(goBtn);
  }
})();
