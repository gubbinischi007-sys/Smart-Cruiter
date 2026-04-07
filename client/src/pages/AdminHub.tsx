import { useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, Settings as SettingsIcon, LogOut, ArrowRight, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import './AdminHub.css';

export default function AdminHub() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { company, loading: companyLoading } = useCompany();
    const isOwner = company && (company as any).owner_id === user.id;

    if (companyLoading) return null;

    // If not owner but somehow on this page, push to dashboard
    if (!isOwner) {
        navigate('/admin/dashboard', { replace: true });
        return null;
    }

    return (
        <div className="hub-container animate-fade-in">
            {/* Minimal top bar for logout / user info */}
            <div className="hub-topbar">
                <div className="hub-logo">
                    <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 6 }} />
                    <span className="font-bold text-white tracking-wide">SmartCruiter Hub</span>
                </div>
                <div className="hub-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', lineHeight: '1.2' }}>{user.name}</span>
                        <span style={{ fontSize: '0.75rem', color: isOwner ? '#818cf8' : '#10b981', fontWeight: 500 }}>
                            {isOwner ? 'Master Admin' : (user.roleTitle || 'HR Representative')}
                        </span>
                    </div>
                    <button onClick={logout} className="logout-btn-hub" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            <div className="hub-content">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', background: 'linear-gradient(to right, #818cf8, #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Welcome to {company?.name || 'Your Workspace'}
                    </h1>
                    <p style={{ color: '#9ca3af', fontSize: '1.1rem', margin: 0 }}>Select a portal to continue.</p>
                </div>

                <div className="hub-grid">
                    {/* Portal 1: Recruiting Dashboard */}
                    <div className="hub-card portal-dashboard" onClick={() => navigate('/admin/dashboard')}>
                        <div className="hub-icon-wrapper dashboard-icon">
                            <LayoutDashboard size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: '0 0 0.5rem 0' }}>Recruiting Dashboard</h2>
                        <p style={{ color: '#9ca3af', margin: '0 0 2rem 0', flex: 1, lineHeight: '1.6' }}>
                            Enter the daily workspace. Manage active jobs, review applicants, and schedule automated interviews alongside your HR team.
                        </p>
                        <div className="hub-action" style={{ color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Enter Workspace <ArrowRight size={18} />
                        </div>
                    </div>

                    {/* Portal 2: Workspace Settings */}
                    <div className="hub-card portal-settings" onClick={() => navigate('/workspace/settings')}>
                        <div className="hub-icon-wrapper settings-icon">
                            <SettingsIcon size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: '0 0 0.5rem 0' }}>Workspace Administration</h2>
                        <p style={{ color: '#9ca3af', margin: '0 0 2rem 0', flex: 1, lineHeight: '1.6' }}>
                            Access sensitive configurations. Manage branding, update security keys, and oversee access for your HR personnel.
                        </p>
                        <div className="hub-action" style={{ color: '#f472b6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Manage Settings <ArrowRight size={18} />
                        </div>
                    </div>

                    {/* Portal 3: HR Team Management */}
                    <div className="hub-card portal-hr-team" onClick={() => navigate('/workspace/hr-team')}>
                        <div className="hub-icon-wrapper hr-team-icon">
                            <Users size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: '0 0 0.5rem 0' }}>HR Team Management</h2>
                        <p style={{ color: '#9ca3af', margin: '0 0 2rem 0', flex: 1, lineHeight: '1.6' }}>
                            Create HR accounts, manage team access, and instantly suspend or remove departing employees from the portal.
                        </p>
                        <div className="hub-action" style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Manage HR Team <ArrowRight size={18} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
