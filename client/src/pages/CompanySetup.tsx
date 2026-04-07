import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Building2, Users, ArrowRight, Copy, CheckCircle, AlertCircle, Sparkles, Lock, FileText, Search } from 'lucide-react';
import './CompanySetup.css';

type Mode = 'create';

export default function CompanySetup() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { company, joinCompany, refetch } = useCompany();

    // If user already has a company workspace, send them there — don't show setup
    useEffect(() => {
        if (company) {
            if ((company as any).owner_id === user.id) {
                navigate('/workspace/hub', { replace: true });
            } else {
                navigate('/admin/dashboard', { replace: true });
            }
        }
    }, [company]);

    const [mode, setMode] = useState<'create' | 'join'>('join');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [createdCompany, setCreatedCompany] = useState<{ invite_code: string } | null>(null);

    const [formData, setFormData] = useState({
        trackingId: '',
        inviteCode: '',
    });

    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setError('');
    };

    const handleClaimWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.trackingId.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            // Claim the approved company using Tracking ID
            const { data: inviteCode, error: rpcError } = await supabase.rpc('claim_approved_company', {
                p_tracking_id: formData.trackingId.trim().toUpperCase()
            });

            if (rpcError) throw rpcError;
            if (!inviteCode) throw new Error('Could not retrieve invite code. Please contact support.');

            // Fetch the company ID using the invite code we just got
            const { data: comp } = await supabase
                .from('companies')
                .select('id')
                .eq('invite_code', inviteCode)
                .single();

            if (comp) {
                // Ensure the master admin is proudly linked to this newly created company!
                await supabase
                    .from('user_profiles')
                    .update({ company_id: comp.id })
                    .eq('id', user.id);

                // Initialize the owner of the company
                await supabase
                    .from('companies')
                    .update({ owner_id: user.id })
                    .eq('id', comp.id);
            }

            // Success! We claimed the workspace. Refresh context and set state.
            await refetch();
            setCreatedCompany({ invite_code: inviteCode });
        } catch (err: any) {
            setError(err?.message || 'Failed to claim workspace. Check your Tracking ID or ensure the company is officially approved.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.inviteCode.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            await joinCompany(formData.inviteCode.trim());
            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err?.message || 'Invalid 1-time invite code. Please check with your administrator.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyCode = () => {
        if (createdCompany) {
            navigator.clipboard.writeText(createdCompany.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="company-setup-container">
            <div className="company-setup-bg">
                <div className="bg-orb-1" />
                <div className="bg-orb-2" />
            </div>

            <div className="company-setup-content">
                {/* Header */}
                <div className="company-setup-header">
                    <img src="/logo.png" alt="SmartCruiter" style={{ width: 48, height: 48, borderRadius: 10 }} />
                    <h1>{mode === 'create' ? 'Set Up Your Workspace' : 'Join Your Company'}</h1>
                    <p>{mode === 'create' 
                        ? 'Initialize an approved company workspace using your Tracking ID.' 
                        : 'Enter the 1-time invite code provided by your Master Admin to join your team.'}</p>
                </div>

                {/* Success State — Workspace Claimed */}
                {createdCompany ? (
                    <div className="setup-card success-card">
                        <div className="success-icon">
                            <CheckCircle size={32} />
                        </div>
                        <h2>🎉 Workspace Initialized!</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Your company is successfully linked. Share the <strong>1-time generation code</strong> below with your HR team members so they can join securely.
                        </p>

                        <div className="invite-code-display">
                            <span className="invite-label">
                                <Lock size={14} style={{ marginRight: 6 }} /> 1-Time Invite Code
                            </span>
                            <div className="invite-code-row">
                                <code className="invite-code">{createdCompany.invite_code}</code>
                                <button className="copy-btn" onClick={copyCode}>
                                    {copied ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
                            Your colleagues will enter this exact code when choosing "Join a Company". Keep it safe!
                        </p>

                        <button className="btn-cta" onClick={() => navigate('/workspace/hub')}>
                            Enter Admin Hub <ArrowRight size={16} />
                        </button>
                    </div>

                ) : mode === 'create' ? (
                    /* Claim/Create Workspace using Tracking ID */
                    <div className="setup-card">
                        <div className="card-icon card-icon-purple">
                            <Building2 size={28} />
                        </div>
                        <h2>Initialize Workspace</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Enter the <strong>Tracking ID</strong> you received when your company was approved. This will securely link you as the workspace admin.
                        </p>

                        <form onSubmit={handleClaimWorkspace}>
                            <div className="field-group">
                                <label>Approved Tracking ID</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        id="trackingId"
                                        type="text"
                                        placeholder="e.g. APP-A1B2C3"
                                        style={{ textTransform: 'uppercase', paddingLeft: '2.5rem' }}
                                        value={formData.trackingId}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="error-msg">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                                    Back
                                </button>
                                <button type="submit" className="btn-cta" disabled={isLoading} style={{ flex: 1 }}>
                                    {isLoading ? 'Verifying...' : <><Sparkles size={16} /> Verify & Create Workspace</>}
                                </button>
                            </div>
                        </form>
                        
                        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Are you a regular HR team member?</p>
                            <button onClick={() => setMode('join')} style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Use a 1-Time Invite Code instead
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Join Workspace using Invite Code */
                    <div className="setup-card">
                        <div className="card-icon card-icon-green">
                            <Users size={28} />
                        </div>
                        <h2>Join Workspace</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Enter the <strong>1-Time Invite Code</strong> you received from your administrator to securely join your company's HR portal.
                        </p>

                        <form onSubmit={handleJoin}>
                            <div className="field-group">
                                <label>1-Time Invite Code</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        id="inviteCode"
                                        type="text"
                                        placeholder="e.g. COMP-XYZ789"
                                        style={{ textTransform: 'uppercase', paddingLeft: '2.5rem' }}
                                        value={formData.inviteCode}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="error-msg">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                                    Back
                                </button>
                                <button type="submit" className="btn-cta" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', flex: 1 }} disabled={isLoading}>
                                    {isLoading ? 'Joining...' : <><Users size={16} /> Join Company</>}
                                </button>
                            </div>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Are you the Master Admin?</p>
                            <button onClick={() => setMode('create')} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Use a Tracking ID to initialize workspace
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
