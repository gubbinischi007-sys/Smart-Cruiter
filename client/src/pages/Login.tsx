import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, ArrowRight, ShieldCheck, Sparkles, ChevronLeft, Lock, Mail, CheckCircle, Briefcase, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // State for flow control
  const [selectedRole, setSelectedRole] = useState<'hr' | 'applicant' | null>(null);
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'verification'>('login');

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Combined Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    roleTitle: '',
    companyPin: ''
  });

  /* ... handlers ... */
  const handleRoleSelect = (role: 'hr' | 'applicant') => {
    setSelectedRole(role);
    // User Request: Candidate button should open Register page
    if (role === 'applicant') {
      setViewMode('signup');
    } else {
      setViewMode('login');
    }
    setFormData({ ...formData, email: '', password: '', verificationCode: '', roleTitle: '', companyPin: '' });
  };

  const handleBack = () => {
    if (viewMode === 'verification') {
      setViewMode('signup');
    } else {
      setSelectedRole(null);
      setViewMode('login');
      setFormData({ ...formData, email: '', password: '', verificationCode: '', roleTitle: '', companyPin: '' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    if (!selectedRole) return;

    // Validate PIN for HR
    if (selectedRole === 'hr') {
      if (formData.companyPin !== '1975') {
        setModalState({
          isOpen: true,
          title: 'Access Denied',
          message: 'Invalid Company PIN. Please contact your administrator.',
          type: 'error'
        });
        return;
      }
    }

    setIsLoading(true);

    const email = formData.email.trim();
    const password = formData.password.trim();

    // Fake API call
    setTimeout(() => {
      // User Request: Validate candidate password against registered users
      if (selectedRole === 'applicant') {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = registeredUsers.find((u: any) => u.email === email);

        if (!user) {
          setModalState({
            isOpen: true,
            title: 'Account Not Found',
            message: 'We could not find an account with that email. Please create an account first.',
            type: 'error'
          });
          setIsLoading(false);
          return;
        }

        // Compare trimmed passwords for robustness
        if (user.password.trim() !== password) {
          setModalState({
            isOpen: true,
            title: 'Invalid Credentials',
            message: 'The password you entered is incorrect. Please try again.',
            type: 'error'
          });
          setIsLoading(false);
          return;
        }

        // Use registered name and title
        login(selectedRole, email, user.name, user.roleTitle);
      } else {
        // HR logic (existing)
        login(selectedRole, email, formData.name, formData.roleTitle);
      }

      if (selectedRole === 'hr') {
        navigate('/admin');
      } else {
        navigate('/candidate/dashboard');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) return;

    // Validate PIN for HR
    if (selectedRole === 'hr') {
      if (formData.companyPin !== '1975') {
        setModalState({
          isOpen: true,
          title: 'Restriction',
          message: 'Invalid Company PIN. Registration is restricted to authorized personnel only.',
          type: 'error'
        });
        return;
      }
    }

    setIsLoading(true);

    // Simulate sending code
    setTimeout(() => {
      setIsLoading(false);

      const email = formData.email.trim();
      const password = formData.password.trim();

      // User Request: In candidate after candidate registration move to sign in page
      if (selectedRole === 'applicant') {
        // Save user to localStorage
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        // Check if already exists
        const existingUserIndex = registeredUsers.findIndex((u: any) => u.email === email);

        const newUser = {
          email: email,
          password: password,
          name: formData.name,
          role: 'applicant',
          roleTitle: formData.roleTitle
        };

        if (existingUserIndex >= 0) {
          registeredUsers[existingUserIndex] = newUser; // Update existing
        } else {
          registeredUsers.push(newUser);
        }

        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        setModalState({
          isOpen: true,
          title: 'Registration Successful',
          message: 'Your account has been created! Please sign in with your password.',
          type: 'success'
        });
        setTimeout(() => setViewMode('login'), 2000); // Auto switch after delay, or user closes modal
      } else {
        setViewMode('verification');
      }
    }, 1000);
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.verificationCode) return;

    setIsLoading(true);

    // Simulate code verification
    setTimeout(() => {
      setIsLoading(false);

      // User Request: After registration (verification), display login page.
      // The applicant has to login manually.
      if (selectedRole) {
        login(selectedRole, formData.email, formData.name, formData.roleTitle);
        if (selectedRole === 'hr') {
          navigate('/admin');
        } else {
          navigate('/candidate/dashboard');
        }
      }
    }, 1000);
  };

  return (
    <div className="login-container">
      {/* Background Ambience */}
      <div className="bg-ambience">
        <div className="bg-orb-purple" />
        <div className="bg-orb-green" />
      </div>

      <div className="login-content">

        {/* Intro Section - Always Visible */}
        <div className="intro-section">
          <div>
            <span className="intro-badge">
              <Sparkles size={14} className="mr-2 text-yellow-500" style={{ color: '#eab308' }} />
              Smart Recruitment Platform
            </span>
            <h1 className="intro-title">
              Hiring <br />
              <span className="gradient-text">Reimagined.</span>
            </h1>
            <p className="intro-desc">
              Connect with top talent or find your dream career. The all-in-one platform for modern recruitment needs.
            </p>
          </div>
        </div>

        {/* Right Side: Logic Switcher */}
        <div className="right-panel">

          {!selectedRole ? (
            /* Login Selection Cards */
            <div className="selection-cards">
              {/* HR Card */}
              <div
                onClick={() => handleRoleSelect('hr')}
                className="role-card role-hr"
              >
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="icon-box">
                    <ShieldCheck size={28} />
                  </div>
                  <ArrowRight className="arrow-icon" />
                </div>
                <h3 className="card-title">Recruiter / HR</h3>
                <p className="card-desc">Access dashboard, manage jobs, and track applicants.</p>
              </div>

              {/* Candidate Card */}
              <div
                onClick={() => handleRoleSelect('applicant')}
                className="role-card role-candidate"
              >
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="icon-box">
                    <User size={28} />
                  </div>
                  <ArrowRight className="arrow-icon" />
                </div>
                <h3 className="card-title">Candidate</h3>
                <p className="card-desc">Browse openings, track applications, and get hired.</p>
              </div>
            </div>
          ) : (
            /* Login / Signup / Verification Forms */
            <div className="login-form">
              <button className="btn-back" onClick={handleBack}>
                <ChevronLeft size={16} className="mr-2" />
                {viewMode === 'verification' ? 'Back to Signup' : 'Back to Role Selection'}
              </button>

              <div className="form-header">
                <div className="icon-box" style={{
                  margin: '0 auto 1rem auto',
                  backgroundColor: selectedRole === 'hr' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: selectedRole === 'hr' ? '#818cf8' : '#4ade80',
                  width: 'fit-content'
                }}>
                  {viewMode === 'verification' ? <CheckCircle size={32} /> :
                    (selectedRole === 'hr' ? <ShieldCheck size={32} /> : <User size={32} />)}
                </div>

                <h2 className="form-title">
                  {viewMode === 'login' && (selectedRole === 'hr' ? 'Recruiter Login' : 'Candidate Login')}
                  {viewMode === 'signup' && (selectedRole === 'hr' ? 'Create Account' : 'Candidate Registration')}
                  {viewMode === 'verification' && 'Verify Account'}
                </h2>

                <p className="form-subtitle">
                  {viewMode === 'login' && 'Enter your credentials to access your account'}
                  {viewMode === 'signup' && 'Register your account to get started'}
                  {viewMode === 'verification' && 'Enter the code sent to your email'}
                </p>
              </div>

              {/* LOGIN FORM */}
              {viewMode === 'login' && (
                <form onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="name"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="e.g. John HR"
                        value={formData.name}
                        onChange={handleChange}
                        required={selectedRole === 'hr'}
                      />
                    </div>
                  </div>

                  {selectedRole === 'hr' && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="roleTitle">Role</label>
                        <div style={{ position: 'relative' }}>
                          <Briefcase size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            id="roleTitle"
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="e.g. Senior Recruiter"
                            value={formData.roleTitle || ''}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="companyPin">Company PIN</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            id="companyPin"
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="Enter 4-digit PIN"
                            maxLength={4}
                            value={formData.companyPin || ''}
                            onChange={handleChange}
                            required
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
                        id="email"
                        type="email"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                    style={{
                      background: selectedRole === 'applicant' ? 'linear-gradient(to right, #22c55e, #16a34a)' : undefined
                    }}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>

                  <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setViewMode('signup')}
                      style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              )}

              {/* SIGNUP FORM */}
              {viewMode === 'signup' && (
                <form onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="name"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {selectedRole === 'hr' && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="roleTitle">Role</label>
                        <div style={{ position: 'relative' }}>
                          <Briefcase size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            id="roleTitle"
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="e.g. Senior Recruiter"
                            value={formData.roleTitle || ''}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="companyPin">Company PIN</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                          <input
                            id="companyPin"
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="Enter 4-digit PIN"
                            maxLength={4}
                            value={formData.companyPin || ''}
                            onChange={handleChange}
                            required
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
                        id="email"
                        type="email"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                    style={{
                      background: selectedRole === 'applicant' ? 'linear-gradient(to right, #22c55e, #16a34a)' : undefined
                    }}
                  >
                    {isLoading ? 'Registering...' : 'Register'}
                  </button>

                  <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setViewMode('login')}
                      style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* VERIFICATION FORM */}
              {viewMode === 'verification' && (
                <form onSubmit={handleVerificationSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="verificationCode">Verification Code</label>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                      We sent a code to <span style={{ color: '#e5e7eb' }}>{formData.email}</span>
                    </p>
                    <div style={{ position: 'relative' }}>
                      <ShieldCheck size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="verificationCode"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', letterSpacing: '0.25rem', textAlign: 'center' }}
                        placeholder="000000"
                        maxLength={6}
                        value={formData.verificationCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                    style={{
                      background: selectedRole === 'applicant' ? 'linear-gradient(to right, #22c55e, #16a34a)' : undefined
                    }}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                  </button>

                  <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
                    Didn't receive code?{' '}
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Resend
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Custom Modal */}
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
                if (modalState.title === 'Registration Successful') {
                  setViewMode('login');
                }
              }}
            >
              {modalState.type === 'success' ? 'Continue' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
