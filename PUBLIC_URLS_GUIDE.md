# Public Pages URLs for Candidates

## 🌐 Public Pages (For Candidates)

### Page 1: Public Job Detail View
**URL Format:**
```
http://localhost:3000/jobs/{job-id}
```

**What it shows:**
- Job title
- Department, location, job type
- Full job description
- Requirements
- "Apply for this Position" button

**Example:**
If your job ID is `abc-123-def-456`, the URL would be:
```
http://localhost:3000/jobs/abc-123-def-456
```

---

### Page 2: Application Form
**URL Format:**
```
http://localhost:3000/jobs/{job-id}/apply
```

**What it shows:**
- Application form with fields:
  - First Name * (required)
  - Last Name * (required)
  - Email * (required)
  - Phone (optional)
  - Resume URL (optional)
  - Cover Letter (optional)
- Submit button

**Example:**
If your job ID is `abc-123-def-456`, the URL would be:
```
http://localhost:3000/jobs/abc-123-def-456/apply
```

---

## 📋 How to Get a Job ID

### Step 1: Create a Job
1. Go to: `http://localhost:3000/jobs/new`
2. Fill in the job details
3. Click "Create Job"

### Step 2: Get the Job ID
After creating, you'll be redirected to:
```
http://localhost:3000/jobs/{job-id}
```
The `{job-id}` in the URL is what you need!

### Step 3: Use the Job ID
- **View job**: `http://localhost:3000/jobs/{your-job-id}`
- **Apply**: `http://localhost:3000/jobs/{your-job-id}/apply`

---

## 🎯 Complete Example

Let's say you created a job and got ID: `job-123-abc-456`

**Public Job View:**
```
http://localhost:3000/jobs/job-123-abc-456
```

**Application Form:**
```
http://localhost:3000/jobs/job-123-abc-456/apply
```

---

## ✅ Quick Steps

1. **Create a job** → Get job ID from URL
2. **Share public URL** → `http://localhost:3000/jobs/{job-id}`
3. **Candidates visit** → See job details
4. **Candidates click "Apply"** → Go to application form
5. **Candidates submit** → Application saved!

---

## 📝 Notes

- Both URLs use the **same job ID**
- Job must have status = "open" to be visible
- No login required for candidates
- These are public pages (no navigation bar)

## 🔐 Server-side validation

- Applications require **first name, last name, and a valid email**; the server will return an error when these are missing or invalid.
- A job must have **status = "open"** for the server to accept applications (attempts to apply to closed jobs will be rejected).

