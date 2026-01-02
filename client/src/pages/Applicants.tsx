import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicantsApi, jobsApi, emailApi } from '../services/api';
import { XCircle, CheckCircle, User, Briefcase, Copy, GitMerge } from 'lucide-react';
import './Applicants.css';

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  stage: string;
  job_id: string;
  job_title: string;
  applied_at: string;
  resume_url?: string;
}

export default function Applicants() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    job_id: '',
    stage: '',
    status: '',
  });

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'accept' | 'reject' | 'merge' | null;
    reason: string
  }>({
    isOpen: false,
    type: null,
    reason: ''
  });

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [filters]);

  const loadJobs = async () => {
    try {
      const response = await jobsApi.getAll();
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadApplicants = async () => {
    try {
      const params: any = {};
      if (filters.job_id) params.job_id = filters.job_id;
      if (filters.stage) params.stage = filters.stage;
      if (filters.status) params.status = filters.status;

      const response = await applicantsApi.getAll(params);
      setApplicants(response.data);
    } catch (error) {
      console.error('Failed to load applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (applicantId: string, newStage: string) => {
    try {
      await applicantsApi.update(applicantId, { stage: newStage });
      loadApplicants();
    } catch (error) {
      console.error('Failed to update applicant stage:', error);
      alert('Failed to update applicant stage');
    }
  };

  const getChevronColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'hired': return '%2334d399'; // emerald-400
      case 'declined': return '%23fb7185'; // rose-400
      case 'shortlisted': return '%23a78bfa'; // violet-400
      case 'recommended': return '%23fbbf24'; // amber-400
      case 'withdrawn': return '%2394a3b8'; // slate-400
      default: return '%2360a5fa'; // blue-400
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

  const handleBulkAcceptance = () => {
    if (selectedApplicants.size === 0) return;
    setConfirmationModal({
      isOpen: true,
      type: 'accept',
      reason: 'Your profile matches our requirements perfectly.'
    });
  };

  const handleBulkRejection = () => {
    if (selectedApplicants.size === 0) return;
    setConfirmationModal({
      isOpen: true,
      type: 'reject',
      reason: 'We have decided to move forward with other candidates.'
    });
  };

  const handleBulkMerge = () => {
    if (selectedApplicants.size < 2) {
      alert("Please select at least 2 candidates to merge.");
      return;
    }
    setConfirmationModal({
      isOpen: true,
      type: 'merge',
      reason: 'Consolidating duplicate applicant profiles.'
    });
  };

  const confirmAction = async () => {
    const { type, reason } = confirmationModal;
    if (!type) return;

    try {
      if (type === 'merge') {
        const selectedIds = Array.from(selectedApplicants);
        // Master record logic: Keep the first one selected
        // In a real scenario, user might choose the master.
        const duplicates = selectedIds.slice(1);

        // Simulate merging by deleting duplicates
        await Promise.all(duplicates.map(id => applicantsApi.delete(id)));

        alert(`Merged ${duplicates.length} duplicate profile(s) into the master record.`);
        setSelectedApplicants(new Set());
        loadApplicants();
      } else {
        // Prepare History Records
        const applicantsToProcess = applicants.filter(app => selectedApplicants.has(app.id));
        const historyRecords = applicantsToProcess.map(app => ({
          id: app.id,
          name: `${app.first_name} ${app.last_name}`,
          email: app.email,
          job_title: app.job_title,
          status: type === 'accept' ? 'Accepted' : 'Rejected',
          reason: reason,
          date: new Date().toISOString()
        }));

        // Send Emails
        if (type === 'accept') {
          await emailApi.sendBulkAcceptance(Array.from(selectedApplicants));
        } else {
          await emailApi.sendBulkRejection(Array.from(selectedApplicants));
        }

        // Save History
        const existingHistory = JSON.parse(localStorage.getItem('applicationHistory') || '[]');
        localStorage.setItem('applicationHistory', JSON.stringify([...existingHistory, ...historyRecords]));

        // Delete Applicants
        await Promise.all(Array.from(selectedApplicants).map(id => applicantsApi.delete(id)));

        alert(`${type === 'accept' ? 'Acceptance' : 'Rejection'} processed and applicants removed.`);
        setSelectedApplicants(new Set());
        loadApplicants();
      }
    } catch (error) {
      console.error(`Failed to process action ${type}:`, error);
      alert(`Failed to process action ${type}`);
    } finally {
      setConfirmationModal({ isOpen: false, type: null, reason: '' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative">
      {/* Standard Enterprise Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-container">
            <div className="premium-modal-content">
              <div className="modal-header">
                <div
                  className={`modal-header-icon ${confirmationModal.type === 'accept' ? 'icon-bg-accept' : confirmationModal.type === 'merge' ? 'icon-bg-merge' : 'icon-bg-reject'}`}
                  style={confirmationModal.type === 'merge' ? { background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' } : {}}
                >
                  {confirmationModal.type === 'accept' ? <CheckCircle size={24} /> : confirmationModal.type === 'merge' ? <GitMerge size={24} /> : <XCircle size={24} />}
                </div>
                <h3 className="modal-title">
                  {confirmationModal.type === 'accept' ? 'Accept Applicant' : confirmationModal.type === 'merge' ? 'Merge Applicants' : 'Reject Applicant'}
                </h3>
              </div>

              <span className="modal-subtitle">
                {confirmationModal.type === 'merge'
                  ? `Are you sure you want to merge ${selectedApplicants.size} profiles? This will keep one record and delete the rest.`
                  : `Are you sure you want to ${confirmationModal.type === 'accept' ? 'accept' : 'reject'} ${selectedApplicants.size} applicant${selectedApplicants.size > 1 ? 's' : ''}?`
                }
              </span>

              <div className="modal-form-group">
                <label className="modal-form-label">Reason</label>
                <textarea
                  className="modal-textarea"
                  rows={3}
                  placeholder="Enter reason..."
                  value={confirmationModal.reason}
                  onChange={(e) => setConfirmationModal({ ...confirmationModal, reason: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setConfirmationModal({ isOpen: false, type: null, reason: '' })}
                  className="modal-btn btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`modal-btn ${confirmationModal.type === 'accept' ? 'btn-confirm-accept' : 'btn-confirm-reject'}`}
                >
                  {confirmationModal.type === 'merge' ? 'Merge' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Applicants</h1>
          <p className="text-muted">Manage and track candidate progress.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group mb-0">
            <label className="text-xs uppercase font-bold text-muted mb-2 block">Job Position</label>
            <div className="relative">
              <select
                value={filters.job_id}
                onChange={(e) => setFilters({ ...filters, job_id: e.target.value })}
                className="w-full bg-[#1e293b80] border border-[#ffffff10] rounded-lg p-2 text-white appearance-none focus:outline-none focus:border-primary"
              >
                <option value="">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="text-xs uppercase font-bold text-muted mb-2 block">Stage</label>
            <div className="relative">
              <select
                value={filters.stage}
                onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                className="w-full bg-[#1e293b80] border border-[#ffffff10] rounded-lg p-2 text-white appearance-none focus:outline-none focus:border-primary"
              >
                <option value="">All Stages</option>
                {['Applied', 'Shortlisted', 'Recommended', 'Hired', 'Declined', 'Withdrawn'].map(s => (
                  <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="text-xs uppercase font-bold text-muted mb-2 block">Status</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-[#1e293b80] border border-[#ffffff10] rounded-lg p-2 text-white appearance-none focus:outline-none focus:border-primary"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {selectedApplicants.size > 0 && (
          <div className="bg-[#6366f120] border-b border-[#6366f140] p-4 flex items-center animate-fade-in" style={{ gap: '3rem' }}>
            <span className="text-primary font-medium">{selectedApplicants.size} applicant(s) selected</span>
            <div className="flex" style={{ gap: '2rem' }}>
              <button onClick={handleBulkMerge} className="btn btn-sm btn-secondary flex items-center gap-2" style={{ border: '1px solid rgba(99, 102, 241, 0.5)', color: '#818cf8', background: 'transparent' }}>
                <GitMerge size={14} /> Merge Candidates
              </button>
              <button onClick={handleBulkAcceptance} className="btn btn-sm btn-success flex items-center gap-2">
                <CheckCircle size={14} /> Send Acceptance
              </button>
              <button onClick={handleBulkRejection} className="btn btn-sm btn-danger flex items-center gap-2">
                <XCircle size={14} /> Send Rejection
              </button>
            </div>
          </div>
        )}
        <table className="table w-full">
          <thead>
            <tr>
              <th className="w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-600 bg-transparent"
                  checked={selectedApplicants.size === applicants.length && applicants.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedApplicants(new Set(applicants.map((a) => a.id)));
                    else setSelectedApplicants(new Set());
                  }}
                />
              </th>
              <th>Candidate</th>
              <th>Email</th>
              <th>Applied For</th>
              <th>Current Stage</th>
              <th>Date Applied</th>
              <th>Match Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applicants.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted">
                  <div className="flex flex-col items-center">
                    <User size={48} className="mb-4 opacity-20" />
                    <p>No applicants found matching your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              applicants.map((applicant) => (
                <tr key={applicant.id} className="hover:bg-[#ffffff05] transition-colors">
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-transparent"
                      checked={selectedApplicants.has(applicant.id)}
                      onChange={() => toggleApplicantSelection(applicant.id)}
                    />
                  </td>
                  <td>
                    <Link to={`/admin/applicants/${applicant.id}`} className="flex items-center gap-3 group">
                      <div>
                        <div className="font-medium text-white group-hover:text-primary transition-colors" style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {applicant.first_name} {applicant.last_name}
                          {applicants.filter(a => a.email === applicant.email).length > 1 && (
                            <span
                              title="Duplicate Candidate Detected"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                fontSize: '0.65rem',
                                padding: '1px 6px',
                                borderRadius: '99px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 700
                              }}
                            >
                              <Copy size={10} /> Duplicate
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="text-sm text-muted">{applicant.email}</td>
                  <td>
                    <Link to={`/admin/jobs/${applicant.job_id}`} className="flex items-center gap-1 text-sm text-muted hover:text-white transition-colors">
                      <Briefcase size={12} /> {applicant.job_title}
                    </Link>
                  </td>
                  <td>
                    <select
                      value={applicant.stage}
                      onChange={(e) => handleStageChange(applicant.id, e.target.value)}
                      className={`stage-badge stage-${applicant.stage.toLowerCase()}`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${getChevronColor(applicant.stage)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
                      }}
                    >
                      {['Applied', 'Shortlisted', 'Recommended', 'Hired', 'Declined', 'Withdrawn'].map(s => (
                        <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-sm text-muted">{new Date(applicant.applied_at).toLocaleDateString()}</td>
                  <td>
                    {(() => {
                      // Simulated AI Score
                      // score = (unique_char_code_sum % 30) + 70  -> Range 70-99
                      // If no resume, score is 0
                      const score = applicant.resume_url ? 70 + (applicant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 30) : 0;

                      let color = '#ef4444'; // red
                      if (score === 0) color = '#94a3b8'; // slate/gray for no resume
                      else if (score >= 90) color = '#10b981'; // green
                      else if (score >= 80) color = '#8b5cf6'; // violet
                      else if (score >= 70) color = '#f59e0b'; // orange

                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: `3px solid ${color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: 'rgba(255,255,255,0.05)'
                          }}>
                            {score}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: color }}>Match</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <Link to={`/admin/applicants/${applicant.id}`} className="btn btn-sm btn-secondary">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
