import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Card, Badge, ProgressBar, formatCurrency, formatDate, Btn, Input, Select, Textarea } from '../components/UI.jsx';
import { PRIORITIES, STATUSES, CATEGORIES } from '../components/UI.jsx';
import { ArrowLeft, Edit2, Trash2, Check, X, Plus, Package, DollarSign, Calendar, Wrench } from 'lucide-react';

function MaterialRow({ mat, index, editing, onChange, onDelete }) {
  if (!editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${mat.purchased ? 'var(--green)' : 'var(--border-dark)'}`, background: mat.purchased ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {mat.purchased && <Check size={11} color="white" />}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: mat.purchased ? 'var(--muted)' : 'var(--charcoal)', textDecoration: mat.purchased ? 'line-through' : 'none' }}>{mat.name}</span>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{mat.quantity}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--charcoal)', minWidth: 60, textAlign: 'right' }}>{formatCurrency(mat.cost)}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'center' }}>
      <input type="checkbox" checked={mat.purchased} onChange={e => onChange(index, 'purchased', e.target.checked)} />
      <input value={mat.name} onChange={e => onChange(index, 'name', e.target.value)} placeholder="Material name"
        style={{ flex: 2, padding: '5px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 13 }} />
      <input value={mat.quantity} onChange={e => onChange(index, 'quantity', e.target.value)} placeholder="Qty"
        style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 13 }} />
      <input type="number" value={mat.cost} onChange={e => onChange(index, 'cost', parseFloat(e.target.value) || 0)} placeholder="Cost"
        style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border-dark)', borderRadius: 6, fontSize: 13 }} />
      <button onClick={() => onDelete(index)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }}>
        <X size={16} />
      </button>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getProject(id).then(p => { setProject(p); setForm(p); setLoading(false); });
  }, [id]);

  const save = async () => {
    setSaving(true);
    const updated = await api.updateProject(id, form);
    setProject(updated);
    setForm(updated);
    setSaving(false);
    setEditing(false);
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(true);
    await api.deleteProject(id);
    navigate('/projects');
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addMaterial = () => setForm(f => ({ ...f, materials: [...(f.materials || []), { name: '', quantity: '1', cost: 0, purchased: false }] }));
  const updateMaterial = (i, k, v) => setForm(f => {
    const mats = [...f.materials];
    mats[i] = { ...mats[i], [k]: v };
    return { ...f, materials: mats };
  });
  const deleteMaterial = (i) => setForm(f => ({ ...f, materials: f.materials.filter((_, idx) => idx !== i) }));

  const toggleMaterialPurchased = async (i) => {
    const mats = [...project.materials];
    mats[i] = { ...mats[i], purchased: !mats[i].purchased };
    const updated = await api.updateProject(id, { materials: mats });
    setProject(updated);
    setForm(updated);
  };

  if (loading) return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ height: 30, width: 120, marginBottom: 24 }} className="skeleton" />
      <div style={{ height: 200 }} className="skeleton" />
    </div>
  );

  if (!project) return <div>Project not found</div>;

  const totalMaterialCost = (project.materials || []).reduce((s, m) => s + (m.cost || 0), 0);
  const purchasedCost = (project.materials || []).filter(m => m.purchased).reduce((s, m) => s + (m.cost || 0), 0);

  return (
    <div style={{ maxWidth: 860, animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('/projects')} icon={<ArrowLeft size={15} />}>Back</Btn>
        <div style={{ flex: 1 }} />
        {editing ? (
          <>
            <Btn variant="secondary" size="sm" onClick={() => { setEditing(false); setForm(project); }} icon={<X size={14} />}>Cancel</Btn>
            <Btn variant="amber" size="sm" onClick={save} disabled={saving} icon={<Check size={14} />}>{saving ? 'Saving...' : 'Save'}</Btn>
          </>
        ) : (
          <>
            <Btn variant="secondary" size="sm" onClick={() => setEditing(true)} icon={<Edit2 size={14} />}>Edit</Btn>
            <Btn variant="danger" size="sm" onClick={deleteProject} disabled={deleting} icon={<Trash2 size={14} />}>{deleting ? 'Deleting...' : 'Delete'}</Btn>
          </>
        )}
      </div>

      {/* Main Card */}
      <Card style={{ padding: '28px 32px', marginBottom: 20 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Project Name" value={form.name} onChange={e => setF('name', e.target.value)} />
            <Textarea label="Description" value={form.description || ''} onChange={e => setF('description', e.target.value)} />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Estimated Cost ($)" type="number" value={form.estimated_cost} onChange={e => setF('estimated_cost', parseFloat(e.target.value) || 0)} />
              <Input label="Actual Cost ($)" type="number" value={form.actual_cost} onChange={e => setF('actual_cost', parseFloat(e.target.value) || 0)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Progress: {form.progress}%</label>
              <input type="range" min={0} max={100} value={form.progress} onChange={e => setF('progress', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--amber)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Start Date" type="date" value={form.start_date || ''} onChange={e => setF('start_date', e.target.value)} />
              <Input label="Target Date" type="date" value={form.target_date || ''} onChange={e => setF('target_date', e.target.value)} />
            </div>
            <Textarea label="Notes" value={form.notes || ''} onChange={e => setF('notes', e.target.value)} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 30, marginBottom: 6 }}>{project.name}</h1>
                <p style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'capitalize' }}>{project.category.replace('_', ' ')}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge type="priority" value={project.priority} size="md" />
                <Badge type="status" value={project.status} size="md" />
              </div>
            </div>
            {project.description && <p style={{ color: 'var(--slate)', lineHeight: 1.6, marginBottom: 20 }}>{project.description}</p>}
            <ProgressBar value={project.progress} height={8} showLabel />
          </>
        )}
      </Card>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { icon: DollarSign, label: 'Estimated', val: formatCurrency(project.estimated_cost), color: 'var(--amber)' },
          { icon: DollarSign, label: 'Actual Spent', val: formatCurrency(project.actual_cost), color: 'var(--green)' },
          { icon: Calendar, label: 'Target Date', val: formatDate(project.target_date), color: 'var(--blue)' },
          { icon: Calendar, label: 'Start Date', val: formatDate(project.start_date), color: 'var(--purple)' },
        ].map(({ icon: Icon, label, val, color }) => (
          <Card key={label} style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon size={13} color={color} />
              <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</p>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{val}</p>
          </Card>
        ))}
      </div>

      {/* Materials */}
      <Card style={{ padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Package size={17} color="var(--amber)" />
          <h2 style={{ fontSize: 18, fontFamily: 'DM Sans', fontWeight: 600 }}>Materials</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatCurrency(purchasedCost)} / {formatCurrency(totalMaterialCost)}</span>
            {editing && <Btn variant="secondary" size="sm" onClick={addMaterial} icon={<Plus size={13} />}>Add</Btn>}
          </div>
        </div>

        {(editing ? form.materials : project.materials || []).length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{editing ? 'No materials added yet.' : 'No materials listed.'}</p>
        ) : editing ? (
          <>
            <div style={{ display: 'flex', gap: 8, padding: '0 0 6px', marginBottom: 4, borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span style={{ width: 20 }} />
              <span style={{ flex: 2 }}>Name</span>
              <span style={{ flex: 1 }}>Qty</span>
              <span style={{ flex: 1 }}>Cost</span>
              <span style={{ width: 28 }} />
            </div>
            {form.materials.map((m, i) => (
              <MaterialRow key={i} mat={m} index={i} editing onChange={updateMaterial} onDelete={deleteMaterial} />
            ))}
          </>
        ) : (
          project.materials.map((m, i) => (
            <div key={i} onClick={() => toggleMaterialPurchased(i)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${m.purchased ? 'var(--green)' : 'var(--border-dark)'}`, background: m.purchased ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {m.purchased && <Check size={11} color="white" />}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: m.purchased ? 'var(--muted)' : 'var(--charcoal)', textDecoration: m.purchased ? 'line-through' : 'none' }}>{m.name}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{m.quantity}</span>
              <span style={{ fontSize: 13, fontWeight: 500, minWidth: 60, textAlign: 'right' }}>{formatCurrency(m.cost)}</span>
            </div>
          ))
        )}
      </Card>

      {/* Notes */}
      {project.notes && !editing && (
        <Card style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Wrench size={16} color="var(--amber)" />
            <h2 style={{ fontSize: 18, fontFamily: 'DM Sans', fontWeight: 600 }}>Notes</h2>
          </div>
          <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{project.notes}</p>
        </Card>
      )}
    </div>
  );
}
