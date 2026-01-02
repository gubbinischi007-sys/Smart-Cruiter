# Application URLs

## 🌐 Main Application URLs

### Frontend (User Interface)
- **Main Application**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/`
- **Jobs Page**: `http://localhost:3000/jobs`
- **Create Job**: `http://localhost:3000/jobs/new`
- **Applicants Page**: `http://localhost:3000/applicants`

### Backend API (for testing)
- **Health Check**: `http://localhost:3001/api/health`
- **API Base**: `http://localhost:3001/api`

---

## 📋 Dynamic URLs (Need Job/Applicant IDs)

These URLs require you to replace the IDs with actual IDs from your database:

### Job URLs
- **Job Detail (Admin)**: `http://localhost:3000/jobs/{job-id}`
  - Example: `http://localhost:3000/jobs/abc-123-def-456`
  
- **Edit Job**: `http://localhost:3000/jobs/{job-id}/edit`
  - Example: `http://localhost:3000/jobs/abc-123-def-456/edit`

- **Public Job (for candidates)**: `http://localhost:3000/jobs/{job-id}`
  - Same as Job Detail, but shows public view
  
- **Apply for Job**: `http://localhost:3000/jobs/{job-id}/apply`
  - Example: `http://localhost:3000/jobs/abc-123-def-456/apply`

### Applicant URLs
- **Applicant Detail**: `http://localhost:3000/applicants/{applicant-id}`
  - Example: `http://localhost:3000/applicants/xyz-789-abc-123`

---

## 🚀 Quick Start

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

3. **You'll see:**
   - Dashboard with analytics
   - Navigation bar with: Dashboard | Jobs | Applicants

---

## 📍 Where to Find Interview Scheduling

### Option 1: Via Jobs Page
1. Go to: `http://localhost:3000/jobs`
2. Click on any job
3. Scroll to "Applicants" section
4. Click "Schedule Interview" button

### Option 2: Via Applicants Page
1. Go to: `http://localhost:3000/applicants`
2. Click on any applicant's name
3. Look at right sidebar → "Interviews" section
4. Click "Schedule Interview" button

---

## 🔗 API Endpoints (for reference)

If you want to test the API directly:

- **Get all jobs**: `http://localhost:3001/api/jobs`
- **Get all applicants**: `http://localhost:3001/api/applicants`
- **Get dashboard stats**: `http://localhost:3001/api/analytics/dashboard`
- **Health check**: `http://localhost:3001/api/health`

---

## ⚠️ Important Notes

1. **Make sure the server is running** before accessing URLs
   - Run `npm run dev` from project root
   - Both server (port 3001) and client (port 3000) must be running

2. **Port Numbers:**
   - Frontend: **3000**
   - Backend API: **3001**

3. **Dynamic URLs:**
   - URLs with `{job-id}` or `{applicant-id}` need actual IDs
   - You'll get these IDs when you create jobs/applicants
   - IDs are visible in the browser URL after creating

4. **First Time Setup:**
   - Database is created automatically on first run
   - Create a job first to get a job ID
   - Then you can use that ID in URLs

---

## 🎯 Quick Test Flow

1. Start app: `npm run dev`
2. Open: `http://localhost:3000`
3. Create a job: `http://localhost:3000/jobs/new`
4. View jobs: `http://localhost:3000/jobs`
5. Click a job to see details
6. Share public URL with candidates to apply!

