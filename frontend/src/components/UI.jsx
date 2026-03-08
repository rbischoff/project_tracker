// Static fallbacks (used before config loads or in contexts without ConfigProvider)
export const PRIORITIES = ['critical', 'high', 'medium', 'low'];
export const STATUSES = ['planned', 'in_progress', 'on_hold', 'completed'];
export const CATEGORIES = ['kitchen', 'bathroom', 'bedroom', 'living_room', 'outdoor', 'basement', 'garage', 'roof', 'plumbing', 'electrical', 'flooring', 'painting', 'general'];

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#B84040', bg: '#FDEAEA', dot: '#B84040' },
  high: { label: 'High', color: '#8B5A1A', bg: '#FBF0DC', dot: '#C17B2E' },
  medium: { label: 'Medium', color: '#2B5278', bg: '#E8F0F8', dot: '#4A7FAF' },
  low: { label: 'Low', color: '#3A6B4E', bg: '#E8F4ED', dot: '#5A9B72' },
};

export const STATUS_CONFIG = {
  planned: { label: 'Planned', color: '#5A5A5A', bg: '#F0EDEA' },
  in_progress: { label: 'In Progress', color: '#2B5278', bg: '#E8F0F8' },
  on_hold: { label: 'On Hold', color: '#8B5A1A', bg: '#FBF0DC' },
  completed: { label: 'Completed', color: '#3A6B4E', bg: '#E8F4ED' },
};

// Dynamic Badge — reads from config context if available, falls back to static
import { useContext } from 'react';
import { ConfigContext } from '../configContext.js';

export function Badge({ type, value, size = 'sm' }) {
  let config;
  try {
    const ctx = useContext(ConfigContext);
    if (ctx && (type === 'priority' ? ctx.priorityConfig : ctx.statusConfig)) {
      config = type === 'priority' ? ctx.priorityConfig[value] : ctx.statusConfig[value];
    }
  } catch (_) {}

  if (!config) {
    config = type === 'priority' ? PRIORITY_CONFIG[value] : STATUS_CONFIG[value];
  }
  if (!config) return (
    <span style={{ padding: size === 'sm' ? '2px 8px' : '4px 12px', borderRadius: 100, fontSize: size === 'sm' ? 11 : 13, fontWeight: 500, background: '#F0EDEA', color: '#5A5A5A' }}>
      {value}
    </span>
  );
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: 100, fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 500, background: config.bg || config.bg_color, color: config.color,
    }}>
      {type === 'priority' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot || config.color, display: 'inline-block' }} />}
      {config.label}
    </span>
  );
}

export function ProgressBar({ value, height = 6, showLabel = false }) {
  const color = value >= 100 ? 'var(--green)' : value >= 60 ? 'var(--amber)' : value >= 30 ? '#4A7FAF' : '#8A8A8A';
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}%</span>
        </div>
      )}
      <div style={{ background: 'var(--border)', borderRadius: 100, height, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 100, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--warm-white)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow 0.15s, transform 0.15s',
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}}
    >{children}</div>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled, style = {}, icon }) {
  const styles = {
    primary: { background: 'var(--charcoal)', color: 'white', border: '1px solid var(--charcoal)' },
    secondary: { background: 'transparent', color: 'var(--charcoal)', border: '1px solid var(--border-dark)' },
    danger: { background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)' },
    amber: { background: 'var(--amber)', color: 'white', border: '1px solid var(--amber)' },
    ghost: { background: 'transparent', color: 'var(--slate)', border: '1px solid transparent' },
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 18px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 15 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      borderRadius: 8, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      ...styles[variant], ...sizes[size], ...style,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >{icon && icon}{children}</button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)' }}>{label}</label>}
      <input {...props} style={{
        padding: '9px 12px', borderRadius: 8, fontSize: 14,
        border: `1px solid ${error ? 'var(--red)' : 'var(--border-dark)'}`,
        background: 'white', color: 'var(--charcoal)', outline: 'none', transition: 'border-color 0.15s',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--amber)'}
      onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-dark)'}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, children, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)' }}>{label}</label>}
      <select {...props} style={{
        padding: '9px 12px', borderRadius: 8, fontSize: 14,
        border: `1px solid ${error ? 'var(--red)' : 'var(--border-dark)'}`,
        background: 'white', color: 'var(--charcoal)', outline: 'none', cursor: 'pointer', ...props.style,
      }}>{children}</select>
    </div>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)' }}>{label}</label>}
      <textarea {...props} style={{
        padding: '9px 12px', borderRadius: 8, fontSize: 14,
        border: `1px solid ${error ? 'var(--red)' : 'var(--border-dark)'}`,
        background: 'white', color: 'var(--charcoal)', outline: 'none',
        resize: 'vertical', minHeight: 90, ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--amber)'}
      onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-dark)'}
      />
    </div>
  );
}

export function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
