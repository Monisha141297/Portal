import { useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { initials } from '../../lib/helpers';
import { NAV, HOME_ROUTE } from './navConfig';
import { titleForPath } from './pageTitles';
import GlobalSearch from './GlobalSearch';
import NotifsModal from './NotifsModal';
import GuideWidget from './GuideWidget';

export default function AppShell() {
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const notifs = useStore((s) => s.notifs);
  const expertQs = useStore((s) => s.expertQs);
  const navigate = useNavigate();
  const location = useLocation();
  const [sideOpen, setSideOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;

  const crumbTitle = titleForPath(location.pathname);

  const sections = NAV[currentUser.role];
  const unread = notifs.filter((n) => !n.read).length;
  const pendingExpert = expertQs.filter((x) => x.status === 'Raised').length;

  return (
    <div className="shell">
      <aside className={'side' + (sideOpen ? ' open' : '')}>
        <div className="brandbox">
          <div className="logo">
            <div className="logo-mark">LMS</div>
            <div>
              <b>Learning Platform</b>
              <div className="xs" style={{ color: '#64748b' }}>Product Learning &amp; Certification</div>
            </div>
          </div>
        </div>
        {sections.map((sec) => (
          <div key={sec.title}>
            <div className="navsec">{sec.title}</div>
            <div className="nav">
              {sec.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'on' : '')} onClick={() => setSideOpen(false)}>
                  <span className="ic">{item.icon}</span>
                  {item.label}
                  {item.pillKey === 'expert' && pendingExpert > 0 && <span className="pill">{pendingExpert}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <div className="sidefoot">
          Signed in as <b style={{ color: '#c7d2e4' }}>{currentUser.name}</b><br />
          {currentUser.emp} · {currentUser.role.toUpperCase()}
          <div style={{ marginTop: 8 }}>
            <a onClick={() => { logout(); navigate('/login'); }} style={{ color: '#93c5fd', cursor: 'pointer' }}>Sign out</a>
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="iconbtn" style={{ display: 'none' }} onClick={() => setSideOpen((v) => !v)}>☰</button>
          <div className="crumb"><b>{crumbTitle}</b></div>
          <div className="grow" />
          <GlobalSearch />
          <button className="iconbtn" onClick={() => setNotifsOpen(true)}>
            🔔{unread > 0 && <span className="dot">{unread}</span>}
          </button>
          <div className="avatar" title={currentUser.name} onClick={() => navigate(HOME_ROUTE[currentUser.role])} style={{ cursor: 'pointer' }}>
            {initials(currentUser.name)}
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
      {notifsOpen && <NotifsModal onClose={() => setNotifsOpen(false)} />}
      <GuideWidget />
    </div>
  );
}
