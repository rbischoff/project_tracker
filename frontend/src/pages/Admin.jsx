import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useConfig } from '../context.jsx';
import { Card, Btn, Input, Select } from '../components/UI.jsx';
import { Users, Settings, Plus, Trash2, Edit2, Check, X, Shield, User, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.adminGetUsers().then(u => { setUsers(u); setLoading(false); });
  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) { setError('All fields required'); return; }
    setSaving(true); setError('');
    try {
      await api.adminCreateUser(newUser);
      setShowNew(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      load();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try { await api.adminUpdateUser(id, editData); setEditingId(null); load(); }
    catch (e) { setError(e.message); }
    setSaving(false);
  };

  const toggleActive = async (u) => {
    await api.adminUpdateUser(u.id, { is_active: u.is_active ? 0 : 1 });
    load();
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? Their projects will remain.')) return;
    await api.adminDeleteUser(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{users.length} user{users.length !== 1 ? 's' : ''}</p>
        <Btn variant="amber" size="sm" onClick={() => { setShowNew(true); setError(''); }} icon={<Plus size={14} />}>Add User</Btn>
      </div>

      {error && (
        <div style={{ background: 'var(--red-pale)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {/* New User Form */}
      {showNew && (
        <Card style={{ padding: '20px 24px', marginBottom: 16, border: '1px solid var(--amber)', background: 'var(--amber-pale)' }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New User</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input label="Username" value={newUser.username} onChange={e => setNewUser(n => ({ ...n, username: e.target.value }))} placeholder="johndoe" />
            <Input label="Email" type="email" value={newUser.email} onChange={e => setNewUser(n => ({ ...n, email: e.target.value }))} placeholder="john@example.com" />
            <Input label="Password" type="password" value={newUser.password} onChange={e => setNewUser(n => ({ ...n, password: e.target.value }))} placeholder="••••••••" />
            <Select label="Role" value={newUser.role} onChange={e => setNewUser(n => ({ ...n, role: e.target.value }))}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" size="sm" onClick={() => setShowNew(false)}>Cancel</Btn>
            <Btn variant="amber" size="sm" onClick={createUser} disabled={saving} icon={<Check size={13} />}>{saving ? 'Creating…' : 'Create'}</Btn>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}><div style={{ height: 120 }} className="skeleton" /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--cream)' }}>
              <tr>
                {['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: u.role === 'admin' ? 'var(--amber-pale)' : 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.role === 'admin' ? <Shield size={14} color="var(--amber)" /> : <User size={14} color="var(--blue)" />}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--slate)' }}>
                    {editingId === u.id ? (
                      <input value={editData.email || ''} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                        style={{ padding: '4px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 12, width: '100%' }} />
                    ) : u.email}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === u.id ? (
                      <select value={editData.role || u.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}
                        style={{ padding: '4px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 12 }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 500, background: u.role === 'admin' ? 'var(--amber-pale)' : 'var(--blue-pale)', color: u.role === 'admin' ? '#8B5A1A' : 'var(--blue)' }}>{u.role}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: u.is_active ? 'var(--green)' : 'var(--muted)' }}>
                      {u.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      <span style={{ fontSize: 12 }}>{u.is_active ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === u.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant="amber" size="sm" onClick={() => saveEdit(u.id)} disabled={saving} icon={<Check size={12} />}>Save</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => setEditingId(null)} icon={<X size={12} />}>Cancel</Btn>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant="ghost" size="sm" onClick={() => { setEditingId(u.id); setEditData({ email: u.email, role: u.role }); }} icon={<Edit2 size={12} />}>Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={() => deleteUser(u.id)} icon={<Trash2 size={12} />}>Delete</Btn>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Config ──────────────────────────────────────────────────────────────

const TYPE_INFO = {
  priority: { label: 'Priorities', desc: 'Urgency levels for projects', color: 'var(--amber)', hasColors: true },
  status:   { label: 'Statuses',   desc: 'Project workflow states',     color: 'var(--blue)',  hasColors: true },
  category: { label: 'Categories', desc: 'Project room or area types',  color: 'var(--green)', hasColors: false },
};

function ConfigSection({ type, items, onRefresh }) {
  const info = TYPE_INFO[type];
  const [showNew, setShowNew] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', key: '', color: '#5A5A5A', bg_color: '#F0EDEA' });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const autoKey = (label) => label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const create = async () => {
    if (!newItem.label.trim()) { setError('Label required'); return; }
    setSaving(true); setError('');
    try {
      const key = newItem.key || autoKey(newItem.label);
      await api.adminCreateConfig({ type, key, label: newItem.label, color: newItem.color || null, bg_color: newItem.bg_color || null, sort_order: items.length });
      setShowNew(false);
      setNewItem({ label: '', key: '', color: '#5A5A5A', bg_color: '#F0EDEA' });
      onRefresh();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const save = async (id) => {
    setSaving(true);
    try { await api.adminUpdateConfig(id, editData); setEditId(null); onRefresh(); }
    catch (e) { setError(e.message); }
    setSaving(false);
  };

  const toggle = async (item) => {
    await api.adminUpdateConfig(item.id, { is_active: item.is_active ? 0 : 1 });
    onRefresh();
  };

  const del = async (id) => {
    if (!confirm('Delete this item? Projects using it will keep the value but it won\'t appear in new dropdowns.')) return;
    await api.adminDeleteConfig(id);
    onRefresh();
  };

  return (
    <Card style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: info.color }} />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{info.label}</h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{info.desc}</p>
        </div>
        <Btn variant="secondary" size="sm" onClick={() => { setShowNew(true); setError(''); }} icon={<Plus size={13} />}>Add</Btn>
      </div>

      {error && <div style={{ background: 'var(--red-pale)', color: 'var(--red)', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{error}</div>}

      {showNew && (
        <div style={{ background: 'var(--cream)', border: '1px dashed var(--border-dark)', borderRadius: 10, padding: '16px', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: info.hasColors ? '1fr 1fr 80px 80px' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Input label="Label" value={newItem.label}
              onChange={e => setNewItem(n => ({ ...n, label: e.target.value, key: autoKey(e.target.value) }))}
              placeholder="e.g. Urgent" />
            <Input label="Key (auto)" value={newItem.key}
              onChange={e => setNewItem(n => ({ ...n, key: e.target.value }))}
              placeholder="e.g. urgent" />
            {info.hasColors && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500 }}>Text Color</label>
                  <input type="color" value={newItem.color} onChange={e => setNewItem(n => ({ ...n, color: e.target.value }))}
                    style={{ width: '100%', height: 36, border: '1px solid var(--border-dark)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500 }}>BG Color</label>
                  <input type="color" value={newItem.bg_color} onChange={e => setNewItem(n => ({ ...n, bg_color: e.target.value }))}
                    style={{ width: '100%', height: 36, border: '1px solid var(--border-dark)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" size="sm" onClick={() => setShowNew(false)}>Cancel</Btn>
            <Btn variant="amber" size="sm" onClick={create} disabled={saving}>{saving ? 'Saving…' : 'Add'}</Btn>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No items yet.</p>}
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8,
            background: item.is_active ? 'var(--warm-white)' : 'var(--cream)',
            border: '1px solid var(--border)', opacity: item.is_active ? 1 : 0.55,
          }}>
            {info.hasColors && (
              <div style={{ width: 22, height: 22, borderRadius: 5, background: item.bg_color || '#F0EDEA', border: `2px solid ${item.color || '#888'}`, flexShrink: 0 }} />
            )}

            {editId === item.id ? (
              <>
                <input value={editData.label || ''} onChange={e => setEditData(d => ({ ...d, label: e.target.value }))}
                  style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 13 }} />
                {info.hasColors && (
                  <>
                    <input type="color" value={editData.color || '#888'} onChange={e => setEditData(d => ({ ...d, color: e.target.value }))}
                      style={{ width: 36, height: 30, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
                    <input type="color" value={editData.bg_color || '#FFF'} onChange={e => setEditData(d => ({ ...d, bg_color: e.target.value }))}
                      style={{ width: 36, height: 30, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
                  </>
                )}
                <Btn variant="amber" size="sm" onClick={() => save(item.id)} disabled={saving} icon={<Check size={12} />}>Save</Btn>
                <Btn variant="ghost" size="sm" onClick={() => setEditId(null)} icon={<X size={12} />} />
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono' }}>{item.key}</span>
                <button onClick={() => toggle(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_active ? 'var(--green)' : 'var(--muted)', padding: 4 }}>
                  {item.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => { setEditId(item.id); setEditData({ label: item.label, color: item.color, bg_color: item.bg_color }); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 4 }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => del(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ConfigTab({ onRefresh: parentRefresh }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.adminGetConfig().then(d => { setItems(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = () => { load(); if (parentRefresh) parentRefresh(); };

  const byType = (type) => items.filter(i => i.type === type);

  if (loading) return <div style={{ height: 200 }} className="skeleton" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--amber-pale)', border: '1px solid #E8C98A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#7A5010' }}>
        <strong>Note:</strong> Changes to priorities and statuses affect how badges are colored across the app. Disabling an item hides it from dropdowns but preserves it on existing projects.
      </div>
      {(['priority', 'status', 'category']).map(type => (
        <ConfigSection key={type} type={type} items={byType(type)} onRefresh={handleRefresh} />
      ))}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function Admin() {
  const { loadConfig } = useConfig();
  const [tab, setTab] = useState('config');

  const tabs = [
    { key: 'config', label: 'Configuration', icon: Settings },
    { key: 'users',  label: 'Users',          icon: Users },
  ];

  return (
    <div style={{ maxWidth: 960, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>System</p>
        <h1 style={{ fontSize: 36 }}>Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--warm-white)', borderRadius: 10, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
            borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: tab === key ? 'var(--charcoal)' : 'transparent',
            color: tab === key ? 'white' : 'var(--slate)',
            transition: 'all 0.15s', fontFamily: 'DM Sans',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'config' && <ConfigTab onRefresh={loadConfig} />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}
