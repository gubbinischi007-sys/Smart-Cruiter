import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { hrInvitesApi } from '../services/api';
import { ShieldCheck, User, Lock, Mail, CheckCircle, AlertCircle, Sparkles, Building2, Eye, EyeOff } from 'lucide-react';
import './Login.css';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setIsVerifying(false);
      setIsLoading(false);
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await hrInvitesApi.verify(token!);
      setInviteData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Verification failed. This link may be expired or invalid.');
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await hrInvitesApi.accept({
        token: token!,
        name: formData.name,
        password: formData.password
      });
      setIsLoading(false);
      // Success modal state or direct redirect
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create account.');
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="login-container">
        <div className="bg-ambience"><div className="bg-orb-purple" /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
           <div className="hr-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="bg-ambience">
        <div className="bg-orb-purple" />
        <div className="bg-orb-green" />
      </div>

      <div className="login-content" style={{ justifyContent: 'center' }}>
        <div className="right-panel" style={{ maxWidth: '480px', width: '100%' }}>
          <div className="login-form" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '2.5rem' }}>
            
            <div className="form-header">
              <div className="icon-box" style={{ margin: '0 auto 1.5rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', width: 'fit-content' }}>
                <Building2 size={32} />
              </div>
              <h2 className="form-title" style={{ fontSize: '1.75rem' }}>Setup Your Account</h2>
              <p className="form-subtitle">
                {inviteData ? (
                  <>You're joining <span style={{ color: '#818cf8', fontWeight: 600 }}>{inviteData.companies?.name}</span></>
                ) : 'Join your recruitment team'}
              </p>
            </div>

            {inviteData && !isLoading && !error && !inviteData.accepted ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#4b5563' }} />
                    <input type="email" className="form-input" value={inviteData.email} disabled style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.02)', color: '#64748b' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Rahul Sharma" 
                      style={{ paddingLeft: '2.5rem' }}
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Set Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-input" 
                      placeholder="Min. 6 characters" 
                      style={{ paddingLeft: '2.5rem' }}
                      value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input 
                      type={showConfirm ? 'text' : 'password'} 
                      className="form-input" 
                      placeholder="Re-enter password" 
                      style={{ paddingLeft: '2.5rem' }}
                      value={formData.confirmPassword}
                      onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="error-msg" style={{ marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={isLoading} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                  {isLoading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>
            ) : !isLoading && !error && inviteData?.accepted ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                 <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1.5rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem', color: 'white' }}>Registration Complete!</h3>
                    <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Your account is now ready. You can log in using your email and password.</p>
                    <button className="btn-primary" onClick={() => navigate('/login?role=hr')} style={{ background: '#10b981' }}>
                      Go to Login
                    </button>
                 </div>
              </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                   <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <AlertCircle size={48} style={{ margin: '0 auto 1.5rem' }} />
                      <h3 style={{ margin: '0 0 0.5rem', color: 'white' }}>Link Invalid</h3>
                      <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>{error || 'This invitation has expired or been cancelled.'}</p>
                      <button className="btn-primary" onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Return Home
                      </button>
                   </div>
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                © 2026 SmartRecruiter Platform. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
