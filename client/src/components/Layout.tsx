import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users2, Hexagon, LogOut, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/admin/applicants', label: 'Applicants', icon: Users2 },
    { path: '/admin/history', label: 'History', icon: History },
  ];

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <Link to="/admin/dashboard" className="logo">
              <Hexagon fill="#6366f1" stroke="none" className="rotate-90" />
              <span className="logo-text">SmartCruiter</span>
            </Link>
            <div className="nav-links">
              {navLinks.map((link) => {
                const isActive = link.path === '/admin/dashboard'
                  ? location.pathname === '/admin/dashboard'
                  : location.pathname.startsWith(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                );
              })}

              <div className="user-profile">
                <div className="user-info">
                  <span className="user-name">{user.name || 'HR Manager'}</span>
                  <span className="user-role">{user.roleTitle || 'Recruiter / HR'}</span>
                </div>
                <button
                  onClick={logout}
                  className="logout-btn"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

