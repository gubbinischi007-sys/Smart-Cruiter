# How Candidates Apply for Jobs

## Current Application Flow

### Step 1: Access the Public Job Page
Candidates need the job URL to view a job posting. The URL format is:
```
http://localhost:3000/jobs/{job-id}
```

For example:
- `http://localhost:3000/jobs/abc-123-def-456`

### Step 2: View Job Details
The public job page displays:
- Job title
- Department, location, and job type
- Full job description
- Requirements
- An "Apply for this Position" button

### Step 3: Click Apply Button
When the candidate clicks "Apply for this Position", they're taken to:
```
http://localhost:3000/jobs/{job-id}/apply
```

### Step 4: Fill Out Application Form
The application form requires:

**Required Fields:**
- First Name *
- Last Name *
- Email *

**Optional Fields:**
- Phone
- Resume URL (link to Google Drive, Dropbox, LinkedIn, etc.)
- Cover Letter

### Step 5: Submit Application
After clicking "Submit Application":
1. The application is saved to the database
2. Candidate receives a success message
3. Application appears in the HR dashboard under "Applicants"
4. Initial stage is set to "applied"

---

## How HR Shares Job URLs with Candidates

Since there's no public job listing page currently, HR teams can:

1. **Share Direct Links:**
   - After creating a job, copy the job ID from the URL
   - Share the public URL: `http://your-domain.com/jobs/{job-id}`
   - Share via email, job boards, social media, etc.

2. **Create Job Postings on External Platforms:**
   - Post on LinkedIn, Indeed, company website, etc.
   - Include the application URL in the posting

3. **Example Email to Candidates:**
   ```
   Subject: New Position Available - Software Engineer
   
   We have an exciting opportunity available! 
   
   View details and apply here:
   http://your-domain.com/jobs/abc-123-def-456
   
   Looking forward to receiving your application!
   ```

---

## Recommended Enhancement

**Add a Public Job Listing Page:**
A public page at `/jobs` that lists all open job positions would make it easier for candidates to discover and apply to jobs. This would be a valuable addition to make the system more user-friendly.

---

## Application Data Captured

When a candidate applies, the system stores:
- Personal information (name, email, phone)
- Resume link (if provided)
- Cover letter (if provided)
- Job ID (which position they applied for)
- Application timestamp
- Initial stage: "applied"

HR can then:
- View all applications in the Applicants page
- Update applicant stages (shortlisted, recommended, hired, etc.)
- Schedule interviews
- Send bulk acceptance/rejection emails

