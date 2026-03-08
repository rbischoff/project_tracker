import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConfigContext } from './configContext.js';

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hit_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.ok) return r.json(); throw new Error(); })
        .then(u => setUser(u))
        .catch(() => { localStorage.removeItem('hit_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Login failed'); }
    const data = await res.json();
    localStorage.setItem('hit_token', data.token);
    setToken(data.token); setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem('hit_token'); setToken(null); setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// ─── Config Context ───────────────────────────────────────────────────────────
export function ConfigProvider({ children }) {
  const { token } = useAuth();
  const [config, setConfig] = useState({ priorities: [], statuses: [], categories: [] });
  const [configLoaded, setConfigLoaded] = useState(false);

  const loadConfig = useCallback(() => {
    if (!token) return;
    fetch('/api/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(c => { setConfig(c); setConfigLoaded(true); }).catch(() => {});
  }, [token]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const priorities = config.priorities.map(p => p.key);
  const statuses = config.statuses.map(s => s.key);
  const categories = config.categories.map(c => c.key);

  const priorityConfig = {};
  config.priorities.forEach(p => {
    priorityConfig[p.key] = { label: p.label, color: p.color || '#5A5A5A', bg: p.bg_color || '#F0EDEA', dot: p.color || '#5A5A5A' };
  });

  const statusConfig = {};
  config.statuses.forEach(s => {
    statusConfig[s.key] = { label: s.label, color: s.color || '#5A5A5A', bg: s.bg_color || '#F0EDEA' };
  });

  const categoryLabels = {};
  config.categories.forEach(c => { categoryLabels[c.key] = c.label; });

  const value = { config, configLoaded, loadConfig, priorities, statuses, categories, priorityConfig, statusConfig, categoryLabels };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);
