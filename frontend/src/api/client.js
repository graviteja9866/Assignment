const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

function setTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Session expired');
  }

  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.accessToken;
}

async function apiRequest(path, options = {}) {
  const { skipAuthRetry = false, ...fetchOptions } = options;
  const { accessToken } = getTokens();
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (accessToken && !skipAuthRetry) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && accessToken && !skipAuthRetry) {
    const newToken = await refreshAccessToken();
    headers.Authorization = `Bearer ${newToken}`;
    res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
  }

  const data =
    res.status === 204 ? {} : await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const auth = {
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      skipAuthRetry: true,
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  logout: async () => {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    clearTokens();
  },
  getUser: () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
};

export const tasks = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/tasks?${query}`);
  },
  transition: (id, status) =>
    apiRequest(`/tasks/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  create: (body) =>
    apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const projects = {
  list: () => apiRequest('/projects'),
};

export const users = {
  list: () => apiRequest('/users'),
  create: (body) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
};
