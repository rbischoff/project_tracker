import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, FolderKanban, PlusCircle, BarChart3, Menu, X, Shield, LogOut, ChevronDown } from 'lucide-react';
import { branding } from './config';
import { AuthProvider, ConfigProvider, useAuth, useConfig } from './context.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import NewProject from './pages/NewProject.jsx';
import Stats from './pages/Stats.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';

const logoSrc = branding.sidebarLogo;

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, margin: '0 auto 12px', borderRadius: '50%' }} className="skeleton" />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', padding: '0 12px' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'white',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: user?.role === 'admin' ? 'var(--amber)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {user?.role === 'admin' ? <Shield size={13} color="white" /> : <span style={{ fontSize: 12, fontWeight: 700 }}>{user?.username?.[0]?.toUpperCase()}</span>}
        </div>
        <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
        <ChevronDown size={12} color="rgba(255,255,255,0.4)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 12, right: 12,
          background: 'var(--graphite)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 100,
        }}>
          <button onClick={() => { logout(); setOpen(false); }} style={{
            width: '100%', padding: '10px 14px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans', textAlign: 'left',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Nav({ open, setOpen }) {
  const location = useLocation();
  const { user } = useAuth();
  useEffect(() => setOpen(false), [location]);

  const links = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/new', icon: PlusCircle, label: 'New Project' },
    { to: '/stats', icon: BarChart3, label: 'Analytics' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  // Determine active link based on current path
  const isActive = (path) => {
    const pathname = location.pathname;
    if (path === '/') return pathname === '/' || pathname === '';
    if (path === '/projects') return pathname === '/projects' || pathname.startsWith('/projects/');
    return pathname === path;
  };

  // Debug helper - remove after testing
  const getActivePath = () => {
    for (const link of links) {
      if (isActive(link.to)) return link.to;
    }
    return 'none';
  };

  useEffect(() => {
    console.log('Pathname:', location.pathname, '| Active:', getActivePath());
  }, [location.pathname]);

  return (
    <>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,28,0.4)', zIndex: 40 }} onClick={() => setOpen(false)} />}
      <nav style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
        background: 'var(--graphite)', display: 'flex', flexDirection: 'column',
        zIndex: 50, transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease', boxShadow: 'var(--shadow-lg)',
      }} className="sidebar">
        <style>{`
          @media (min-width: 768px) { .sidebar { transform: translateX(0) !important; } .hamburger { display: none !important; } .main-layout { margin-left: 220px !important; } }
        `}</style>

        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={logoSrc} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'DM Serif Display', color: 'white', fontSize: 16, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Home</div>
              <div style={{ fontFamily: 'DM Serif Display', color: 'var(--amber-light)', fontSize: 16, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Projects</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {links.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(193,123,46,0.25)' : 'transparent',
                fontWeight: active ? 500 : 400, fontSize: 14,
                transition: 'all 0.15s',
                borderLeft: active ? '3px solid var(--amber)' : '3px solid transparent',
                cursor: 'pointer',
              }}>
                <Icon size={17} /> {label}
              </Link>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, paddingBottom: 16 }}>
          <UserMenu />
        </div>
      </nav>
    </>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  if (loading) return null;
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Nav open={navOpen} setOpen={setNavOpen} />
      <button className="hamburger" onClick={() => setNavOpen(o => !o)} style={{
        position: 'fixed', top: 16, left: 16, zIndex: 60,
        background: 'var(--graphite)', border: 'none', borderRadius: 8,
        padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-md)',
      }}>
        {navOpen ? <X size={20} color="white" /> : <Menu size={20} color="white" />}
      </button>
      <main className="main-layout" style={{ marginLeft: 0, minHeight: '100vh', padding: '32px 28px' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/new" element={<NewProject />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <Routes>
            <Route path="/login" element={<LoginGate />} />
            <Route path="*" element={<RequireAuth><AppShell /></RequireAuth>} />
          </Routes>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LoginGate() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
