import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
    ShieldCheck, Sparkles, User, Mail, Lock, 
    Building2, ArrowRight, Eye, EyeOff, AlertCircle,
    CheckCircle, Key, Briefcase
} from 'lucide-react';

export default function ClaimWorkspace() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register } = useAuth();
    const trackingId = searchParams.get('tid');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [company, setCompany] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        roleTitle: 'Company Owner',
        password: '',
        companyPin: '',
        confirmPin: ''
    });

    useEffect(() => {
        if (!trackingId) {
            setError('Valid Tracking ID is required to claim a workspace.');
            setIsLoading(false);
            return;
        }

        const fetchCompany = async () => {
            try {
                const { data, error: rpcError } = await supabase.rpc('get_application_status', {
                    p_tracking_id: trackingId.toUpperCase()
                });

                if (rpcError) throw rpcError;
                if (!data) throw new Error('Company application not found.');

                if (data.status !== 'approved') {
                    throw new Error('This workspace is not approved yet.');
                }

                if (data.setup_completed) {
                    throw new Error('This workspace has already been claimed.');
                }

                setCompany(data);
            } catch (err: any) {
                setError(err.message || 'Failed to verify tracking ID.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompany();
    }, [trackingId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.companyPin !== formData.confirmPin) {
            setError('The Company PINs do not match.');
            return;
        }

        if (formData.companyPin.length < 4) {
            setError('Company PIN should be at least 4 characters for security.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create the Owner Account
            const profile = await register({
                email: formData.email.trim(),
                password: formData.password.trim(),
                name: formData.name.trim(),
                role: 'hr',
                roleTitle: formData.roleTitle.trim(),
            });

            if (!profile?.id) throw new Error('Failed to create account profile.');

            // 2. Claim workspace via secure RPC
            const { error: rpcError } = await supabase.rpc('claim_workspace', {
                p_tracking_id: trackingId.toUpperCase(),
                p_company_pin: formData.companyPin.trim(),
                p_owner_id: profile.id
            });

            if (rpcError) throw rpcError;

            // Success redirect to dashboard
            navigate('/admin/dashboard');

        } catch (err: any) {
            setError(err.message || 'An error occurred during setup.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Sparkles className="animate-spin" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Securing your portal...</span>
                </div>
            </div>
        );
    }

    if (error && !company) {
        return (
            <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <div style={{ maxWidth: 400, width: '100%', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Setup Restricted</h2>
                    <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>{error}</p>
                    <button onClick={() => navigate('/track-application')} style={{ width: '100%', padding: '0.75rem', background: 'white', color: 'black', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                        Back to Tracker
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
            {/* Background Ambience */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(168,85,247,0.05)', filter: 'blur(80px)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 480, width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '2.5rem', backdropFilter: 'blur(16px)' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '0.4rem 1rem', marginBottom: '1.25rem' }}>
                            <ShieldCheck size={14} color="#10b981" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified & Approved</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Claim {company?.name}</h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Set your account and private company access PIN</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* ── PART 1: OWNER ACCOUNT ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Identity</h3>
                            
                            <div className="form-group">
                                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Your Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#475569' }} />
                                    <input id="name" type="text" placeholder="John Doe" required value={formData.name} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#475569' }} />
                                    <input id="email" type="email" placeholder="owner@company.com" required value={formData.email} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Create Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#475569' }} />
                                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required value={formData.password} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── PART 2: COMPANY PIN ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Configuration</h3>
                            
                            <div className="form-group">
                                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Create Company PIN</label>
                                <div style={{ position: 'relative' }}>
                                    <Key size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#475569' }} />
                                    <input id="companyPin" type="password" placeholder="Set a private PIN for your team" required value={formData.companyPin} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, color: 'white', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.2em' }} />
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.4rem' }}>Share this with your HR staff to let them join the portal.</p>
                            </div>

                            <div className="form-group">
                                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Confirm Company PIN</label>
                                <div style={{ position: 'relative' }}>
                                    <Key size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#475569' }} />
                                    <input id="confirmPin" type="password" placeholder="Re-enter PIN" required value={formData.confirmPin} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.2em' }} />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.75rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting} style={{
                            width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
                            borderRadius: 12, color: 'white', fontWeight: 700, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', transition: 'all 0.2s', marginTop: '1rem'
                        }}>
                            {isSubmitting ? 'Configuring Portal...' : <>Complete Setup <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
