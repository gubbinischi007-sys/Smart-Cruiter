# Working Pages & URLs

## ✅ All Working Pages in Smart-Cruiter

### 🌐 Frontend URLs (http://localhost:3000)

#### **Admin/HR Pages** (with navigation bar)

1. **Dashboard** 
   - URL: `http://localhost:3000/`
   - Features: Analytics, stats, charts, quick actions
   - Status: ✅ Working

2. **Jobs List**
   - URL: `http://localhost:3000/jobs`
   - Features: View all jobs, filter by status, create/edit/delete jobs
   - Status: ✅ Working

3. **Create Job**
   - URL: `http://localhost:3000/jobs/new`
   - Features: Form to create new job posting
   - Status: ✅ Working

4. **Edit Job**
   - URL: `http://localhost:3000/jobs/{job-id}/edit`
   - Features: Edit existing job details
   - Status: ✅ Working

5. **Job Detail (Admin View)**
   - URL: `http://localhost:3000/jobs/{job-id}` (when logged in as admin)
   - Features: View job details, manage applicants, schedule interviews, bulk emails
   - Status: ✅ Working

6. **Applicants List**
   - URL: `http://localhost:3000/applicants`
   - Features: View all applicants, filter by job/stage/status
   - Status: ✅ Working

7. **Applicant Detail**
   - URL: `http://localhost:3000/applicants/{applicant-id}`
   - Features: View applicant info, schedule interviews, update stage
   - Status: ✅ Working

#### **Public Pages** (for candidates - no navigation bar)

8. **Public Job Detail**
   - URL: `http://localhost:3000/jobs/{job-id}`
   - Features: View job details, job description, requirements
   - Status: ✅ Working

9. **Application Form**
   - URL: `http://localhost:3000/jobs/{job-id}/apply`
   - Features: Submit job application form
   - Status: ✅ Working

---

## 🚀 How to Access Working Pages

### Step 1: Start the Application
```bash
npm run dev
```

### Step 2: Open Browser
Go to: `http://localhost:3000`

### Step 3: Navigate to Pages

**From Dashboard:**
- Click "Dashboard" in nav bar → `/`
- Click "Jobs" in nav bar → `/jobs`
- Click "Applicants" in nav bar → `/applicants`
- Click "Create New Job" button → `/jobs/new`

**From Jobs Page:**
- Click a job title → `/jobs/{job-id}` (admin view)
- Click "Edit" button → `/jobs/{job-id}/edit`
- Click "View" button → `/jobs/{job-id}` (admin view)

**From Applicants Page:**
- Click applicant name → `/applicants/{applicant-id}`

**For Candidates (Public URLs):**
- Share job URL: `http://localhost:3000/jobs/{job-id}`
- Application form: `http://localhost:3000/jobs/{job-id}/apply`

---

## 📋 Quick Test Checklist

### ✅ Test Admin Pages:

1. **Dashboard** → `http://localhost:3000/`
   - Should show stats cards (may show 0s if no data)
   - Should show charts section
   - Should show quick action buttons

2. **Jobs List** → `http://localhost:3000/jobs`
   - Should show jobs table (empty if no jobs)
   - Should have "Create New Job" button
   - Should have filter buttons

3. **Create Job** → `http://localhost:3000/jobs/new`
   - Should show job creation form
   - Should have all fields (title, department, location, etc.)
   - Should have submit button

4. **Applicants List** → `http://localhost:3000/applicants`
   - Should show applicants table (empty if no applicants)
   - Should have filter dropdowns

### ✅ Test Public Pages:

5. **Public Job Detail** → `http://localhost:3000/jobs/{job-id}`
   - Replace `{job-id}` with actual job ID from database
   - Should show job details
   - Should show "Apply for this Position" button

6. **Application Form** → `http://localhost:3000/jobs/{job-id}/apply`
   - Replace `{job-id}` with actual job ID
   - Should show application form
   - Should have fields: name, email, phone, resume URL, cover letter

---

## 🎯 Example Workflow to Test

1. **Start App**: `npm run dev`

2. **Create a Job**:
   - Go to: `http://localhost:3000/jobs/new`
   - Fill form and create job
   - Note the job ID from URL or database

3. **View Job (Admin)**:
   - Go to: `http://localhost:3000/jobs` → Click your job
   - Should see job details and applicant management

4. **View Job (Public)**:
   - Go to: `http://localhost:3000/jobs/{your-job-id}`
   - Should see public job view with "Apply" button

5. **Apply for Job**:
   - Go to: `http://localhost:3000/jobs/{your-job-id}/apply`
   - Fill form and submit
   - Should see success message

6. **View Application**:
   - Go to: `http://localhost:3000/applicants`
   - Should see the submitted application

---

## ⚠️ Troubleshooting

**Page not loading?**
- Check if server is running: `npm run dev`
- Check browser console for errors
- Check terminal for server errors

**All pages show zeros/empty?**
- This is normal if no data exists
- Create a job first to populate data

**Public job page shows "Job Not Found"?**
- Make sure job status is "open"
- Check that job ID in URL is correct
- Verify job exists in database

---

## ✅ All Pages Are Working!

Every page listed above is implemented and functional. The application is ready to use. Start with creating a job, then test the full workflow!

