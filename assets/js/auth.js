/* ================================================================
   RUXOVA PERFUMES — Auth Pages JS (Login + Register)
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initMobileMenu();
  hidePageLoader();

  // Redirect if already logged in
  if (getUser() && getToken()) {
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    window.location.href = redirect || 'index.html';
    return;
  }

  // Init whichever form is on the page
  initLoginForm();
  initRegisterForm();
});

// ── Login ─────────────────────────────────────────────────────────

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    setButtonLoading(btn, true, 'Signing In...');
    clearErrors();

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showFieldError('login-email', 'Email and password are required');
      setButtonLoading(btn, false);
      return;
    }

    try {
      const { token, user } = await api.post('/auth/login', { email, password });
      setAuth(token, user);
      showToast(`Welcome back, ${user.name}! 🌹`, 'success');

      const redirect = new URLSearchParams(window.location.search).get('redirect');
      setTimeout(() => {
        window.location.href = redirect || (user.role === 'admin' ? 'http://localhost:5173' : 'index.html');
      }, 800);
    } catch (err) {
      showToast(err.message, 'error');
      setButtonLoading(btn, false);
    }
  });

  // Toggle password visibility
  document.getElementById('toggle-login-pass')?.addEventListener('click', () => {
    togglePasswordVisibility('login-password', 'toggle-login-pass');
  });
}

// ── Register ──────────────────────────────────────────────────────

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    setButtonLoading(btn, true, 'Creating Account...');
    clearErrors();

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const phone    = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    if (!name || !email || !password) {
      showToast('Please fill all required fields', 'error');
      setButtonLoading(btn, false);
      return;
    }

    if (password !== confirm) {
      showFieldError('reg-confirm', 'Passwords do not match');
      setButtonLoading(btn, false);
      return;
    }

    if (password.length < 6) {
      showFieldError('reg-password', 'Password must be at least 6 characters');
      setButtonLoading(btn, false);
      return;
    }

    try {
      const { token, user } = await api.post('/auth/register', { name, email, password, phone });
      setAuth(token, user);
      showToast(`Welcome to RUXOVA, ${user.name}! 🌹`, 'success');

      setTimeout(() => window.location.href = 'index.html', 800);
    } catch (err) {
      showToast(err.message, 'error');
      setButtonLoading(btn, false);
    }
  });

  document.getElementById('toggle-reg-pass')?.addEventListener('click', () => {
    togglePasswordVisibility('reg-password', 'toggle-reg-pass');
  });
}

// ── Helpers ───────────────────────────────────────────────────────

function togglePasswordVisibility(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (!input || !btn) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.style.borderColor = 'var(--error)';
  let err = field.parentElement.querySelector('.field-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'field-error';
    err.style.cssText = 'color:var(--error);font-size:12px;margin-top:4px;';
    field.parentElement.appendChild(err);
  }
  err.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('.form-control').forEach(el => {
    el.style.borderColor = '';
  });
}
