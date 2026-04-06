import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../lib/supabase';
import { Settings, Shield, RefreshCw, Copy, CheckCircle, Save, Variable, Image, Lock, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatusModal from '../components/StatusModal';
import './WorkspaceSettings.css';

export default function WorkspaceSettings() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { company, refetch } = useCompany();
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
    }>({ isOpen: false, type: 'success', title: '', message: '' });

    const [formData, setFormData] = useState({
        aboutUs: '',
        brandColor: '#6366f1',
        logoUrl: ''
    });

    useEffect(() => {
        if (company) {
            setFormData({
                aboutUs: (company as any).about_us || '',
                brandColor: (company as any).brand_color || '#6366f1',
                logoUrl: company.logo_url || ''
            });
        }
    }, [company]);

    const handleRegenerateCode = async () => {
        if (!company) return;
        setIsLoading(true);
        try {
            const newCode = Math.random().toString(36).substring(2, 10);
            const { error } = await supabase
                .from('companies')
                .update({ invite_code: newCode })
                .eq('id', company.id);

            if (error) throw error;
            await refetch();
            
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Code Regenerated',
                message: 'Your Join Company Code has been refreshed perfectly. Old codes will no longer work.'
            });
        } catch (error: any) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Operation Failed',
                message: error.message || 'Failed to regenerate code'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBranding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ 
                    about_us: formData.aboutUs,
                    logo_url: formData.logoUrl
                })
                .eq('id', company.id);

            if (error) throw error;
            await refetch();
            
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Settings Saved',
                message: 'Company branding has been successfully updated.'
            });
        } catch (error: any) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Save Failed',
                message: error.message || 'Failed to update branding settings.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyCode = () => {
        if (company) {
            navigator.clipboard.writeText(company.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!company) return null;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div className="workspace-settings-container animate-fade-in" style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                
                {/* Minimal Top Bar for Standalone Page */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                        onClick={() => navigate('/workspace/hub')} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                        <ArrowLeft size={16} /> Back to Hub
                    </button>
                    <button 
                        onClick={logout} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                            <Settings size={32} style={{ color: '#6366f1' }}/> Workspace Settings
                        </h1>
                        <p style={{ color: '#9ca3af', margin: 0 }}>Manage your company's branding and access security.</p>
                    </div>
                </div>

            <div className="settings-grid">
                {/* SECURITY SECTION */}
                <div className="card settings-card">
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                        <H2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield color="#6366f1" size={24} /> Access Security
                        </H2>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>CURRENT JOIN COMPANY CODE</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Lock size={18} color="#22c55e" />
                                <code style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: 'white', letterSpacing: '0.1em' }}>{company.invite_code}</code>
                            </div>
                            <button onClick={copyCode} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                {copied ? <CheckCircle size={16} color="#22c55e" /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem' }}>
                            Share this code with new HR members so they can authenticate. If compromised, regenerate it immediately.
                        </p>
                    </div>

                    <button 
                        onClick={handleRegenerateCode} 
                        disabled={isLoading}
                        className="btn-danger"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                        {isLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={18} />}
                        Regenerate Join Code
                    </button>
                </div>

                {/* BRANDING SECTION */}
                <div className="card settings-card">
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                        <H2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Variable color="#ec4899" size={24} /> Company Branding
                        </H2>
                    </div>

                    <form onSubmit={handleSaveBranding}>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', display: 'block' }}>Company Logo URL</label>
                            <div style={{ position: 'relative' }}>
                                <Image size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                <input 
                                    type="text"
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                    placeholder="https://example.com/logo.png"
                                    value={formData.logoUrl}
                                    onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>



                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', display: 'block' }}>About Us (Career Page)</label>
                            <textarea 
                                style={{ width: '100%', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', minHeight: '120px', resize: 'vertical' }}
                                placeholder="Describe your company culture, mission, and why candidates should join your team..."
                                value={formData.aboutUs}
                                onChange={e => setFormData({...formData, aboutUs: e.target.value})}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="btn-cta"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Save size={18} />
                            Save Branding Changes
                        </button>
                    </form>
                </div>
            </div>
            
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                title={statusModal.title}
                message={statusModal.message}
                type={statusModal.type}
            />
        </div>
        </div>
    );
}

// Temporary H2 wrapper
const H2 = ({ children, className }: any) => <h2 className={className}>{children}</h2>;
