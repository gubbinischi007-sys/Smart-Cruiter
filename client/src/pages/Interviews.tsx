import { Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Interviews() {
    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '3rem' }}>
                <Link to="/admin/dashboard" className="inline-flex items-center text-muted hover:text-white transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Dashboard
                </Link>
            </div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Interviews</h1>
                <p className="text-muted">Manage your upcoming interviews.</p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Calendar size={40} color="#6366f1" />
                </div>
                <h2 className="text-2xl font-bold mb-4">No Interviews Scheduled</h2>
                <p className="text-muted mb-8" style={{ maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                    You haven't scheduled any interviews yet. Go to the applicants page to schedule an interview with a candidate.
                </p>
                <Link to="/admin/applicants" className="btn btn-primary btn-sm" style={{ width: 'fit-content', margin: '0 auto' }}>
                    View Applicants
                </Link>
            </div>
        </div>
    );
}
