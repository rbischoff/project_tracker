import { useState } from 'react';
import { useAuth } from '../context.jsx';
import { Hammer, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('Please enter your username and password.'); return; }
    setError(''); setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(193,123,46,0.07) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(58,107,78,0.06) 0%, transparent 50%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--graphite)', borderRadius: 16, padding: '14px 16px',
            marginBottom: 16, boxShadow: 'var(--shadow-md)',
          }}>
            <Hammer size={28} color="var(--amber-light)" />
          </div>
          <h1 style={{ fontSize: 32, fontFamily: 'DM Serif Display', color: 'var(--charcoal)', marginBottom: 4 }}>
            Home Projects
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Track your home improvement journey</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--warm-white)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
          padding: '36px 36px',
          animation: 'fadeIn 0.35s ease',
        }}>
          <h2 style={{ fontSize: 20, fontFamily: 'DM Serif Display', marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>Enter your credentials to continue</p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--red-pale)', border: '1px solid #F5C6C6',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              animation: 'fadeIn 0.2s ease',
            }}>
              <AlertCircle size={15} color="var(--red)" />
              <span style={{ fontSize: 13, color: 'var(--red)' }}>{error}</span>
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)' }}>Username or Email</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username" autoFocus
                style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 14,
                  border: '1px solid var(--border-dark)', background: 'white',
                  color: 'var(--charcoal)', outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--amber)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-dark)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    padding: '10px 40px 10px 14px', borderRadius: 8, fontSize: 14, width: '100%',
                    border: '1px solid var(--border-dark)', background: 'white',
                    color: 'var(--charcoal)', outline: 'none', transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--amber)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-dark)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)',
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '11px', background: loading ? 'var(--muted)' : 'var(--charcoal)',
              color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              fontFamily: 'DM Sans',
            }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Hint */}
        <div style={{
          marginTop: 20, background: 'rgba(255,255,255,0.6)', borderRadius: 10,
          border: '1px solid var(--border)', padding: '14px 18px',
        }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 }}>Default accounts:</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['admin', 'admin123', 'Admin'], ['user', 'user123', 'User']].map(([u, p, role]) => (
              <div key={u} style={{ fontSize: 12, color: 'var(--slate)' }}>
                <span style={{
                  background: role === 'Admin' ? 'var(--amber-pale)' : 'var(--blue-pale)',
                  color: role === 'Admin' ? 'var(--amber)' : 'var(--blue)',
                  padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, marginRight: 6,
                }}>{role}</span>
                <span style={{ fontFamily: 'DM Mono' }}>{u} / {p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
