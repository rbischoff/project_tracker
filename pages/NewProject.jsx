import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Card, Btn, Input, Select, Textarea } from '../components/UI.jsx';
import { PRIORITIES, STATUSES, CATEGORIES } from '../components/UI.jsx';
import { ArrowLeft, Plus, X, PlusCircle } from 'lucide-react';

const DEFAULT_FORM = {
  name: '',
  description: '',
  priority: 'medium',
  status: 'planned',
  category: 'general',
  estimated_cost: '',
  actual_cost: 0,
  progress: 0,
  start_date: '',
  target_date: '',
  notes: '',
  materials: [],
};

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addMaterial = () => setForm(f => ({ ...f, materials: [...f.materials, { name: '', quantity: '1', cost: 0, purchased: false }] }));
  const updateMaterial = (i, k, v) => setForm(f => { const mats = [...f.materials]; mats[i] = { ...mats[i], [k]: v }; return { ...f, materials: mats }; });
  const deleteMaterial = (i) => setForm(f => ({ ...f, materials: f.materials.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const project = await api.createProject({
        ...form,
        estimated_cost: parseFloat(form.estimated_cost) || 0,
        actual_cost: parseFloat(form.actual_cost) || 0,
        progress: parseInt(form.progress) || 0,
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('/projects')} icon={<ArrowLeft size={15} />}>Back</Btn>
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Add New</p>
        <h1 style={{ fontSize: 36, color: 'var(--charcoal)' }}>New Project</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic Info */}
        <Card style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Basic Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Project Name *" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Kitchen Renovation" error={errors.name} />
            <Textarea label="Description" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Describe the project scope..." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Select label="Priority" value={form.priority} onChange={e => setF('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </Select>
              <Select label="Status" value={form.status} onChange={e => setF('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </Select>
              <Select label="Category" value={form.category} onChange={e => setF('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </Select>
            </div>
          </div>
        </Card>

        {/* Cost & Schedule */}
        <Card style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Cost & Schedule</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Estimated Cost ($)" type="number" min="0" value={form.estimated_cost} onChange={e => setF('estimated_cost', e.target.value)} placeholder="0" />
              <Input label="Actual Cost ($)" type="number" min="0" value={form.actual_cost} onChange={e => setF('actual_cost', e.target.value)} placeholder="0" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Start Date" type="date" value={form.start_date} onChange={e => setF('start_date', e.target.value)} />
              <Input label="Target Completion" type="date" value={form.target_date} onChange={e => setF('target_date', e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)' }}>Initial Progress: {form.progress}%</label>
              <input type="range" min={0} max={100} value={form.progress} onChange={e => setF('progress', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--amber)' }} />
            </div>
          </div>
        </Card>

        {/* Materials */}
        <Card style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Materials</h2>
            <Btn variant="secondary" size="sm" onClick={addMaterial} icon={<Plus size={13} />}>Add Material</Btn>
          </div>
          {form.materials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>
              <p style={{ marginBottom: 8, fontSize: 14 }}>No materials added yet</p>
              <Btn variant="ghost" size="sm" onClick={addMaterial} icon={<PlusCircle size={14} />}>Add first material</Btn>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, padding: '0 0 8px', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <span style={{ width: 24 }} />
                <span style={{ flex: 2 }}>Name</span>
                <span style={{ flex: 1 }}>Quantity</span>
                <span style={{ flex: 1 }}>Cost ($)</span>
                <span style={{ width: 30 }} />
              </div>
              {form.materials.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'center' }}>
                  <input type="checkbox" checked={m.purchased} onChange={e => updateMaterial(i, 'purchased', e.target.checked)} title="Purchased" style={{ width: 16, height: 16 }} />
                  <input value={m.name} onChange={e => updateMaterial(i, 'name', e.target.value)} placeholder="e.g. Ceramic tiles"
                    style={{ flex: 2, padding: '6px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 13 }} />
                  <input value={m.quantity} onChange={e => updateMaterial(i, 'quantity', e.target.value)} placeholder="e.g. 20 sq ft"
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 13 }} />
                  <input type="number" value={m.cost} onChange={e => updateMaterial(i, 'cost', parseFloat(e.target.value) || 0)} placeholder="0"
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 13 }} />
                  <button onClick={() => deleteMaterial(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                    <X size={15} />
                  </button>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: '8px 0 0', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--slate)', textAlign: 'right' }}>
                Total: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(form.materials.reduce((s, m) => s + (m.cost || 0), 0))}</strong>
              </div>
            </>
          )}
        </Card>

        {/* Notes */}
        <Card style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Notes</h2>
          <Textarea value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Additional notes, contractor info, links to plans, etc." style={{ minHeight: 120 }} />
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 40 }}>
          <Btn variant="secondary" onClick={() => navigate('/projects')}>Cancel</Btn>
          <Btn variant="amber" onClick={submit} disabled={saving} icon={<PlusCircle size={16} />}>{saving ? 'Creating...' : 'Create Project'}</Btn>
        </div>
      </div>
    </div>
  );
}
