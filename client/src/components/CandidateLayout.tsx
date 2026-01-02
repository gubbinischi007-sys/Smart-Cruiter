import { Outlet, Link, useLocation } from 'react-router-dom';
import { Briefcase, User, LogOut, Hexagon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css'; // Reusing the same CSS but you could make a separate one

export default function CandidateLayout() {
    const location = useLocation();
    const { user, logout } = useAuth();

    const navLinks = [
        { path: '/candidate/jobs', label: 'Browse Jobs', icon: Briefcase },
        { path: '/candidate/dashboard', label: 'My Applications', icon: User },
    ];

    return (
        <div className="layout">
            <nav className="navbar">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/candidate/dashboard" className="logo">
                            <Hexagon fill="#22c55e" stroke="none" className="rotate-90" />
                            <span className="logo-text" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                                Smart<span style={{ color: 'white' }}>Career</span>
                            </span>
                        </Link>
                        <div className="nav-links">
                            {navLinks.map((link) => {
                                const isActive = location.pathname.startsWith(link.path);

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        style={isActive ? { background: '#22c55e', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' } : {}}
                                    >
                                        <link.icon size={16} />
                                        {link.label}
                                    </Link>
                                );
                            })}

                            <div className="user-profile">
                                <div className="user-info">
                                    <span className="user-name">{user.name || 'Candidate'}</span>
                                    <span className="user-role">Applicant</span>
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
