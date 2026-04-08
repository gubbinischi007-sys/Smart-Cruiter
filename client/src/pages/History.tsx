import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, LogIn, LogOut, User, Trash2 } from 'lucide-react';
import { historyApi } from '../services/api';
import { supabase } from '../lib/supabase';
import './History.css';

interface Action {
    description: string;
    timestamp: string;
}

interface LoginRecord {
    id: string;
    email: string;
    loginTime: string;
    logoutTime: string | null;
    role: string;
    actions?: Action[];
}

interface ApplicationRecord {
    id: string; // From database
    name: string;
    email: string;
    job_title: string;
    status: 'Accepted' | 'Rejected' | 'Deactivated';
    reason: string;
    date: string;
}

export default function History() {
    const [history, setHistory] = useState<LoginRecord[]>([]);
    const [appHistory, setAppHistory] = useState<ApplicationRecord[]>([]);
    const [systemUsersCount, setSystemUsersCount] = useState(0);
    const [activeUsersCount, setActiveUsersCount] = useState(0);

    const loadData = async () => {
        try {
            // Add a cache-busting timestamp to the fetching logic
            const timestamp = Date.now();
            
            // 1. Fetch Terminal Histories
            const appRes = await historyApi.getAll();
            setAppHistory(appRes.data || []);

            // 2. Fetch Aggregates
            const [profilesRes, sessionsRes] = await Promise.all([
                supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
                historyApi.getSessions() // We'll filter this for active ones
            ]);
            
            if (profilesRes.count !== null) setSystemUsersCount(profilesRes.count);

            const allSessions = sessionsRes.data || [];
            const activeUserEmails = new Set(
                allSessions
                    .filter((sess: any) => !sess.logout_time)
                    .map((sess: any) => sess.user_email)
            );
            setActiveUsersCount(activeUserEmails.size);

            // 3. Fetch Raw Data for Sessions & Actions
            const [activityRes, profileRes] = await Promise.all([
                historyApi.getActivityLogs(),
                supabase.from('user_profiles').select('email, role, role_title')
            ]);

            const sessions = allSessions;
            const logs = activityRes.data || [];
            const profiles = profileRes.data || [];
            const profileMap = new Map(profiles.map((p: any) => [p.email, p]));

            // 4. Enrich Sessions with Actions
            const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            const enrichedSessions: LoginRecord[] = sessions.map((sess: any) => {
                const profile = profileMap.get(sess.user_email);
                
                const sessionActions = sortedLogs.filter(log => {
                    const logTime = new Date(log.created_at).getTime();
                    const loginTime = new Date(sess.login_time).getTime();
                    const logoutTime = sess.logout_time ? new Date(sess.logout_time).getTime() : Date.now();
                    
                    return log.user_email === sess.user_email && logTime >= loginTime && logTime <= logoutTime;
                }).map(log => ({
                    description: log.action,
                    timestamp: log.created_at
                }));

                return {
                    id: sess.id,
                    email: sess.user_email,
                    role: profile?.role_title || profile?.role || 'HR Member',
                    loginTime: sess.login_time,
                    logoutTime: sess.logout_time,
                    actions: sessionActions
                };
            });

            setHistory(enrichedSessions);
        } catch (error) {
            console.error('Failed to load history data:', error);
        }
    };

    useEffect(() => {
        loadData();

        const channel = supabase
            .channel('history-realtime-v3')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'application_history' }, loadData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, loadData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_activity_logs' }, loadData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, loadData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="history-container">
            <div className="history-header">
                <h1 className="history-title">History & Logs</h1>
                <p className="history-subtitle">
                    Track system access and applicant decision history.
                </p>
            </div>

            <div className="history-stats">
                <div className="stat-card">
                    <div className="stat-icon bg-green">
                        <User size={24} className="text-green" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeUsersCount}</span>
                        <span className="stat-label">Active HR Users</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-blue">
                        <User size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{systemUsersCount}</span>
                        <span className="stat-label">Total System Users</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-purple">
                        <HistoryIcon size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{appHistory.length}</span>
                        <span className="stat-label">Processed Applications</span>
                    </div>
                </div>
            </div>

            <div className="history-section mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
                        <User size={20} className="text-primary" /> Application Decisions
                    </h2>
                </div>

                <div className="history-list">
                    {appHistory.length === 0 ? (
                        <div className="empty-state">
                            <HistoryIcon size={48} />
                            <h3>No application history</h3>
                            <p>Accepted or rejected applications will appear here.</p>
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Applicant</th>
                                    <th>Job Position</th>
                                    <th>Status</th>
                                    <th>Reason / Note</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appHistory.map((record) => (
                                    <tr key={record.id}>
                                        <td className="user-cell">
                                            <div className="user-avatar" style={{
                                                background: record.status === 'Accepted' ? '#10b981' :
                                                    record.status === 'Deactivated' ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {record.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{record.name}</div>
                                                <div className="text-xs text-muted">{record.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm text-gray-300">{record.job_title}</span>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'Accepted'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : record.status === 'Deactivated'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <p className="text-sm text-gray-400 truncate" title={record.reason}>
                                                {record.reason || '-'}
                                            </p>
                                        </td>
                                        <td>
                                            <div className="text-sm text-gray-400">
                                                {formatDate(record.date)}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {formatTime(record.date)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="history-section">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-primary" /> Login Activity
                </h2>
                <div className="history-list">
                    {history.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} />
                            <h3>No login history available</h3>
                            <p>Login activity will appear here.</p>
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Session Info</th>
                                    <th>Duration</th>
                                    <th>Actions Performed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record) => (
                                    <tr key={record.id}>
                                        <td className="user-cell" style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            <div className="user-avatar">
                                                {record.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{record.email}</span>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            <span className="role-badge">{record.role}</span>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            <div className="time-cell" style={{ marginBottom: '0.5rem' }}>
                                                <LogIn size={14} className="text-green" />
                                                <div>
                                                    <div className="date">{formatDate(record.loginTime)}</div>
                                                    <div className="time">{formatTime(record.loginTime)}</div>
                                                </div>
                                            </div>
                                            <div className="time-cell">
                                                {record.logoutTime ? (
                                                    <>
                                                        <LogOut size={14} className="text-red" />
                                                        <div>
                                                            <div className="date">{formatDate(record.logoutTime)}</div>
                                                            <div className="time">{formatTime(record.logoutTime)}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="status-active">Active Now</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '0.5rem', 
                                                padding: '0.4rem 0.75rem', 
                                                borderRadius: '20px', 
                                                background: record.logoutTime ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                border: `1px solid ${record.logoutTime ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`,
                                                color: record.logoutTime ? '#a5b4fc' : '#34d399',
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}>
                                                <Clock size={12} />
                                                {(() => {
                                                    const end = record.logoutTime ? new Date(record.logoutTime).getTime() : Date.now();
                                                    const diff = end - new Date(record.loginTime).getTime();
                                                    const minutes = Math.floor(diff / 60000);
                                                    if (minutes < 1) return '< 1m';
                                                    if (minutes < 60) return `${minutes}m`;
                                                    const hours = Math.floor(minutes / 60);
                                                    return `${hours}h ${minutes % 60}m`;
                                                })()}
                                                {!record.logoutTime && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(active)</span>}
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            {record.actions && record.actions.length > 0 ? (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {record.actions.map((action, idx) => (
                                                        <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                            <span style={{ color: '#6366f1', marginTop: '4px' }}>•</span>
                                                            <span>{action.description} <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>({formatTime(action.timestamp)})</span></span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span style={{ color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic' }}>No actions performed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
