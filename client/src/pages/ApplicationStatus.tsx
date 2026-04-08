import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicantsApi, historyApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, PartyPopper, AlertCircle, Sparkles, UserCheck, Calendar } from 'lucide-react';
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
    rejection_reason?: string;
    score?: number;
}

export default function ApplicationStatus() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    const loadApplication = async () => {
        try {
            const response = await applicantsApi.getById(id!);
            setApplication(response.data);
        } catch (error) {
            console.warn('Applicant record not found, identifying via history fallback...');
            try {
                const historyRes = await historyApi.getAll(user.email!);
                const history = historyRes.data || [];
                const historyRecord = history[0]; 

                if (historyRecord) {
                    setApplication({
                        id: id!,
                        email: user.email!,
                        job_title: historyRecord.job_title,
                        stage: historyRecord.status === 'Accepted' ? 'hired' : 'rejected',
                        status: 'archived',
                        applied_at: historyRecord.date,
                        offer_status: historyRecord.status.toLowerCase()
                    });
                }
            } catch (historyErr) {
                console.error('Failed to load history fallback:', historyErr);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadApplication();

            // REAL-TIME SUBSCRIPTION
            const channel = supabase
                .channel(`app-status-${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'applicants',
                        filter: `id=eq.${id}`,
                    },
                    (payload) => {
                        console.log('Real-time update received:', payload);
                        setApplication(prev => ({ ...prev, ...payload.new } as Application));
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [id]);

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
    const isRejected = application.stage === 'declined' || application.stage === 'withdrawn' || application.stage === 'rejected';

    // Timeline Configuration
    const stagesOrdered = ['applied', 'shortlisted', 'interview', 'recommended', 'hired'];
    const currentStageIndex = stagesOrdered.indexOf(application.stage.toLowerCase());

    const timelineStages = [
        { key: 'applied', label: 'Application Submitted', icon: CheckCircle, desc: 'Your profile has been received.' },
        { key: 'shortlisted', label: 'Resume AI Match', icon: Sparkles, desc: 'Screening for technical alignment.' },
        { key: 'interview', label: 'Interview Process', icon: Calendar, desc: 'Technical & cultural evaluation.' },
        { key: 'recommended', label: 'Final Recommendation', icon: UserCheck, desc: 'Review by senior leadership.' },
        { key: 'hired', label: 'Hiring Decision', icon: PartyPopper, desc: 'Final outcome is issued.' }
    ];

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
                        </div>
                    ) : isRejected ? (
                        <div className="result-box danger">
                            <div className="icon-wrapper">
                                <XCircle size={48} />
                            </div>
                            <h2>Application Update</h2>
                            <p>We appreciate your interest. At this time, we are moving forward with other candidates.</p>
                            {application.rejection_reason && (
                                <div className="rejection-reason-box" style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'left' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fca5a5', lineHeight: '1.6' }}>
                                        <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.25rem' }}>HR Feedback:</strong> {application.rejection_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="result-box processing">
                            <div className="icon-wrapper">
                                <Clock size={48} />
                            </div>
                            <h2>Under Review</h2>
                            <p>Your application is currently being reviewed. Current stage: <strong style={{ textTransform: 'capitalize', color: '#818cf8' }}>{application.stage}</strong></p>
                            
                            {application.stage === 'shortlisted' && (
                                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
                                    <h3 style={{ margin: '0 0 0.5rem', color: '#818cf8' }}>Action Required: Interview</h3>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                        Congratulations! You have been shortlisted. Please schedule your initial interview below.
                                    </p>
                                    <a 
                                        href="https://cal.com/raksh-smart-cruiter/30min" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem' }}
                                    >
                                        <Calendar size={18} /> Schedule Interview (30 min)
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {application.offer_status === 'pending' && !isRejected && (
                        <div className="offer-letter-container animate-fade-in" style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-block', background: '#6366f1', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                <PartyPopper size={32} />
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Job Offer Received!</h2>
                            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Congratulations! Check your inbox to view full details.</p>
                            <Link to="/candidate/emails" className="btn btn-primary">Go to Inbox</Link>
                        </div>
                    )}
                </div>

                <div className="status-timeline">
                    {timelineStages.map((stage, index) => {
                        const isCompleted = index < currentStageIndex || isHired;
                        const isActive = index === currentStageIndex && !isHired && !isRejected;
                        const isTerminal = (isHired || isRejected) && index === 4;
                        const Icon = stage.icon;

                        let statusClass = '';
                        if (isCompleted) statusClass = 'completed';
                        if (isActive) statusClass = 'active';
                        if (isRejected && index === currentStageIndex) statusClass = 'completed danger';
                        
                        // Handle Rejection at any stage
                        if (isRejected && index >= currentStageIndex) {
                            if (index === currentStageIndex) {
                                return (
                                    <div key={stage.key} className="timeline-item completed danger">
                                        <div className="timeline-marker"><XCircle size={14} /></div>
                                        <div className="timeline-content">
                                            <h3 style={{ color: '#ef4444' }}>Process Stopped</h3>
                                            <p>Application was not selected after this stage.</p>
                                        </div>
                                    </div>
                                );
                            }
                            return null; // Don't show future stages after rejection
                        }

                        return (
                            <div key={stage.key} className={`timeline-item ${statusClass}`}>
                                <div className="timeline-marker">
                                    {(isCompleted || isTerminal) ? <CheckCircle size={14} /> : (isActive ? <div className="dot"></div> : null)}
                                </div>
                                <div className="timeline-content">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Icon size={16} color={(isCompleted || isActive) ? (index === 4 && isHired ? '#10b981' : '#818cf8') : '#4b5563'} />
                                        <h3>{stage.label}</h3>
                                    </div>
                                    <p>{stage.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
