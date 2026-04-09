import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { hrTeamApi, hrInvitesApi } from '../services/api';
import {
  ChevronLeft, UserPlus, Users, Mail, ShieldCheck, ShieldOff,
  Trash2, Eye, EyeOff, CheckCircle, AlertCircle, User, Briefcase,
  Lock, RefreshCw, Search, X, Send
} from 'lucide-react';
import './HRTeamManagement.css';

interface HRMember {
  id: string;
  name: string;
  email: string;
  role_title: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

type ModalType = { isOpen: false } | {
  isOpen: true;
  type: 'success' | 'error';
  title: string;
  message: string;
};

type ConfirmType = { isOpen: false } | {
  isOpen: true;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
};

export default function HRTeamManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany();

  const [members, setMembers] = useState<HRMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_title: '',
  });

  const [modal, setModal] = useState<ModalType>({ isOpen: false });
  const [confirm, setConfirm] = useState<ConfirmType>({ isOpen: false });

  const showModal = (type: 'success' | 'error', title: string, message: string) =>
    setModal({ isOpen: true, type, title, message });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await hrTeamApi.getAll();
      setMembers(res.data || []);
    } catch (err) {
      console.error('Failed to load HR team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      showModal('error', 'Missing Information', 'Please provide a name, email, and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await hrTeamApi.create(formData);
      showModal('success', 'Account Created!',
        `${formData.name} has been added to your HR team. They can now log in using their email and the password you set.`);
      setFormData({ name: '', email: '', password: '', role_title: '' });
      setShowCreateForm(false);
      loadMembers();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to create account.';
      showModal('error', 'Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = (member: HRMember) => {
    if (member.status === 'pending') {
        showModal('error', 'Action Not Possible', 'You cannot suspend a pending invitation. You can only delete it.');
        return;
    }
    setConfirm({
      isOpen: true,
      title: `Suspend ${member.name}?`,
      message: `This will immediately block ${member.name} from signing in. They cannot access any company data until reactivated.`,
      confirmLabel: 'Suspend Access',
      danger: true,
      onConfirm: async () => {
        setConfirm({ isOpen: false });
        try {
          await hrTeamApi.suspend(member.id);
          showModal('success', 'Access Suspended', `${member.name}'s access has been suspended.`);
          loadMembers();
        } catch (err: any) {
          showModal('error', 'Failed', err?.response?.data?.error || 'Could not suspend member.');
        }
      },
    });
  };

  const handleReactivate = (member: HRMember) => {
    setConfirm({
      isOpen: true,
      title: `Reactivate ${member.name}?`,
      message: `This will restore full portal access for ${member.name} using their existing credentials.`,
      confirmLabel: 'Reactivate',
      danger: false,
      onConfirm: async () => {
        setConfirm({ isOpen: false });
        try {
          await hrTeamApi.reactivate(member.id);
          showModal('success', 'Access Restored', `${member.name} can now sign in again.`);
          loadMembers();
        } catch (err: any) {
          showModal('error', 'Failed', err?.response?.data?.error || 'Could not reactivate member.');
        }
      },
    });
  };

  const handleDelete = (member: HRMember) => {
    const isPending = member.status === 'pending';
    setConfirm({
      isOpen: true,
      title: isPending ? `Cancel Invitation?` : `Permanently Delete ${member.name}?`,
      message: isPending 
        ? `This will cancel the invitation sent to ${member.email}. The link will no longer work.`
        : `This will permanently delete ${member.name}'s account. This action CANNOT be undone. All their data will be removed from the system.`,
      confirmLabel: isPending ? 'Cancel Invitation' : 'Delete Permanently',
      danger: true,
      onConfirm: async () => {
        setConfirm({ isOpen: false });
        try {
          if (isPending) {
             // We can use the same delete endpoint if we update the backend, 
             // but for now I'll just assume we delete by id in user_profiles or hr_invitations.
             // Actually I'll use a new endpoint or update the existing one.
             await hrTeamApi.delete(member.id); 
          } else {
             await hrTeamApi.delete(member.id);
          }
          showModal('success', isPending ? 'Invitation Cancelled' : 'Account Deleted', isPending ? 'The invitation has been revoked.' : `${member.name}'s account has been permanently deleted.`);
          loadMembers();
        } catch (err: any) {
          showModal('error', 'Failed', err?.response?.data?.error || 'Could not process request.');
        }
      },
    });
  };

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hr-mgmt-container animate-fade-in">
      {/* Top Bar */}
      <div className="hr-mgmt-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-back-hub" onClick={() => navigate('/workspace/hub')}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>HR Team Management</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#818cf8' }}>{company?.name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{user.name}</span>
          <button
            className="btn-create-hr"
            onClick={() => setShowCreateForm(true)}
          >
            <UserPlus size={16} />
            Add HR Member
          </button>
        </div>
      </div>

      <div className="hr-mgmt-content">
        {/* Stats Row */}
        <div className="hr-stats-row">
          <div className="hr-stat-card">
            <Users size={20} style={{ color: '#818cf8' }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{members.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Total HR Members</div>
            </div>
          </div>
          <div className="hr-stat-card">
            <ShieldCheck size={20} style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{members.filter(m => m.status === 'active').length}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Active Members</div>
            </div>
          </div>
          <div className="hr-stat-card">
            <ShieldOff size={20} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{members.filter(m => m.status === 'pending').length}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Pending Invites</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hr-search-bar">
          <Search size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '0.9rem' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0 }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Members Table */}
        <div className="hr-table-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="hr-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Users size={48} style={{ color: '#374151', margin: '0 auto 1rem' }} />
              <p style={{ color: '#6b7280', margin: 0 }}>
                {searchTerm ? 'No members match your search.' : 'No HR members yet. Create the first account.'}
              </p>
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role Title</th>
                  <th>Date Added</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="hr-avatar">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'white' }}>{member.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                        <Mail size={14} />
                        {member.email}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        {member.role_title || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>Not set</span>}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                        {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span className={`hr-badge ${member.status === 'active' ? 'hr-badge-active' : member.status === 'suspended' ? 'hr-badge-suspended' : 'hr-badge-pending'}`}>
                        {member.status === 'active' ? <ShieldCheck size={12} /> : member.status === 'suspended' ? <ShieldOff size={12} /> : <RefreshCw size={12} className="animate-spin" />}
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {member.status === 'active' && (
                          <button
                            className="hr-action-btn hr-btn-suspend"
                            onClick={() => handleSuspend(member)}
                            title="Suspend Access"
                          >
                            <ShieldOff size={14} /> Suspend
                          </button>
                        )}
                        
                        {member.status === 'suspended' && (
                          <button
                            className="hr-action-btn hr-btn-reactivate"
                            onClick={() => handleReactivate(member)}
                            title="Reactivate Access"
                          >
                            <RefreshCw size={14} /> Reactivate
                          </button>
                        )}

                        {member.status === 'pending' ? (
                          <button
                            className="hr-action-btn hr-btn-suspend"
                            style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            onClick={() => handleDelete(member)}
                            title="Cancel Invitation"
                          >
                            <X size={14} /> Cancel Invite
                          </button>
                        ) : (
                          <button
                            className="hr-action-btn hr-btn-delete"
                            onClick={() => handleDelete(member)}
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Invite HR Account Slide-Over ── */}
      {showCreateForm && (
        <div className="hr-slideover-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="hr-slideover" onClick={e => e.stopPropagation()}>
            <div className="hr-slideover-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Create HR Account</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                  Create a new account manually. You will set their initial password.
                </p>
              </div>
              <button onClick={() => setShowCreateForm(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Name */}
              <div className="hr-field">
                <label className="hr-label">Full Name *</label>
                <div className="hr-input-wrapper">
                  <User size={16} className="hr-input-icon" />
                  <input
                    type="text"
                    className="hr-input"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              {/* Email */}
              <div className="hr-field">
                <label className="hr-label">Work Email *</label>
                <div className="hr-input-wrapper">
                  <Mail size={16} className="hr-input-icon" />
                  <input
                    type="email"
                    className="hr-input"
                    placeholder="e.g. sarah@gmail.com"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Role Title */}
              <div className="hr-field">
                <label className="hr-label">Role Title <span style={{ color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                <div className="hr-input-wrapper">
                  <Briefcase size={16} className="hr-input-icon" />
                  <input
                    type="text"
                    className="hr-input"
                    placeholder="e.g. Senior Recruiter"
                    value={formData.role_title}
                    onChange={e => setFormData(p => ({ ...p, role_title: e.target.value }))}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="hr-field">
                <label className="hr-label">Set Password *</label>
                <div className="hr-input-wrapper">
                  <Lock size={16} className="hr-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="hr-input"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="hr-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="hr-btn-cancel"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hr-btn-submit"
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  <UserPlus size={16} />
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Status Modal ── */}
      {modal.isOpen && (
        <div className="hr-modal-overlay" onClick={() => setModal({ isOpen: false })}>
          <div className="hr-modal" onClick={e => e.stopPropagation()}>
            <div className={`hr-modal-icon ${modal.type}`}>
              {modal.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
            </div>
            <h3 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>{modal.title}</h3>
            <p style={{ color: '#9ca3af', margin: '0 0 1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>{modal.message}</p>
            <button
              className={`hr-modal-btn ${modal.type}`}
              onClick={() => setModal({ isOpen: false })}
            >
              {modal.type === 'success' ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirm.isOpen && (
        <div className="hr-modal-overlay" onClick={() => setConfirm({ isOpen: false })}>
          <div className="hr-modal" onClick={e => e.stopPropagation()}>
            <div className="hr-modal-icon error">
              <AlertCircle size={28} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>{confirm.title}</h3>
            <p style={{ color: '#9ca3af', margin: '0 0 1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>{confirm.message}</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="hr-btn-cancel"
                style={{ flex: 1 }}
                onClick={() => setConfirm({ isOpen: false })}
              >
                Cancel
              </button>
              <button
                className={`hr-modal-btn ${confirm.danger ? 'error' : 'success'}`}
                style={{ flex: 1 }}
                onClick={confirm.onConfirm}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
