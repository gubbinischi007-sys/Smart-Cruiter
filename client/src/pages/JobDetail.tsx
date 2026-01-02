import { ArrowLeft, Share2, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';
import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobsApi, applicantsApi, analyticsApi, interviewsApi } from '../services/api';
import { logAction } from '../utils/historyLogger';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  type?: string;
  description?: string;
  requirements?: string;
  status: string;
  created_at: string;
}

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  stage: string;
  applied_at: string;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set());
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [selectedApplicantForInterview, setSelectedApplicantForInterview] = useState<string | null>(null);
  const [interviewForm, setInterviewForm] = useState({
    scheduled_at: '',
    type: 'online',
    meeting_link: '',
    notes: '',
  });
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [jobRes, applicantsRes, statsRes] = await Promise.all([
        jobsApi.getById(id),
        applicantsApi.getAll({ job_id: id }),
        analyticsApi.getJobStats(id),
      ]);
      setJob(jobRes.data);
      setApplicants(applicantsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAcceptance = async () => {
    if (selectedApplicants.size === 0) {
      alert('Please select at least one applicant');
      return;
    }

    if (!confirm(`Send acceptance emails to ${selectedApplicants.size} applicants?`)) return;

    try {
      const { emailApi } = await import('../services/api');
      await emailApi.sendBulkAcceptance(Array.from(selectedApplicants));
      logAction(`Bulk accepted ${selectedApplicants.size} applicants`);
      alert('Acceptance emails sent successfully');
      setSelectedApplicants(new Set());
      loadData();
    } catch (error) {
      console.error('Failed to send acceptance emails:', error);
      alert('Failed to send acceptance emails');
    }
  };

  const handleBulkRejection = async () => {
    if (selectedApplicants.size === 0) {
      alert('Please select at least one applicant');
      return;
    }

    if (!confirm(`Send rejection emails to ${selectedApplicants.size} applicants?`)) return;

    try {
      const { emailApi } = await import('../services/api');
      await emailApi.sendBulkRejection(Array.from(selectedApplicants));
      logAction(`Bulk rejected ${selectedApplicants.size} applicants`);
      alert('Rejection emails sent successfully');
      setSelectedApplicants(new Set());
      loadData();
    } catch (error) {
      console.error('Failed to send rejection emails:', error);
      alert('Failed to send rejection emails');
    }
  };

  const toggleApplicantSelection = (applicantId: string) => {
    const newSelected = new Set(selectedApplicants);
    if (newSelected.has(applicantId)) {
      newSelected.delete(applicantId);
    } else {
      newSelected.add(applicantId);
    }
    setSelectedApplicants(newSelected);
  };

  const handleStageUpdate = async (applicantId: string, newStage: string) => {
    try {
      await applicantsApi.update(applicantId, { stage: newStage });
      logAction(`Updated applicant ${applicantId} stage to ${newStage}`);
      loadData();
    } catch (error) {
      console.error('Failed to update applicant stage:', error);
      alert('Failed to update applicant stage');
    }
  };

  const handleScheduleInterview = (applicantId: string) => {
    setSelectedApplicantForInterview(applicantId);
    setShowInterviewForm(true);
    setInterviewForm({
      scheduled_at: '',
      type: 'online',
      meeting_link: '',
      notes: '',
    });
  };

  const handleInterviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !selectedApplicantForInterview) return;

    const applicant = applicants.find(a => a.id === selectedApplicantForInterview);
    if (!applicant) return;

    try {
      await interviewsApi.create({
        applicant_id: selectedApplicantForInterview,
        job_id: id,
        ...interviewForm,
      });
      logAction(`Scheduled interview for applicant ${selectedApplicantForInterview} on ${interviewForm.scheduled_at}`);
      alert('Interview scheduled successfully!');
      setShowInterviewForm(false);
      setSelectedApplicantForInterview(null);
      setInterviewForm({
        scheduled_at: '',
        type: 'online',
        meeting_link: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      alert('Failed to schedule interview');
    }
  };

  const jobLink = `${window.location.origin}/public/jobs/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(jobLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobLink)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = `Check out this opening for ${job?.title} at ${job?.department || 'our company'}: ${jobLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/jobs" className="text-muted hover:text-white transition-colors" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back to Jobs
        </Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>{job.title}</h1>
          <p>
            {job.department && <span>{job.department}</span>}
            {job.location && <span> • {job.location}</span>}
            {job.type && <span> • {job.type}</span>}
          </p>
        </div>
        <Link to={`/admin/jobs/${id}/edit`} className="btn btn-sm btn-primary" style={{ width: 'fit-content' }}>
          Edit Job
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Job Details</h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> <span className={`badge badge-${job.status}`}>{job.status}</span>
          </div>
          {job.description && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Description:</strong>
              <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div>
              <strong>Requirements:</strong>
              <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Share Job Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={18} className="text-primary" /> Share this Job
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Share this opening to reach more candidates.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button
                onClick={handleShareWhatsApp}
                title="Share on WhatsApp"
                style={{
                  flex: 1,
                  background: '#25D366',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <MessageCircle size={20} />
              </button>
              <button
                onClick={handleShareLinkedIn}
                title="Share on LinkedIn"
                style={{
                  flex: 1,
                  background: '#0a66c2',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Linkedin size={20} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginRight: '0.5rem'
              }}>
                {jobLink}
              </div>
              <button
                onClick={handleCopyLink}
                style={{
                  background: 'none',
                  border: 'none',
                  color: linkCopied ? '#10b981' : 'var(--primary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Copy Link"
              >
                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {stats && (
            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>Statistics</h2>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Total Applicants:</strong> {stats.totalApplicants}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Total Interviews:</strong> {stats.totalInterviews}
              </div>
              {stats.applicantsByStage && stats.applicantsByStage.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>By Stage</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.applicantsByStage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Applicants ({applicants.length})</h2>
          {selectedApplicants.size > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-success btn-sm" onClick={handleBulkAcceptance}>
                Send Acceptance ({selectedApplicants.size})
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleBulkRejection}>
                Send Rejection ({selectedApplicants.size})
              </button>
            </div>
          )}
        </div>

        {showInterviewForm && selectedApplicantForInterview && (
          <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Schedule Online Interview</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowInterviewForm(false);
                  setSelectedApplicantForInterview(null);
                }}
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleInterviewSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduled_at}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Interview Type *</label>
                <select
                  value={interviewForm.type}
                  onChange={(e) => setInterviewForm({ ...interviewForm, type: e.target.value })}
                >
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Meeting Link * (for online interviews)</label>
                <input
                  type="url"
                  value={interviewForm.meeting_link}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxxxxx"
                  required={interviewForm.type === 'online'}
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  Provide Zoom, Google Meet, Teams, or other meeting platform link
                </small>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Notes</label>
                <textarea
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  rows={4}
                  placeholder="Additional notes or instructions for the candidate..."
                />
              </div>
              <div style={{ display: 'flex', marginTop: '24px', position: 'relative', zIndex: 10, justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowInterviewForm(false);
                    setSelectedApplicantForInterview(null);
                  }}
                  className="btn btn-sm"
                  style={{
                    width: 'fit-content',
                    height: '36px',
                    boxSizing: 'border-box',
                    backgroundColor: '#334155',
                    color: '#f8fafc',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '13px',
                    padding: '0 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  style={{
                    width: 'fit-content',
                    height: '36px',
                    boxSizing: 'border-box',
                    border: '1px solid transparent',
                    fontSize: '13px',
                    padding: '0 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Schedule Interview
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedApplicants.size === applicants.length && applicants.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApplicants(new Set(applicants.map((a) => a.id)));
                      } else {
                        setSelectedApplicants(new Set());
                      }
                    }}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Stage</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No applicants yet
                  </td>
                </tr>
              ) : (
                applicants.map((applicant) => (
                  <tr key={applicant.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedApplicants.has(applicant.id)}
                        onChange={() => toggleApplicantSelection(applicant.id)}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/admin/applicants/${applicant.id}`}
                        style={{ textDecoration: 'none', color: '#2563eb' }}
                      >
                        {applicant.first_name} {applicant.last_name}
                      </Link>
                    </td>
                    <td>{applicant.email}</td>
                    <td>
                      <select
                        value={applicant.stage}
                        onChange={(e) => handleStageUpdate(applicant.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      >
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="recommended">Recommended</option>
                        <option value="hired">Hired</option>
                        <option value="declined">Declined</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </td>
                    <td>{new Date(applicant.applied_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          to={`/admin/applicants/${applicant.id}`}
                          className="btn btn-sm btn-secondary"
                          style={{ width: 'fit-content', whiteSpace: 'nowrap', height: '32px', boxSizing: 'border-box' }}
                        >
                          View
                        </Link>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleScheduleInterview(applicant.id)}
                          style={{ width: 'fit-content', whiteSpace: 'nowrap', height: '32px', boxSizing: 'border-box', border: '1px solid transparent' }}
                        >
                          Schedule Interview
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

