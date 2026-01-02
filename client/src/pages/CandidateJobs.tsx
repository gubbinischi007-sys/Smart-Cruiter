import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Search, MapPin, Briefcase, Calendar, ArrowRight } from 'lucide-react';
import './CandidateJobs.css';

interface Job {
    id: string;
    title: string;
    department?: string;
    location?: string;
    type?: string;
    status: string;
    created_at: string;
}

// MOCK_JOBS removed

export default function CandidateJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            // Candidates only see open jobs
            const response = await jobsApi.getAll('open');
            setJobs(response.data || []);
        } catch (error) {
            console.error('Failed to load jobs:', error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center p-10"><div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 rounded-full border-t-transparent"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="jobs-hero">
                <h1>Find Your Dream Job</h1>
                <p>Browse our open positions and start your career journey with us today.</p>
            </div>

            <div className="search-container">
                <Search className="search-icon-wrapper" size={20} />
                <input
                    type="text"
                    placeholder="Search by role, department, or location..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="jobs-grid">
                {filteredJobs.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                            <Briefcase size={32} className="text-slate-500" />
                        </div>
                        <h3 className="text-xl font-medium text-white">No jobs available</h3>
                        <p className="text-slate-400 mt-2">Check back later for new opportunities.</p>
                    </div>
                ) : (
                    filteredJobs.map(job => (
                        <div key={job.id} className="card job-card">
                            <div className="job-card-header">
                                <div className="job-logo">
                                    {job.title.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="badge badge-open">Immediate Joiner</span>
                            </div>

                            <h3 className="job-card-title">{job.title}</h3>

                            <div className="job-details">
                                <div className="job-detail-item">
                                    <Briefcase size={14} className="detail-icon" />
                                    {job.department || 'Not specified'}
                                </div>
                                <div className="job-detail-item">
                                    <MapPin size={14} className="detail-icon" />
                                    {job.location || 'Remote'}
                                </div>
                                <div className="job-detail-item">
                                    <Calendar size={14} className="detail-icon" />
                                    {job.type || 'Full-time'}
                                </div>
                            </div>

                            <Link
                                to={`/public/jobs/${job.id}`}
                                className="view-btn"
                            >
                                View Details <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
