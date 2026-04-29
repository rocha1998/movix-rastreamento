const tokenStorageKey = 'rastreamento_admin_token';
const adminStorageKey = 'rastreamento_admin_user';

function getToken() {
  return localStorage.getItem(tokenStorageKey);
}

function setSession(token, admin) {
  localStorage.setItem(tokenStorageKey, token);
  localStorage.setItem(adminStorageKey, JSON.stringify(admin));
}

function clearSession() {
  localStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(adminStorageKey);
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/admin/index.html';
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
    if (!window.location.pathname.endsWith('/index.html')) {
      window.location.href = '/admin/index.html';
    }
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(body?.message || 'Erro ao processar a solicitacao.');
    error.details = body?.errors || [];
    throw error;
  }

  return body;
}
