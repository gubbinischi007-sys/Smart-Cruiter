import { CheckCircle, XCircle } from 'lucide-react';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: 'success' | 'error';
}

export default function StatusModal({
    isOpen,
    onClose,
    title,
    message,
    type
}: StatusModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    color: type === 'success' ? '#10b981' : '#ef4444'
                }}>
                    {type === 'success' ? <CheckCircle size={32} /> : <XCircle size={32} />}
                </div>

                <h3 style={{
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    fontFamily: 'Outfit, sans-serif'
                }}>
                    {title}
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '32px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                    {message}
                </p>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        color: 'white',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
