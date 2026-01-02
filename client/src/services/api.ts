import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  create: (data: any) => api.post('/applicants', data),
  update: (id: string, data: any) => api.put(`/applicants/${id}`, data),
  bulkUpdateStage: (applicant_ids: string[], stage: string) =>
    api.post('/applicants/bulk-update-stage', { applicant_ids, stage }),
  deleteAll: () => api.delete('/applicants'),
  delete: (id: string) => api.delete(`/applicants/${id}`),
  sendOffer: (id: string, data: { salary: string; joining_date: string; notes?: string; rules?: string }) =>
    api.patch(`/applicants/${id}/offer`, data),
  respondToOffer: (id: string, response: 'accepted' | 'rejected') =>
    api.post(`/applicants/${id}/offer-response`, { response }),
};

// Interviews API
export const interviewsApi = {
  getAll: (params?: { applicant_id?: string; job_id?: string; status?: string }) =>
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
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getApplicantsByStage: () => api.get('/analytics/applicants-by-stage'),
  getApplicantsOverTime: (days?: number) =>
    api.get('/analytics/applicants-over-time', { params: { days } }),
  getJobStats: (jobId: string) => api.get(`/analytics/job-stats/${jobId}`),
};

export default api;

