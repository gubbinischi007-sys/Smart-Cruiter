# Simple URL List - Smart-Cruiter

## 📍 Total: 9 URLs

### Main URL (Start Here)
**1. Dashboard**
```
http://localhost:3000/
```
This is your main page with analytics and stats.

---

### Admin Pages (For HR/Recruiters)

**2. Jobs List**
```
http://localhost:3000/jobs
```
View all jobs, create new jobs, manage jobs.

**3. Create New Job**
```
http://localhost:3000/jobs/new
```
Form to create a new job posting.

**4. Edit Job**
```
http://localhost:3000/jobs/{job-id}/edit
```
Edit an existing job. Replace {job-id} with actual job ID.

**5. Job Detail (Admin View)**
```
http://localhost:3000/jobs/{job-id}
```
View job details, see applicants, schedule interviews, send emails.
Replace {job-id} with actual job ID.

**6. Applicants List**
```
http://localhost:3000/applicants
```
View all applicants who applied for jobs.

**7. Applicant Detail**
```
http://localhost:3000/applicants/{applicant-id}
```
View applicant information, schedule interviews.
Replace {applicant-id} with actual applicant ID.

---

### Public Pages (For Candidates)

**8. Public Job Detail**
```
http://localhost:3000/jobs/{job-id}
```
Candidates can view job details here. Replace {job-id} with actual job ID.

**9. Application Form**
```
http://localhost:3000/jobs/{job-id}/apply
```
Candidates fill this form to apply for jobs. Replace {job-id} with actual job ID.

---

## 🎯 Summary

- **1 Main URL**: Dashboard
- **6 Admin URLs**: For managing jobs and applicants
- **2 Public URLs**: For candidates to view and apply

**Total: 9 URLs**

---

## 🚀 Quick Access

Start with: `http://localhost:3000/`

Then use the navigation menu:
- Click "Dashboard" → Goes to `/`
- Click "Jobs" → Goes to `/jobs`
- Click "Applicants" → Goes to `/applicants`

