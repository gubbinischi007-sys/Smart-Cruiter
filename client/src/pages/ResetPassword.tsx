import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import './Login.css';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event == "PASSWORD_RECOVERY") {
                // We are successfully in the recovery flow
                console.log("Password recovery flow started");
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        try {
            await authService.updatePassword(password);
            setSuccess('Your password has been successfully reset. You can now log in.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err?.message || 'Failed to reset password. The link might be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="bg-ambience">
                <div className="bg-orb-purple" />
                <div className="bg-orb-green" />
            </div>

            <div className="login-content" style={{ maxWidth: '500px', margin: '0 auto', display: 'block', padding: '2rem' }}>
                <div className="right-panel" style={{ width: '100%' }}>
                    <div className="login-form">
                        <h2 className="form-title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h2>
                        <p className="form-subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            Enter your new password below.
                        </p>

                        {error && (
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', color: '#86efac', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} />
                                <span>{success}</span>
                            </div>
                        )}

                        {!success && (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="password">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input
                                            id="password" type={showPassword ? 'text' : 'password'} className="form-input"
                                            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                            placeholder="Min. 6 characters"
                                            value={password} onChange={(e) => setPassword(e.target.value)} required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input
                                            id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="form-input"
                                            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                            placeholder="Re-enter your password"
                                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary" disabled={isLoading}
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', marginTop: '1rem' }}>
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
