import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsApi, applicantsApi, interviewsApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, UserCheck, Calendar, TrendingUp, Plus, ArrowRight, Brain, CheckCircle, Copy, History, AlertTriangle, ShieldCheck, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import './Dashboard.css';

interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  recentApplicants: number;
  scheduledInterviews: number;
  applicantsByStage: Array<{ stage: string; count: number }>;
  applicantsByJob: Array<{ job_id: string; job_title: string; count: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, appsRes, interviewsRes] = await Promise.all([
        analyticsApi.getDashboard(),
        applicantsApi.getAll(),
        interviewsApi.getAll()
      ]);

      setStats(statsRes.data);

      // Process recent applications (last 5)
      setRecentApplications(appsRes.data.slice(0, 5));

      // Process upcoming interviews (filter for future dates and take top 5)
      const now = new Date();
      const upcoming = interviewsRes.data
        .filter((i: any) => new Date(i.scheduled_at) > now)
        .slice(0, 5);
      setUpcomingInterviews(upcoming);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  /* Hook Initialization */
  const navigate = useNavigate();

  /* ... data loading ... */

  const handleExportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await applicantsApi.getAll();
      const applicants = response.data;

      const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Applied At'];
      const rows = applicants.map((app: any) => [
        app.id,
        app.first_name,
        app.last_name,
        app.email,
        app.job_title || 'N/A',
        app.status,
        new Date(app.applied_at).toLocaleDateString()
      ]);

      if (format === 'csv') {
        const csvContent = "data:text/csv;charset=utf-8,"
          + headers.join(",") + "\n"
          + rows.map((e: any[]) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "applicants_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        // Dynamic import to avoid SSR issues if any, and keep bundle size manageable
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Applicants Report', 14, 22);

        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        autoTable(doc, {
          startY: 36,
          head: [['Name', 'Email', 'Role', 'Status', 'Applied']],
          body: applicants.map((app: any) => [
            `${app.first_name} ${app.last_name}`,
            app.email,
            app.job_title || 'N/A',
            app.status,
            new Date(app.applied_at).toLocaleDateString()
          ]),
        });

        doc.save('applicants_report.pdf');
      }

    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to generate report');
    }
  };


  /* ... existing loadDashboard and render logic ... */
  // NOTE: I will return the FULL component body from standard "if (loading)" downwards to ensure correct placement, 
  // but replacing the entire cards block is cleaner.

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-muted" style={{ marginTop: '4rem' }}>Failed to load dashboard data.</div>;
  }

  const statCards = [
    { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: '#6366f1' },
    { label: 'Open Postings', value: stats.openJobs, icon: TrendingUp, color: '#10b981' },
    { label: 'Total Candidates', value: stats.totalApplicants, icon: Users, color: '#ec4899' },
    { label: 'New (30d)', value: stats.recentApplicants, icon: UserCheck, color: '#f59e0b' },
    { label: 'Interviews Scheduled', value: stats.scheduledInterviews, icon: Calendar, color: '#a855f7' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Overview of your recruitment pipeline.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="card stat-card" style={{ animationDelay: `${index * 100}ms` }}>
            <div>
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
            <div className="stat-icon-wrapper" style={{ background: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Smart Features Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Platform Intelligence & Tools</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Feature 1: Resume Intelligence */}
        <div className="card feature-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
              <Brain size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                Resume Match Score <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: '12px' }}>AI Screening</span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                Compares job description skills with resume keywords to generate a <strong>Match Score (e.g., 78% fit)</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-sm">Shortlist candidates faster</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-sm">Objective, data-driven decisions</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                Rule-based keyword relevance algorithm for transparent screening.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/applicants')}
            className="btn btn-primary"
            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
          >
            View Candidates
          </button>
        </div>

        {/* Feature 2: Duplicate Detection */}
        <div className="card feature-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
              <Copy size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                Duplicate Detection <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '12px' }}>Profile Integrity</span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                Prevents repeated submissions by checking email/resume against existing records.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                  <span className="text-sm">Warns candidate: "Record already exists"</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={14} style={{ color: '#3b82f6' }} />
                  <span className="text-sm">HR View: Previous jobs & application status</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span className="text-sm">Maintains clean applicant records</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                Improves efficiency by avoiding re-screening of same candidates.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/applicants')}
            className="btn btn-secondary"
            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#34d399' }}
          >
            Review Duplicates
          </button>
        </div>

        {/* Feature 3: Exportable Reports */}
        <div className="card feature-card" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(244, 63, 94, 0.05) 100%)', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
              <Download size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                Exportable Reports <span style={{ fontSize: '0.7rem', background: 'rgba(236, 72, 153, 0.2)', color: '#fda4af', padding: '2px 8px', borderRadius: '12px' }}>Business Data</span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                Download comprehensive recruitment data for analysis, reporting, and compliance.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={14} style={{ color: '#f43f5e' }} />
                  <span className="text-sm">PDF & CSV Formats Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet size={14} style={{ color: '#10b981' }} />
                  <span className="text-sm">Applicant Lists & Interview Reports</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-sm">Ready for Excel / Google Sheets</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                Perfect for monthly hiring reviews and management reporting.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={() => handleExportReport('csv')}
              className="btn btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                border: 'none',
                fontSize: '0.9rem',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FileSpreadsheet size={16} style={{ marginRight: '6px' }} /> Download CSV
            </button>
            <button
              onClick={() => handleExportReport('pdf')}
              className="btn btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', /* Purple/Indigo Gradient */
                border: 'none',
                fontSize: '0.9rem',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FileText size={16} style={{ marginRight: '6px' }} /> Download PDF
            </button>
          </div>
        </div>

      </div>

      {/* Charts Section Replaced with Actionable Widgets */}
      <div className="charts-grid">
        {/* Upcoming Interviews */}
        <div className="card">
          <div className="widget-header">
            <h2 className="chart-header" style={{ marginBottom: 0 }}>
              <Calendar size={20} className="text-primary" /> Upcoming Interviews
            </h2>
            <Link to="/admin/interviews" className="view-all-link">View All</Link>
          </div>
          <div className="widget-list">
            {upcomingInterviews.length === 0 ? (
              <div className="text-muted text-sm py-4">No upcoming interviews scheduled.</div>
            ) : (
              upcomingInterviews.map((interview) => (
                <div key={interview.id} className="widget-item">
                  <div className="widget-item-left">
                    <div className="widget-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h4 className="widget-item-title">{interview.applicant_name || 'Unknown Candidate'}</h4>
                      <p className="widget-item-subtitle">{interview.job_title || 'Unknown Role'}</p>
                    </div>
                  </div>
                  <div className="widget-item-right">
                    <div className="widget-time">{format(new Date(interview.scheduled_at), 'h:mm a')}</div>
                    <div className="widget-date">{format(new Date(interview.scheduled_at), 'MMM d')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="widget-header">
            <h2 className="chart-header" style={{ marginBottom: 0 }}>
              <Users size={20} className="text-primary" /> Recent Applications
            </h2>
            <Link to="/admin/applicants" className="view-all-link">View All</Link>
          </div>
          <div className="widget-list">
            {recentApplications.length === 0 ? (
              <div className="text-muted text-sm py-4">No recent applications.</div>
            ) : (
              recentApplications.map((app) => (
                <div key={app.id} className="widget-item">
                  <div className="widget-item-left">
                    <div className="widget-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h4 className="widget-item-title">{app.first_name} {app.last_name}</h4>
                      <p className="widget-item-subtitle">{app.job_title || 'Unknown Role'}</p>
                    </div>
                  </div>
                  <div className="widget-item-right">
                    <div className="text-xs text-muted mb-1" style={{ textAlign: 'right' }}>
                      {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                    </div>
                    <span className={`status-badge status-${app.status?.toLowerCase() || 'active'}`}>
                      {app.status || 'Active'}
                    </span>
                    <Link to={`/admin/applicants/${app.id}`} className="action-icon-btn">
                      <ArrowRight size={14} className="text-muted" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h2 className="chart-header">
            <Briefcase size={20} className="text-primary" /> Applicants per Job
          </h2>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.applicantsByJob} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="job_title" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="actions-header">Recent Activity</h2>
          <div className="activity-feed-container" style={{ marginTop: 0, marginBottom: 0 }}>
            <div className="activity-item">
              <div className="activity-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <Plus size={16} />
              </div>
              <div className="activity-content">
                <h4>New Applicant</h4>
                <div className="activity-time">2 hours ago • Sarah applied for Frontend Dev</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                <Calendar size={16} />
              </div>
              <div className="activity-content">
                <h4>Interview Scheduled</h4>
                <div className="activity-time">5 hours ago • Mike for Product Designer</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>
                <Briefcase size={16} />
              </div>
              <div className="activity-content">
                <h4>Job Created</h4>
                <div className="activity-time">1 day ago • Senior Backend Engineer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="actions-header">Quick Actions</h2>
        <div className="actions-row">
          <Link to="/admin/jobs" className="btn btn-secondary">
            View All Jobs <ArrowRight size={16} style={{ marginLeft: '8px' }} />
          </Link>
          <Link to="/admin/applicants" className="btn btn-secondary">
            Manage Applicants <Users size={16} style={{ marginLeft: '8px' }} />
          </Link>
          <Link to="/admin/interviews" className="btn btn-secondary">
            Schedule Interview <Calendar size={16} style={{ marginLeft: '8px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

