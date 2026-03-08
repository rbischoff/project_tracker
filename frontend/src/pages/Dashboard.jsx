import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Card, Badge, ProgressBar, formatCurrency, formatDate, Btn } from '../components/UI.jsx';
import { PlusCircle, TrendingUp, DollarSign, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'var(--amber)' }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 28, fontFamily: 'DM Serif Display', marginTop: 4, color: 'var(--charcoal)' }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</p>}
        </div>
        <div style={{ background: color + '18', borderRadius: 10, padding: 10 }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getProjects(), api.getStats()]).then(([p, s]) => {
      setProjects(p);
      setStats(s);
      setLoading(false);
    });
  }, []);

  const urgent = projects.filter(p => (p.priority === 'critical' || p.priority === 'high') && p.status !== 'completed');
  const inProgress = projects.filter(p => p.status === 'in_progress');
  const recent = projects.slice(0, 5);

  if (loading) return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ height: 40, width: 200, marginBottom: 32 }} className="skeleton" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 100 }} className="skeleton" />)}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 960, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Overview</p>
          <h1 style={{ fontSize: 36, color: 'var(--charcoal)' }}>Dashboard</h1>
        </div>
        <Btn variant="amber" onClick={() => navigate('/new')} icon={<PlusCircle size={16} />}>New Project</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={TrendingUp} label="Total Projects" value={stats?.total || 0} sub={`${stats?.by_status?.completed || 0} completed`} color="var(--amber)" />
        <StatCard icon={Clock} label="In Progress" value={stats?.by_status?.in_progress || 0} sub="active projects" color="var(--blue)" />
        <StatCard icon={DollarSign} label="Est. Budget" value={formatCurrency(stats?.total_estimated_cost)} sub={`${formatCurrency(stats?.total_actual_cost)} spent`} color="var(--green)" />
        <StatCard icon={CheckCircle2} label="Avg Progress" value={`${stats?.average_progress || 0}%`} sub="across all projects" color="var(--purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Urgent */}
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={16} color="var(--red)" />
            <h3 style={{ fontSize: 15, fontFamily: 'DM Sans', fontWeight: 600 }}>Urgent Projects</h3>
            <span style={{ marginLeft: 'auto', fontSize: 12, background: 'var(--red-pale)', color: 'var(--red)', padding: '2px 8px', borderRadius: 100, fontWeight: 500 }}>{urgent.length}</span>
          </div>
          {urgent.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No urgent projects. 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {urgent.slice(0, 4).map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <Badge type="priority" value={p.priority} />
                  <span style={{ fontSize: 13, flex: 1, color: 'var(--charcoal)', fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.progress}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* In Progress */}
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={16} color="var(--blue)" />
            <h3 style={{ fontSize: 15, fontFamily: 'DM Sans', fontWeight: 600 }}>In Progress</h3>
          </div>
          {inProgress.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No active projects.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {inProgress.slice(0, 4).map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--charcoal)' }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatCurrency(p.estimated_cost)}</span>
                  </div>
                  <ProgressBar value={p.progress} height={5} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Projects */}
      <Card style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontFamily: 'DM Sans', fontWeight: 600 }}>Recent Projects</h3>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/projects')}>View all →</Btn>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 12 }}>No projects yet. Start tracking your home improvements!</p>
            <Btn variant="amber" onClick={() => navigate('/new')} icon={<PlusCircle size={15} />}>Create First Project</Btn>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Project', 'Priority', 'Status', 'Progress', 'Est. Cost', 'Target'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 8px', fontWeight: 500, color: 'var(--charcoal)' }}>{p.name}</td>
                  <td style={{ padding: '10px 8px' }}><Badge type="priority" value={p.priority} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge type="status" value={p.status} /></td>
                  <td style={{ padding: '10px 8px', minWidth: 100 }}><ProgressBar value={p.progress} height={5} /></td>
                  <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{formatCurrency(p.estimated_cost)}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{formatDate(p.target_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
