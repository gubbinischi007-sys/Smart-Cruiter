import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { jobsApi } from '../services/api';
import { logAction } from '../utils/historyLogger';
import StatusModal from '../components/StatusModal';

export default function EditJob() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: '',
    description: '',
    requirements: '',
    status: 'open',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });


  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    if (!id) return;
    try {
      const response = await jobsApi.getById(id);
      const job = response.data;
      setFormData({
        title: job.title || '',
        department: job.department || '',
        location: job.location || '',
        type: job.type || '',
        description: job.description || '',
        requirements: job.requirements || '',
        status: job.status || 'open',
      });
    } catch (error) {
      console.error('Failed to load job:', error);
      // We will rely on loading logic for this usually, but a modal helps if user stuck
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load job details.',
      });
      // navigate('/admin/jobs'); // Only navigate on close
    } finally {
      setInitialLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    try {
      await jobsApi.update(id, formData);
      logAction(`Updated job: ${formData.title}`);

      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Job updated successfully.',
      });

    } catch (error) {
      console.error('Failed to update job:', error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update job details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setStatusModal(prev => ({ ...prev, isOpen: false }));
    // Navigate on success close
    if (statusModal.type === 'success') {
      navigate(`/admin/jobs/${id}`);
    } else if (statusModal.title === 'Error' && statusModal.message === 'Failed to load job details.') {
      navigate('/admin/jobs');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (initialLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/jobs" className="text-muted hover:text-white transition-colors" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back to Jobs
        </Link>
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Edit Job</h1>
        <p>Update job posting details</p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="type">Job Type</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange}>
              <option value="">Select type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="requirements">Requirements</label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Job'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/admin/jobs/${id}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={handleModalClose}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
      />
    </div>
  );
}
