import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Card, formatCurrency } from '../../../components/UI.jsx';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../../components/UI.jsx';
import { BarChart3, TrendingUp, DollarSign, Layers } from 'lucide-react';

function MiniBar({ label, value, max, color, subLabel }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--slate)', minWidth: 90, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, background: 'var(--border)', borderRadius: 100, height: 10 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 100, height: '100%', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40, color: 'var(--charcoal)' }}>{subLabel || value}</span>
    </div>
  );
}

function Donut({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;
  const radius = 44;
  const cx = 60, cy = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth={14} />
      ) : segments.map((seg, i) => {
        const pct = seg.value / total;
        const offset = circumference * (1 - pct);
        const rotation = (cumulative / total) * 360 - 90;
        cumulative += seg.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius}
            fill="none" stroke={seg.color} strokeWidth={14}
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--charcoal)" fontFamily="DM Serif Display">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="var(--muted)">projects</text>
    </svg>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getProjects()]).then(([s, p]) => {
      setStats(s);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ height: 40, width: 200, marginBottom: 32 }} className="skeleton" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 220 }} className="skeleton" />)}
      </div>
    </div>
  );

  const byStatus = stats?.by_status || {};
  const byPriority = stats?.by_priority || {};
  const maxStatus = Math.max(...Object.values(byStatus), 1);
  const maxPriority = Math.max(...Object.values(byPriority), 1);

  const statusSegments = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    label: cfg.label, value: byStatus[key] || 0, color: cfg.color,
  }));

  const prioritySegments = Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({
    label: cfg.label, value: byPriority[key] || 0, color: cfg.dot,
  }));

  const totalMaterialCost = projects.reduce((s, p) => s + (p.materials || []).reduce((ms, m) => ms + (m.cost || 0), 0), 0);
  const purchasedMaterialCost = projects.reduce((s, p) => s + (p.materials || []).filter(m => m.purchased).reduce((ms, m) => ms + (m.cost || 0), 0), 0);

  const byCategory = {};
  projects.forEach(p => { byCategory[p.category] = (byCategory[p.category] || 0) + 1; });
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const costVariance = stats?.total_actual_cost - stats?.total_estimated_cost;

  return (
    <div style={{ maxWidth: 960, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Insights</p>
        <h1 style={{ fontSize: 36 }}>Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: Layers, label: 'Total Projects', value: stats?.total || 0, sub: `${byStatus.completed || 0} completed`, color: 'var(--amber)' },
          { icon: DollarSign, label: 'Budget Used', value: formatCurrency(stats?.total_actual_cost), sub: `of ${formatCurrency(stats?.total_estimated_cost)} estimated`, color: costVariance > 0 ? 'var(--red)' : 'var(--green)' },
          { icon: TrendingUp, label: 'Avg Completion', value: `${stats?.average_progress || 0}%`, sub: 'across all projects', color: 'var(--blue)' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ background: color + '18', borderRadius: 10, padding: 10, flexShrink: 0 }}>
                <Icon size={19} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 24, fontFamily: 'DM Serif Display' }}>{value}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Status breakdown */}
        <Card style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Projects by Status</h3>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Donut segments={statusSegments} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusSegments.map(seg => (
                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--slate)', flex: 1 }}>{seg.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Priority breakdown */}
        <Card style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Projects by Priority</h3>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Donut segments={prioritySegments} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prioritySegments.map(seg => (
                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--slate)', flex: 1 }}>{seg.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top categories */}
        <Card style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Top Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCategories.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: 14 }}>No data yet</p> : topCategories.map(([cat, count]) => (
              <MiniBar key={cat} label={cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} value={count} max={topCategories[0][1]} color="var(--amber)" subLabel={count} />
            ))}
          </div>
        </Card>

        {/* Materials cost */}
        <Card style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Materials Budget</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Purchased</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{formatCurrency(purchasedMaterialCost)}</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 100, height: 10 }}>
                <div style={{ width: `${totalMaterialCost ? (purchasedMaterialCost / totalMaterialCost) * 100 : 0}%`, background: 'var(--green)', borderRadius: 100, height: '100%', transition: 'width 0.6s ease' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Total Material Budget', val: formatCurrency(totalMaterialCost), color: 'var(--charcoal)' },
                { label: 'Purchased So Far', val: formatCurrency(purchasedMaterialCost), color: 'var(--green)' },
                { label: 'Remaining', val: formatCurrency(totalMaterialCost - purchasedMaterialCost), color: 'var(--amber)' },
                { label: 'Cost Variance', val: `${costVariance >= 0 ? '+' : ''}${formatCurrency(costVariance)}`, color: costVariance > 0 ? 'var(--red)' : 'var(--green)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--slate)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
