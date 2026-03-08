import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, FolderKanban, PlusCircle, BarChart3, Menu, X, Hammer } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import NewProject from './pages/NewProject.jsx';
import Stats from './pages/Stats.jsx';

function Nav({ open, setOpen }) {
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);

  const links = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/new', icon: PlusCircle, label: 'New Project' },
    { to: '/stats', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && <div style={{ position:'fixed',inset:0,background:'rgba(28,28,28,0.4)',zIndex:40 }} onClick={() => setOpen(false)} />}

      <nav style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 220, background: 'var(--graphite)',
        display: 'flex', flexDirection: 'column',
        padding: '0', zIndex: 50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        boxShadow: 'var(--shadow-lg)',
      }} className="sidebar">

        <style>{`
          @media (min-width: 768px) {
            .sidebar { transform: translateX(0) !important; }
            .hamburger { display: none !important; }
            .main-layout { margin-left: 220px !important; }
          }
        `}</style>

        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--amber)', borderRadius: 8, padding: '6px 8px', display: 'flex' }}>
              <Hammer size={18} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'DM Serif Display', color: 'white', fontSize: 16, lineHeight: 1.2 }}>Home</div>
              <div style={{ fontFamily: 'DM Serif Display', color: 'var(--amber-light)', fontSize: 16, lineHeight: 1.2 }}>Projects</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
              color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(193,123,46,0.25)' : 'transparent',
              fontWeight: isActive ? 500 : 400, fontSize: 14,
              transition: 'all 0.15s ease',
              borderLeft: isActive ? '3px solid var(--amber)' : '3px solid transparent',
            })}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'DM Mono' }}>v1.0.0</p>
        </div>
      </nav>
    </>
  );
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <Nav open={navOpen} setOpen={setNavOpen} />

        {/* Hamburger */}
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
