
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Plus, Briefcase, Edit2, Trash2, Eye, Search, X } from 'lucide-react';
import { logAction } from '../utils/historyLogger';
import './Jobs.css';

interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  type?: string;
  status: string;
  created_at: string;
}


export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadJobs();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filter]);

  const loadJobs = async () => {
    try {
      const status = filter !== 'all' ? filter : undefined;
      const response = await jobsApi.getAll(status);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      // setJobs([]); // Optional: clear jobs on error or keep previous state
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title?: string) => {
    // Confirmation removed as per user request
    try {
      await jobsApi.delete(id);
      logAction(`Deleted job: ${title || 'Unknown Job'}`);
      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      (job.department && job.department.toLowerCase().includes(query)) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-8" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gradient">Jobs</h1>
          <p className="text-muted">Manage your job positions and requirements.</p>
        </div>
        <Link to="/admin/jobs/new" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
          <Plus size={16} /> Create New Job
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="jobs-toolbar">
        <div className="filter-group">
          {['all', 'open', 'closed'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-wrapper-jobs">
          <Search className="search-icon-left" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search jobs..."
            className="search-input-premium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
            >
              <X size={14} />
            </button>
          )}
          <div className="search-shortcut">
            <kbd>⌘</kbd>K
          </div>
        </div>
      </div>

      {/* Jobs Table List */}
      <div className="jobs-table-container">
        {/* Table Header */}
        <div className="jobs-data-grid jobs-header">
          <div>Title</div>
          <div>Department</div>
          <div>Location</div>
          <div>Type</div>
          <div>Status</div>
          <div>Created</div>
          <div className="text-right" style={{ paddingRight: '0.5rem' }}>Actions</div>
        </div>

        {/* Table Body */}
        {filteredJobs.length === 0 ? (
          <div className="jobs-empty-state">
            <Briefcase size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No jobs found</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div>
            {filteredJobs.map((job) => (
              <div key={job.id} className="jobs-data-grid jobs-row">
                <div title={job.title}>
                  <Link to={`/admin/jobs/${job.id}`} className="job-title-link">
                    {job.title}
                  </Link>
                </div>
                <div className="job-cell-sub">{job.department || '—'}</div>
                <div className="job-cell-sub">{job.location || '—'}</div>
                <div className="job-cell-sub">{job.type || '—'}</div>
                <div>
                  <span className={`badge badge-${job.status}`}>
                    <span className="badge-dot"></span>
                    {job.status}
                  </span>
                </div>
                <div className="job-cell-sub">
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
                <div className="actions-cell">
                  <Link to={`/admin/jobs/${job.id}`} className="action-btn" title="View">
                    <Eye size={16} />
                  </Link>
                  <Link to={`/admin/jobs/${job.id}/edit`} className="action-btn" title="Edit">
                    <Edit2 size={16} />
                  </Link>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(job.id, job.title)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
