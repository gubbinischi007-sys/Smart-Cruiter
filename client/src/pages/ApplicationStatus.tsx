import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicantsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Clock, PartyPopper, AlertCircle } from 'lucide-react';
import './ApplicationStatus.css';

interface Application {
    id: string;
    email: string;
    job_title: string;
    stage: string;
    status: string;
    applied_at: string;
    offer_salary?: string;
    offer_joining_date?: string;
    offer_status?: string;
    offer_notes?: string;
    offer_rules?: string;
}

export default function ApplicationStatus() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadApplication();
        }
    }, [id]);

    const loadApplication = async () => {
        try {
            const response = await applicantsApi.getById(id!);
            setApplication(response.data);
        } catch (error) {
            console.error('Failed to load application status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOfferResponse = async (response: 'accepted' | 'rejected') => {
        if (!id) return;
        if (!confirm(`Are you sure you want to ${response} this offer?`)) return;

        try {
            await applicantsApi.respondToOffer(id, response);
            alert(`Offer ${response} successfully!`);
            loadApplication();
        } catch (error) {
            console.error('Failed to respond to offer:', error);
            alert('Failed to process offer response');
        }
    };

    if (loading) return <div className="loading-container">Loading status...</div>;

    if (!application || application.email !== user.email) return (
        <div className="error-container">
            <AlertCircle size={48} />
            <h2>Application Not Found</h2>
            <p className="text-muted">You do not have permission to view this application.</p>
            <Link to="/candidate/dashboard">Back to Dashboard</Link>
        </div>
    );

    const isHired = application.stage === 'hired';
    const isRejected = application.stage === 'declined' || application.stage === 'withdrawn';

    return (
        <div className="status-page animate-fade-in">
            <Link to="/candidate/dashboard" className="back-link">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="status-card card">
                <div className="status-header">
                    <h1>{application.job_title}</h1>
                    <p className="applied-date">Applied on {new Date(application.applied_at).toLocaleDateString()}</p>
                </div>

                <div className="status-body">
                    {isHired ? (
                        <div className="result-box success">
                            <div className="icon-wrapper">
                                <CheckCircle size={48} />
                            </div>
                            <h2>Congratulations!</h2>
                            <p>You have been hired for this position. Our team will contact you soon with the next steps.</p>
                            <div className="celebration-icon">
                                <PartyPopper size={32} />
                            </div>
                        </div>
                    ) : isRejected ? (
                        <div className="result-box danger">
                            <div className="icon-wrapper">
                                <XCircle size={48} />
                            </div>
                            <h2>Application Update</h2>
                            <p>Thank you for your interest. At this time, we have decided to move forward with other candidates.</p>
                        </div>
                    ) : (
                        <div className="result-box processing">
                            <div className="icon-wrapper">
                                <Clock size={48} />
                            </div>
                            <h2>Under Review</h2>
                            <p>Your application is currently being reviewed by our hiring team. Current stage: <strong>{application.stage}</strong></p>
                        </div>
                    )}

                    {application.offer_status === 'pending' && (
                        <div className="offer-letter-container animate-fade-in" style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: '#6366f1', color: 'white', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                    <PartyPopper size={24} />
                                </div>
                                <h2 style={{ margin: 0 }}>Job Offer Received!</h2>
                            </div>

                            <div className="offer-details" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Proposed Salary (Annual)</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{application.offer_salary}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Expected Joining Date</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{application.offer_joining_date}</p>
                                    </div>
                                </div>
                                {application.offer_notes && (
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Benefits & Notes</p>
                                        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                                            {application.offer_notes}
                                        </div>
                                    </div>
                                )}

                                {application.offer_rules && (
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Rules & Regulations</p>
                                        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.8)' }}>
                                            {application.offer_rules}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, height: '48px' }}
                                    onClick={() => handleOfferResponse('accepted')}
                                >
                                    Accept Offer
                                </button>
                                <button
                                    className="btn btn-danger-outline"
                                    style={{ flex: 1, height: '48px', borderColor: '#ef4444', color: '#ef4444' }}
                                    onClick={() => handleOfferResponse('rejected')}
                                >
                                    Decline Offer
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="status-timeline">
                    <div className="timeline-item completed">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                            <h3>Application Received</h3>
                            <p>Your application was successfully submitted.</p>
                        </div>
                    </div>

                    {application.stage !== 'applied' && (
                        <div className="timeline-item completed">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <h3>Initial Screening</h3>
                                <p>Hiring team review.</p>
                            </div>
                        </div>
                    )}

                    {(isHired || isRejected) && (
                        <div className={`timeline-item completed ${isHired ? 'success' : 'danger'}`}>
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <h3>Final Decision</h3>
                                <p>{isHired ? 'Hiring completed.' : 'Selection finalized.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
