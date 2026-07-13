/* =========================================================
   Vaultline — create account page logic
   ========================================================= */

const registerForm = document.getElementById('registerForm');
const banner = document.getElementById('banner');
const registerSubmit = document.getElementById('registerSubmit');
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

/* strength meter */
const registerPassword = document.getElementById('registerPassword');
const strengthMeter = document.querySelector('.strength-meter');
const strengthLabel = document.getElementById('strengthLabel');
const defaultStrengthText = strengthLabel.textContent;

function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(1, Math.min(score, 4));
}
const strengthWords = ['', 'Weak', 'Fair', 'Good', 'Strong'];
registerPassword.addEventListener('input', () => {
  const s = registerPassword.value ? scorePassword(registerPassword.value) : 0;
  strengthMeter.className = 'strength-meter' + (s ? ` s${s}` : '');
  strengthLabel.textContent = s ? `Password strength: ${strengthWords[s]}` : defaultStrengthText;
});

/* register submit */
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors(registerForm);
  hideBanner();

  const usernameEl = document.getElementById('registerUsername');
  const passwordEl = document.getElementById('registerPassword');
  const confirmEl = document.getElementById('registerConfirm');

  const username = usernameEl.value.trim();
  const password = passwordEl.value;
  const confirm = confirmEl.value;

  let hasError = false;
  if (username.length < 3) {
    setFieldError('registerUsername', 'Use at least 3 characters.');
    hasError = true;
  } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    setFieldError('registerUsername', 'Letters, numbers, "_" and "." only.');
    hasError = true;
  }
  if (password.length < 8) {
    setFieldError('registerPassword', 'Use at least 8 characters.');
    hasError = true;
  }
  if (confirm !== password) {
    setFieldError('registerConfirm', 'Passwords do not match.');
    hasError = true;
  }

  const users = vaultLoadUsers();
  const usernameKey = username.toLowerCase();
  if (!hasError && users[usernameKey]) {
    setFieldError('registerUsername', 'That username is already taken.');
    hasError = true;
  }

  if (hasError) {
    shakeCard();
    return;
  }

  registerSubmit.disabled = true;
  registerSubmit.classList.add('is-loading');

  const salt = vaultRandomHex();
  const hash = await vaultHashPassword(password, salt);
  users[usernameKey] = { displayName: username, salt, hash, createdAt: Date.now() };
  vaultSaveUsers(users);

  // Small delay so the loading state reads as real work.
  await new Promise(r => setTimeout(r, 350));

  registerSubmit.disabled = false;
  registerSubmit.classList.remove('is-loading');

  showBanner('Account created. Redirecting you to sign in…', 'success');

  setTimeout(() => {
    window.location.href = `index.html?username=${encodeURIComponent(username)}`;
  }, 700);
});
