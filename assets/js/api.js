/* ================================================================
   RUXOVA PERFUMES — API Helper
   Central fetch wrapper with JWT auth + base URL
   ================================================================ */

const API_BASE = 'https://ruxovabackend.onrender.com/api';

/**
 * Get stored auth token
 */
function getToken() {
  return localStorage.getItem('ruxova_token');
}

/**
 * Store auth data after login/register
 */
function setAuth(token, user) {
  localStorage.setItem('ruxova_token', token);
  localStorage.setItem('ruxova_user', JSON.stringify(user));
}

/**
 * Clear auth data on logout
 */
function clearAuth() {
  localStorage.removeItem('ruxova_token');
  localStorage.removeItem('ruxova_user');
}

/**
 * Get current user from localStorage
 */
function getUser() {
  const u = localStorage.getItem('ruxova_user');
  return u ? JSON.parse(u) : null;
}

/**
 * Core API request helper
 * @param {string} endpoint - e.g. '/products'
 * @param {object} options  - fetch options
 * @param {boolean} isFormData - if true, don't set Content-Type (let browser set multipart)
 */
async function apiRequest(endpoint, options = {}, isFormData = false) {
  const token = getToken();

  const headers = { ...options.headers };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    credentials: 'include',
    ...options,
    headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ── Convenience Methods ──────────────────────────────────────────

const api = {
  get:  (endpoint) => apiRequest(endpoint, { method: 'GET' }),

  post: (endpoint, body, isFormData = false) => apiRequest(
    endpoint,
    { method: 'POST', body: isFormData ? body : JSON.stringify(body) },
    isFormData
  ),

  put: (endpoint, body, isFormData = false) => apiRequest(
    endpoint,
    { method: 'PUT', body: isFormData ? body : JSON.stringify(body) },
    isFormData
  ),

  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

// ── Exports (global for HTML pages) ─────────────────────────────
window.api      = api;
window.getToken = getToken;
window.setAuth  = setAuth;
window.clearAuth = clearAuth;
window.getUser  = getUser;
window.API_BASE = API_BASE;
