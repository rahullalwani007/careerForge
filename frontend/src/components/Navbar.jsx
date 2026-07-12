import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Compass, LayoutDashboard, Mic2, BookOpen, Briefcase, User, LogOut,
         ChevronDown, Moon, Sun, Settings, FileText, ListChecks, Building2, Users2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const LOGO = ({ dark }) => (
  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
    <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow:'0 4px 12px rgba(79,70,229,.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Compass size={17} color="#fff" />
    </div>
    <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:17, color:'var(--text)', letterSpacing:'-.02em' }}>
      Career<span className="gradient-text">Forge</span>
    </span>
  </div>
);

export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, careerPath, dataReady, logout, darkMode, toggleDarkMode } = useApp();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dropRef     = useRef(null);
  const settingsRef = useRef(null);
  const moreRef     = useRef(null);

  const isAuth = location.pathname === '/auth';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropOpen(false); setSettingsOpen(false); setMoreOpen(false); }, [location]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (isAuth) return null;

  // Split into core items (always visible on desktop) and overflow items
  // (behind a "More" dropdown) — 8 full-label items simply do not fit
  // inside a 1200px header alongside the logo and account controls on
  // a typical laptop width, which was the source of the overflow.
  const showNav = user && (careerPath || !dataReady); // avoid a flash of no-links while data is still loading
  const navLinks = showNav ? [
    { href:'/dashboard',   label:'Dashboard',   icon:LayoutDashboard },
    { href:'/placement-drive', label:'Drive', icon:Building2 },
    { href:'/interview',   label:'Practice',    icon:Mic2 },
    { href:'/group-discussion', label:'GD Room', icon:Users2 },
    { href:'/skill-assessment', label:'Skills', icon:ListChecks },
    { href:'/learn',       label:'Learn',       icon:BookOpen },
  ] : [];
  const moreLinks = showNav ? [
    { href:'/notes',       label:'Notes',       icon:FileText },
    { href:'/careers',     label:'Careers',     icon:Briefcase },
  ] : [];
  const moreActive = moreLinks.some(l => l.href === location.pathname);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()
    : user?.email?.substring(0,2).toUpperCase() || 'G';

  return (
    <header style={{
      position:'fixed', top:0, left:0, right:0, zIndex:50,
      background: scrolled ? 'var(--navbar-bg)' : 'var(--navbar-bg)',
      backdropFilter:'blur(20px)',
      borderBottom:`1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      transition:'all .3s',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>

        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} style={{ textDecoration:'none', flexShrink:0 }}>
          <LOGO dark={darkMode} />
        </Link>

        {/* Desktop nav */}
        {navLinks.length > 0 && (
          <nav className="desktop-only" style={{ alignItems:'center', gap:0, flex:1, justifyContent:'center', minWidth:0 }}>
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} to={href}
                className={`nav-link ${location.pathname === href ? 'active' : ''}`}
                style={{ fontSize:13, fontWeight:location.pathname === href ? 700 : 500, whiteSpace:'nowrap', padding:'6px 9px' }}>
                <Icon size={14} />{label}
              </Link>
            ))}

            {/* More dropdown — Notes, Careers */}
            <div ref={moreRef} style={{ position:'relative', flexShrink:0 }}>
              <button
                onClick={() => setMoreOpen(o => !o)}
                className={`nav-link ${moreActive ? 'active' : ''}`}
                style={{ fontSize:13, fontWeight:moreActive?700:500, whiteSpace:'nowrap', padding:'6px 9px', border:'none', background: moreActive ? undefined : 'none', cursor:'pointer' }}>
                More <ChevronDown size={12} style={{ transition:'transform .2s', transform: moreOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {moreOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)',
                  background:'var(--surf)', border:'1px solid var(--border)', borderRadius:14,
                  boxShadow:'var(--shadow-lg)', padding:'8px', minWidth:160, zIndex:100,
                }}>
                  {moreLinks.map(({ href, label, icon: Icon }) => (
                    <Link key={href} to={href}
                      className={`nav-link ${location.pathname === href ? 'active' : ''}`}
                      style={{ display:'flex', width:'100%', padding:'9px 12px', fontSize:13.5, marginBottom:2 }}>
                      <Icon size={15} />{label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>

          {/* Dark mode toggle */}
          <div ref={settingsRef} style={{ position:'relative' }}>
            <button
              onClick={() => setSettingsOpen(o => !o)}
              className="btn-ghost"
              style={{ padding:'7px 10px', gap:5, fontSize:13 }}
              title="Settings"
            >
              <Settings size={15} />
            </button>

            {settingsOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 8px)', right:0,
                background:'var(--surf)', border:'1px solid var(--border)',
                borderRadius:14, boxShadow:'var(--shadow-lg)',
                padding:'10px', minWidth:200, zIndex:100,
              }}>
                <div style={{ padding:'6px 10px 10px', borderBottom:'1px solid var(--border)', marginBottom:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.5px' }}>Settings</div>
                </div>

                {/* Dark mode toggle */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {darkMode ? <Moon size={15} style={{ color:'var(--p3)' }} /> : <Sun size={15} style={{ color:'var(--amber)' }} />}
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
                      {darkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <button onClick={toggleDarkMode} className="dark-toggle" aria-label="Toggle dark mode">
                    <div className="dark-toggle-thumb" />
                  </button>
                </div>

                {user && (
                  <button onClick={() => { setSettingsOpen(false); navigate('/profile'); }}
                    style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'8px 10px', borderRadius:10, border:'none', background:'none', cursor:'pointer', color:'var(--t2)', fontSize:13, fontWeight:600, textAlign:'left', transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--surf3)'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                  >
                    <User size={14} /> Profile Settings
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Auth section */}
          {!user ? (
            <button className="btn-primary" onClick={() => navigate('/auth')} style={{ fontSize:13, padding:'8px 18px' }}>
              Get Started
            </button>
          ) : (
            <div ref={dropRef} style={{ position:'relative' }}>
              <button
                onClick={() => setDropOpen(o => !o)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 6px', borderRadius:40, border:'1.5px solid var(--border2)', background:'var(--surf)', cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--p3)'; e.currentTarget.style.background='var(--p-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.background='var(--surf)'; }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,var(--p),var(--p2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>{initials}</div>
                )}
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <ChevronDown size={13} style={{ color:'var(--t3)', transition:'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {dropOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 8px)', right:0,
                  background:'var(--surf)', border:'1px solid var(--border)',
                  borderRadius:14, boxShadow:'var(--shadow-lg)',
                  padding:'8px', minWidth:200, zIndex:100,
                }}>
                  <div style={{ padding:'8px 12px 10px', borderBottom:'1px solid var(--border)', marginBottom:6 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name || user.email?.split('@')[0]}</div>
                    <div style={{ fontSize:11, color:'var(--t3)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis' }}>{user.email}</div>
                  </div>
                  {[
                    { icon: User,     label: 'Profile',   to: '/profile' },
                    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
                  ].map(item => (
                    <button key={item.label}
                      onClick={() => { setDropOpen(false); navigate(item.to); }}
                      style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'8px 12px', borderRadius:9, border:'none', background:'none', cursor:'pointer', color:'var(--t2)', fontSize:13, fontWeight:600, textAlign:'left', transition:'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--surf3)'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      <item.icon size={14} />{item.label}
                    </button>
                  ))}
                  <div style={{ borderTop:'1px solid var(--border)', marginTop:6, paddingTop:6 }}>
                    <button
                      onClick={() => { setDropOpen(false); logout(); }}
                      style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'8px 12px', borderRadius:9, border:'none', background:'none', cursor:'pointer', color:'var(--red)', fontSize:13, fontWeight:600, textAlign:'left', transition:'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--red-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          {navLinks.length > 0 && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="btn-ghost mobile-only"
              style={{ padding:'7px 9px' }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background:'var(--surf)', borderTop:'1px solid var(--border)', padding:'12px 20px 16px' }}>
          {[...navLinks, ...moreLinks].map(({ href, label, icon: Icon }) => (
            <Link key={href} to={href}
              className={`nav-link ${location.pathname === href ? 'active' : ''}`}
              style={{ display:'flex', width:'100%', marginBottom:4, padding:'10px 14px' }}>
              <Icon size={16} />{label}
            </Link>
          ))}
          <button onClick={toggleDarkMode}
            style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', border:'none', background:'none', cursor:'pointer', color:'var(--t2)', fontSize:14, fontWeight:600, borderRadius:9 }}>
            {darkMode ? <Moon size={16} style={{ color:'var(--p3)' }}/> : <Sun size={16} style={{ color:'var(--amber)' }} />}
            {darkMode ? 'Dark Mode On' : 'Light Mode'}
          </button>
        </div>
      )}
    </header>
  );
}
