import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setCompanyId = (companyId: string | null) => {
  if (companyId) {
    api.defaults.headers.common['x-company-id'] = companyId;
  } else {
    delete api.defaults.headers.common['x-company-id'];
  }
};

export const setUserRole = (role: string | null) => {
  if (role) {
    api.defaults.headers.common['x-user-role'] = role;
  } else {
    delete api.defaults.headers.common['x-user-role'];
  }
};

export const setUserEmail = (email: string | null) => {
  if (email) {
    api.defaults.headers.common['x-user-email'] = email;
  } else {
    delete api.defaults.headers.common['x-user-email'];
  }
};


// Jobs API
export const jobsApi = {
  getAll: (status?: string) => api.get('/jobs', { params: { status } }),
  getById: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
};

// Applicants API
export const applicantsApi = {
  getAll: (params?: { job_id?: string; stage?: string; status?: string; email?: string }) =>
    api.get('/applicants', { params }),
  getById: (id: string) => api.get(`/applicants/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post('/applicants', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/applicants', data);
  },
  update: (id: string, data: any) => api.put(`/applicants/${id}`, data),
  bulkUpdateStage: (applicant_ids: string[], stage: string, rejection_reason?: string) =>
    api.post('/applicants/bulk-update-stage', { applicant_ids, stage, rejection_reason }),
  deleteAll: () => api.delete('/applicants'),
  delete: (id: string) => api.delete(`/applicants/${id}`),
  sendOffer: (id: string, data: { salary: string; joining_date: string; notes?: string; rules?: string }) =>
    api.patch(`/applicants/${id}/offer`, data),
  respondToOffer: (id: string, response: 'accepted' | 'rejected') =>
    api.post(`/applicants/${id}/offer-response`, { response }),
};

// Interviews API
export const interviewsApi = {
  getAll: (params?: { applicant_id?: string; job_id?: string; status?: string; applicant_email?: string }) =>
    api.get('/interviews', { params }),
  getById: (id: string) => api.get(`/interviews/${id}`),
  create: (data: any) => api.post('/interviews', data),
  update: (id: string, data: any) => api.put(`/interviews/${id}`, data),
  delete: (id: string) => api.delete(`/interviews/${id}`),
};

// Email API
export const emailApi = {
  sendBulkAcceptance: (applicant_ids: string[]) =>
    api.post('/emails/bulk-acceptance', { applicant_ids }),
  sendBulkRejection: (applicant_ids: string[]) =>
    api.post('/emails/bulk-rejection', { applicant_ids }),
  sendDuplicateWarning: (applicant_ids: string[]) =>
    api.post('/emails/duplicate-warning', { applicant_ids }),
  sendIdentityWarning: (applicant_ids: string[]) =>
    api.post('/emails/identity-warning', { applicant_ids }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getApplicantsByStage: () => api.get('/analytics/applicants-by-stage'),
  getApplicantsOverTime: (days?: number) =>
    api.get('/analytics/applicants-over-time', { params: { days } }),
  getJobStats: (jobId: string) => api.get(`/analytics/job-stats/${jobId}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (email: string) => api.get('/notifications', { params: { email } }),
  getUnreadCount: (email: string) => api.get('/notifications/unread-count', { params: { email } }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  deleteBulk: (ids: string[]) => api.delete('/notifications', { data: { ids } }),
};

// Employees API
export const employeesApi = {
  getAll: () => api.get('/employees'),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.patch(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

export const referencesApi = {
  request: (data: { applicant_id: string; ref_name: string; ref_email: string; relationship?: string }) => 
    api.post('/references/request', data),
  getByApplicant: (applicantId: string) => 
    api.get(`/references/applicant/${applicantId}`),
  getFormDetails: (token: string) => 
    api.get(`/references/form/${token}`),
  submitForm: (token: string, responses: any) => 
    api.post(`/references/form/${token}/submit`, { responses }),
};

export const platformApi = {
  getCompanyStatus: (email: string) => 
    api.get(`/platform/status`, { params: { email } }),
  getCompanies: (status?: string) => 
    api.get('/platform/companies', { params: { status } }),
  verifyCompany: (id: string, status: 'approved' | 'rejected') => 
    api.post(`/platform/companies/${id}/verify`, { status }),
  registerCompany: (data: any) => 
    api.post('/platform/register', data),
};

// History API
export const historyApi = {
  getAll: (email?: string) => api.get('/history', { params: { email } }),
  create: (data: {
    name: string;
    email: string;
    job_title: string;
    status: 'Accepted' | 'Rejected' | 'Deactivated';
    reason: string;
  }) => api.post('/history', data),
  delete: (id: string) => api.delete(`/history/${id}`),
  clearAll: () => api.delete('/history'),
  getActivityLogs: () => api.get('/history/activity'),
  getSessions: () => api.get('/history/sessions'),
  startSession: (email: string) => api.post('/history/sessions/start', { email }),
  stopSession: (sessionId: string) => api.post('/history/sessions/stop', { sessionId }),
};

// HR Team API (Master Admin only)
export const hrTeamApi = {
  getAll: () => api.get('/hr-team'),
  create: (data: { name: string; email: string; password: string; role_title?: string }) =>
    api.post('/hr-team', data),
  suspend: (id: string) => api.patch(`/hr-team/${id}/suspend`),
  reactivate: (id: string) => api.patch(`/hr-team/${id}/reactivate`),
  delete: (id: string) => api.delete(`/hr-team/${id}`),
};

export const hrInvitesApi = {
  send: (data: { email: string; role_title?: string }) =>
    api.post('/hr-invites/send', data),
  verify: (token: string) => api.get(`/hr-invites/verify/${token}`),
  accept: (data: { token: string; name: string; password: string }) =>
    api.post('/hr-invites/accept', data),
};

export default api;


