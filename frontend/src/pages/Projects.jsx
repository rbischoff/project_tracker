import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Card, Badge, ProgressBar, formatCurrency, formatDate, Btn, Select } from '../components/UI.jsx';
import { useConfig } from '../context.jsx';
import { PlusCircle, Search, SlidersHorizontal, Layers } from 'lucide-react';

function ProjectCard({ project, onClick, categoryLabels }) {
  const materials = project.materials || [];
  const purchased = materials.filter(m => m.purchased).length;
  const cLabel = (k) => categoryLabels[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Card onClick={onClick} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 17, marginBottom: 4 }}>{project.name}</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{cLabel(project.category)}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Badge type="priority" value={project.priority} />
          <Badge type="status" value={project.status} />
        </div>
      </div>
      {project.description && <p style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description}</p>}
      <ProgressBar value={project.progress} height={6} showLabel />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div><p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Est. Cost</p><p style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(project.estimated_cost)}</p></div>
        <div><p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Materials</p><p style={{ fontSize: 14, fontWeight: 600 }}>{purchased}/{materials.length}</p></div>
        <div><p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Target</p><p style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(project.target_date)}</p></div>
      </div>
    </Card>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { priorities, statuses, categories, priorityConfig, statusConfig, categoryLabels } = useConfig();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => { api.getProjects(filters).then(p => { setProjects(p); setLoading(false); }); }, [filters]);

  const filtered = projects.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));
  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const pLabel = (k) => priorityConfig[k]?.label || k;
  const sLabel = (k) => statusConfig[k]?.label || k;
  const cLabel = (k) => categoryLabels[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div style={{ maxWidth: 1100, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>All Projects</p>
          <h1 style={{ fontSize: 36 }}>Projects</h1>
        </div>
        <Btn variant="amber" onClick={() => navigate('/new')} icon={<PlusCircle size={16} />}>New Project</Btn>
      </div>

      <Card style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', background: 'var(--cream)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
            <Search size={14} color="var(--muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, flex: 1 }} />
          </div>
          <Select value={filters.priority} onChange={e => setFilter('priority', e.target.value)} style={{ flex: '0 0 auto' }}>
            <option value="">All Priorities</option>
            {priorities.map(p => <option key={p} value={p}>{pLabel(p)}</option>)}
          </Select>
          <Select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ flex: '0 0 auto' }}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{sLabel(s)}</option>)}
          </Select>
          <Select value={filters.category} onChange={e => setFilter('category', e.target.value)} style={{ flex: '0 0 auto' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{cLabel(c)}</option>)}
          </Select>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {['grid', 'list'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-dark)', background: viewMode === m ? 'var(--charcoal)' : 'transparent', color: viewMode === m ? 'white' : 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                {m === 'grid' ? <Layers size={14} /> : <SlidersHorizontal size={14} />}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 220 }} className="skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: '64px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏠</p>
          <p style={{ fontSize: 18, fontFamily: 'DM Serif Display', marginBottom: 8 }}>No projects found</p>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Try adjusting filters or create a new project</p>
          <Btn variant="amber" onClick={() => navigate('/new')} icon={<PlusCircle size={15} />}>Create Project</Btn>
        </Card>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} categoryLabels={categoryLabels} />)}
        </div>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--cream)' }}>
              <tr>{['Name','Priority','Status','Progress','Est. Cost','Category','Target Date'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '12px 16px' }}><Badge type="priority" value={p.priority} /></td>
                  <td style={{ padding: '12px 16px' }}><Badge type="status" value={p.status} /></td>
                  <td style={{ padding: '12px 16px', minWidth: 120 }}><ProgressBar value={p.progress} height={5} /></td>
                  <td style={{ padding: '12px 16px' }}>{formatCurrency(p.estimated_cost)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--slate)' }}>{cLabel(p.category)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{formatDate(p.target_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
