import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applicants from './pages/Applicants';
import ApplicantDetail from './pages/ApplicantDetail';
import CreateJob from './pages/CreateJob';
import EditJob from './pages/EditJob';
import PublicJobDetail from './pages/PublicJobDetail';
import ApplyJob from './pages/ApplyJob';
import Login from './pages/Login';
import CandidateLayout from './components/CandidateLayout';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateJobs from './pages/CandidateJobs';
import ApplicationStatus from './pages/ApplicationStatus';
import ProtectedRoute from './components/ProtectedRoute';
import Interviews from './pages/Interviews';

import History from './pages/History';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/public/jobs/:id" element={<PublicJobDetail />} />
      <Route path="/public/jobs/:id/apply" element={<ApplyJob />} />

      {/* Candidate routes */}
      <Route path="/candidate" element={
        <ProtectedRoute allowedRole="applicant">
          <CandidateLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<CandidateDashboard />} />
        <Route path="jobs" element={<CandidateJobs />} />
        <Route path="applications/:id/status" element={<ApplicationStatus />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin/HR routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="hr">
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<CreateJob />} />
        <Route path="jobs/:id/edit" element={<EditJob />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="applicants" element={<Applicants />} />
        <Route path="history" element={<History />} />

        <Route path="applicants/:id" element={<ApplicantDetail />} />
        <Route path="interviews" element={<Interviews />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

