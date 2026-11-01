
// ======================================
// API HELPER
// ======================================

async function api(path, options = {}) {
  const res = await fetch(path, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

// ======================================
// DISPLAY MESSAGE
// ======================================

function showMessage(el, text, type) {
  if (!el) return;

  el.textContent = text;
  el.className = 'msg ' + (type || '');
}

// ======================================
// LOGOUT
// ======================================

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  } catch (err) {
    alert(err.message);
  }
}

// ======================================
// LOGIN AND REGISTRATION
// ======================================

function bindAuthForm(formId, endpoint) {
  const form = document.getElementById(formId);
  const msg = document.getElementById('msg');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');

    if (btn) btn.disabled = true;

    showMessage(msg, '');

    try {
      const body = Object.fromEntries(
        new FormData(form).entries()
      );

      await api(endpoint, {
        method: 'POST',
        body
      });

      window.location.href = '/dashboard';

    } catch (err) {
      showMessage(msg, err.message, 'error');

      if (btn) btn.disabled = false;
    }
  });
}

// ======================================
// DASHBOARD
// ======================================

async function loadDashboard() {
  const hello = document.getElementById('hello');

  if (!hello) return;

  try {
    const { user } = await api('/api/auth/me');

    hello.textContent = 'Welcome, ' + user.name;

    document.getElementById('email').textContent = user.email;
    document.getElementById('role').textContent = user.role;

    if (user.role === 'admin') {
      document.getElementById('adminLink').hidden = false;
    }

  } catch (err) {
    window.location.href = '/login';
  }
}

// ======================================
// ADMIN PANEL
// ======================================

async function loadAdminUsers() {
  const tbody = document.getElementById('rows');

  if (!tbody) return;

  try {
    const { users } = await api('/api/auth/users');

    tbody.replaceChildren();

    users.forEach((user) => {
      const tr = document.createElement('tr');

      const values = [
        user.name,
        user.email,
        user.role,
        new Date(user.createdAt).toLocaleDateString()
      ];

      values.forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

  } catch (err) {
    window.location.href = '/dashboard';
  }
}

// ======================================
// PAGE INITIALIZATION
// ======================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const page = window.location.pathname;

  // Login page
  if (form && page === '/login') {
    bindAuthForm('form', '/api/auth/login');
  }

  // Registration page
  if (form && page === '/register') {
    bindAuthForm('form', '/api/auth/register');
  }

  // Dashboard page
  if (document.getElementById('hello')) {
    loadDashboard();
  }

  // Admin panel
  if (document.getElementById('rows')) {
    loadAdminUsers();
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
