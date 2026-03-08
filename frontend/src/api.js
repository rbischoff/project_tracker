const BASE = '/api';

function getToken() { return localStorage.getItem('hit_token'); }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (u, p) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  getConfig: () => request('/config'),
  getProjects: (f = {}) => {
    const p = new URLSearchParams();
    if (f.status) p.set('status', f.status);
    if (f.priority) p.set('priority', f.priority);
    if (f.category) p.set('category', f.category);
    return request(`/projects${p.toString() ? '?' + p : ''}`);
  },
  getProject: (id) => request(`/projects/${id}`),
  createProject: (d) => request('/projects', { method: 'POST', body: JSON.stringify(d) }),
  updateProject: (id, d) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  getStats: () => request('/stats'),
  adminGetConfig: () => request('/admin/config'),
  adminCreateConfig: (d) => request('/admin/config', { method: 'POST', body: JSON.stringify(d) }),
  adminUpdateConfig: (id, d) => request(`/admin/config/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  adminDeleteConfig: (id) => request(`/admin/config/${id}`, { method: 'DELETE' }),
  adminGetUsers: () => request('/admin/users'),
  adminCreateUser: (d) => request('/admin/users', { method: 'POST', body: JSON.stringify(d) }),
  adminUpdateUser: (id, d) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
};
