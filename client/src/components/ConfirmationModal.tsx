import { CheckCircle, AlertTriangle, Trash2, AlertCircle, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'success' | 'danger' | 'warning' | 'info' | 'delete';
    confirmLabel?: string;
    cancelLabel?: string;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    // Dynamic Styles & Icons based on type
    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    color: '#10b981',
                    bg: 'rgba(16, 185, 129, 0.1)',
                    icon: <CheckCircle size={32} />,
                    btnShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                };
            case 'delete':
                return {
                    color: '#ef4444',
                    bg: 'rgba(239, 68, 68, 0.1)',
                    icon: <Trash2 size={32} />,
                    btnShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                };
            case 'danger':
                return {
                    color: '#ef4444',
                    bg: 'rgba(239, 68, 68, 0.1)',
                    icon: <AlertCircle size={32} />,
                    btnShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                };
            case 'warning':
                return {
                    color: '#f59e0b',
                    bg: 'rgba(245, 158, 11, 0.1)',
                    icon: <AlertTriangle size={32} />,
                    btnShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                };
            case 'info':
            default:
                return {
                    color: '#3b82f6',
                    bg: 'rgba(59, 130, 246, 0.1)',
                    icon: <Info size={32} />,
                    btnShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                };
        }
    };

    const styles = getStyles();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                transform: 'translateY(0)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    backgroundColor: styles.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: styles.color
                }}>
                    {styles.icon}
                </div>

                <h3 style={{
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    marginBottom: '8px',
                    fontFamily: 'inherit'
                }}>
                    {title}
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5', fontSize: '0.95rem' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            backgroundColor: styles.color,
                            border: 'none',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            boxShadow: styles.btnShadow,
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        className="active:scale-95"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
