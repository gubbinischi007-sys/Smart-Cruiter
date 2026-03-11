import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/supabase';
import {
  User, ArrowRight, ShieldCheck, Sparkles, ChevronLeft,
  Lock, Mail, CheckCircle, Briefcase, Eye, EyeOff, AlertCircle, Building2
} from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();

  const initMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [selectedRole, setSelectedRole] = useState<'hr' | 'applicant' | null>(null);
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot_password'>(initMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleTitle: '',
    companyPin: ''
  });

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const handleRoleSelect = (role: 'hr' | 'applicant') => {
    setSelectedRole(role);
    setViewMode(role === 'applicant' ? 'signup' : 'login');
    setFormData({ name: '', email: '', password: '', confirmPassword: '', roleTitle: '', companyPin: '' });
  };

  const handleBack = () => {
    setSelectedRole(null);
    setViewMode('login');
    setFormData({ name: '', email: '', password: '', confirmPassword: '', roleTitle: '', companyPin: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const showError = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message, type: 'error' });
  };

  const showSuccess = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message, type: 'success' });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !selectedRole) return;

    setIsLoading(true);
    try {
      const profile = await login(formData.email.trim(), formData.password.trim());

      // Validate role matches what user selected
      if (profile.role !== selectedRole) {
        showError('Role Mismatch', `This account is registered as a ${profile.role === 'hr' ? 'Recruiter/HR' : 'Job Seeker'}. Please select the correct role.`);
        setIsLoading(false);
        return;
      }

      if (profile.role === 'hr') {
        navigate('/admin');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please try again.';
      if (msg.includes('Email not confirmed')) {
        showError('Confirm Email', 'Please check your inbox and confirm your email before signing in.');
      } else if (msg.includes('Invalid login credentials')) {
        showError('Invalid Credentials', 'The email or password you entered is incorrect.');
      } else {
        showError('Sign In Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) return;

    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'Your passwords do not match. Please try again.');
      return;
    }
    if (formData.password.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      // register() now signs up AND populates auth state — no extra login() needed
      const profile = await register({
        email: formData.email.trim(),
        password: formData.password.trim(),
        name: formData.name.trim(),
        role: selectedRole!,
        roleTitle: formData.roleTitle.trim() || undefined,
      });

      // Redirect based on the returned profile role
      if (profile.role === 'hr') {
        navigate('/company-setup');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please try again.';
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
        showError('Already Registered', 'An account with this email already exists. Please sign in.');
      } else {
        showError('Registration Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;

    setIsLoading(true);
    try {
      await authService.resetPassword(formData.email.trim());
      showSuccess('Reset Link Sent', 'If an account exists for this email, you will receive a password reset link shortly.');
    } catch (err: any) {
      showError('Reset Failed', err?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isHR = selectedRole === 'hr';
  const accentColor = isHR ? '#6366f1' : '#22c55e';
  const accentGradient = isHR
    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
    : 'linear-gradient(135deg, #22c55e, #16a34a)';

  return (
    <div className="login-container">
      {/* Background Ambience */}
      <div className="bg-ambience">
        <div className="bg-orb-purple" />
        <div className="bg-orb-green" />
      </div>

      <div className="login-content">
        {/* Left: Branding */}
        <div className="intro-section">
          <div>
            <span className="intro-badge">
              <Sparkles size={14} style={{ marginRight: '6px', color: '#eab308' }} />
              Smart Recruitment Platform
            </span>
            <h1 className="intro-title">
              Hiring <br />
              <span className="gradient-text">Reimagined.</span>
            </h1>
            <p className="intro-desc">
              Connect with top talent or find your dream career. The all-in-one platform for modern recruitment teams.
            </p>
            {/* Trust signals */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['AI-powered resume screening', 'Real-time applicant tracking', 'Automated interview scheduling'].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="right-panel">
          {!selectedRole ? (
            /* Role Selection Cards */
            <div className="selection-cards">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Welcome back</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.5rem' }}>Choose your role to continue</p>
              </div>

              <div onClick={() => handleRoleSelect('hr')} className="role-card role-hr">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="icon-box"><ShieldCheck size={28} /></div>
                  <ArrowRight className="arrow-icon" />
                </div>
                <h3 className="card-title">Recruiter / HR</h3>
                <p className="card-desc">Manage jobs, review applicants, and track the hiring pipeline.</p>
              </div>

              <div onClick={() => handleRoleSelect('applicant')} className="role-card role-candidate">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="icon-box"><User size={28} /></div>
                  <ArrowRight className="arrow-icon" />
                </div>
                <h3 className="card-title">Candidate</h3>
                <p className="card-desc">Browse openings, track your applications, and get hired.</p>
              </div>
            </div>
          ) : (
            /* Login / Signup Form */
            <div className="login-form">
              <button className="btn-back" onClick={handleBack}>
                <ChevronLeft size={16} style={{ marginRight: '4px' }} />
                Back
              </button>

              {/* Icon + Title */}
              <div className="form-header">
                <div className="icon-box" style={{
                  margin: '0 auto 1rem auto',
                  backgroundColor: isHR ? 'rgba(99, 102, 241, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                  color: accentColor,
                  width: 'fit-content'
                }}>
                  {isHR ? <ShieldCheck size={32} /> : <User size={32} />}
                </div>
                <h2 className="form-title">
                  {viewMode === 'login'
                    ? (isHR ? 'Recruiter Sign In' : 'Candidate Sign In')
                    : viewMode === 'signup'
                      ? (isHR ? 'Create HR Account' : 'Create Account')
                      : 'Reset Password'}
                </h2>
                <p className="form-subtitle">
                  {viewMode === 'login' ? 'Enter your credentials to access your account' : viewMode === 'signup' ? 'Fill in your details to get started' : 'Enter your email to request a reset link'}
                </p>
              </div>

              {/* Tab Toggle - Login / Sign Up */}
              <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '1.75rem',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {(['login', 'signup'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.25s ease',
                      background: viewMode === mode ? accentGradient : 'transparent',
                      color: viewMode === mode ? 'white' : '#6b7280',
                      boxShadow: viewMode === mode ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    {mode === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* ======= LOGIN FORM ======= */}
              {viewMode === 'login' && (
                <form onSubmit={handleLoginSubmit}>
                  {/* Company PIN for HR login */}
                  {isHR && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="companyPin">Company PIN</label>
                      <div style={{ position: 'relative' }}>
                        <Building2 size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                          id="companyPin"
                          type="password"
                          className="form-input"
                          style={{ paddingLeft: '2.5rem' }}
                          placeholder="4-digit company PIN"
                          maxLength={4}
                          value={formData.companyPin}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="email" type="email" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                      <button type="button" onClick={() => setViewMode('forgot_password')} style={{ background: 'none', border: 'none', color: accentColor, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="password" type={showPassword ? 'text' : 'password'} className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={formData.password} onChange={handleChange} required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={isLoading}
                    style={{ background: accentGradient }}>
                    {isLoading ? 'Signing in...' : 'Sign In →'}
                  </button>
                </form>
              )}

              {/* ======= SIGNUP FORM ======= */}
              {viewMode === 'signup' && (
                <form onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="name" type="text" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="John Doe"
                        value={formData.name} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  {isHR && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="roleTitle">Your Role Title</label>
                        <div style={{ position: 'relative' }}>
                          <Briefcase size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            id="roleTitle" type="text" className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="e.g. Senior Recruiter"
                            value={formData.roleTitle} onChange={handleChange} required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="companyPin">Company PIN</label>
                        <div style={{ position: 'relative' }}>
                          <Building2 size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            id="companyPin" type="password" className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="4-digit company PIN"
                            maxLength={4}
                            value={formData.companyPin} onChange={handleChange} required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="email" type="email" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="password" type={showPassword ? 'text' : 'password'} className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="Min. 6 characters"
                        value={formData.password} onChange={handleChange} required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword} onChange={handleChange} required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={isLoading}
                    style={{ background: accentGradient }}>
                    {isLoading ? 'Creating account...' : 'Create Account →'}
                  </button>
                </form>
              )}

              {/* ======= FORGOT PASSWORD FORM ======= */}
              {viewMode === 'forgot_password' && (
                <form onSubmit={handleForgotPasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="email" type="email" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={isLoading}
                    style={{ background: accentGradient }}>
                    {isLoading ? 'Sending...' : 'Send Reset Link →'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalState.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${modalState.type}`}>
              {modalState.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3 className="modal-title">{modalState.title}</h3>
            <p className="modal-message">{modalState.message}</p>
            <button
              className={`modal-btn ${modalState.type}`}
              onClick={() => {
                closeModal();
                if (modalState.type === 'success') setViewMode('login');
              }}
            >
              {modalState.type === 'success' ? 'Continue to Sign In' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
