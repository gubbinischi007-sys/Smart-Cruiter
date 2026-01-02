# Where to Find Interview Scheduling

## 📍 Location 1: Job Detail Page (Recommended for Quick Access)

### Step-by-Step:

1. **Go to Jobs Page**
   - Click on **"Jobs"** in the navigation bar at the top
   - Or visit: `http://localhost:3000/jobs`

2. **Open a Job**
   - Click on any job title from the list
   - This takes you to the Job Detail page
   - URL looks like: `http://localhost:3000/jobs/{job-id}`

3. **Scroll to Applicants Section**
   - Scroll down past the job details and statistics
   - You'll see a section titled **"Applicants (N)"** where N is the number of applicants

4. **Find the "Schedule Interview" Button**
   - In the applicants table, look at the **"Actions"** column (rightmost column)
   - Each applicant row has a **"Schedule Interview"** button
   - It's located next to the **"View"** button

5. **Click "Schedule Interview"**
   - Click the button next to the applicant you want to interview
   - The interview form will appear **above** the applicants table
   - Fill in the details and submit!

---

## 📍 Location 2: Applicant Detail Page

### Step-by-Step:

1. **Go to Applicants Page**
   - Click on **"Applicants"** in the navigation bar
   - Or visit: `http://localhost:3000/applicants`

2. **Open an Applicant**
   - Click on any applicant's name from the list
   - This takes you to the Applicant Detail page
   - URL looks like: `http://localhost:3000/applicants/{applicant-id}`

3. **Look for Interviews Section**
   - On the right side of the page, you'll see a card titled **"Interviews"**
   - This is in the sidebar (right column)

4. **Click "Schedule Interview" Button**
   - At the top of the Interviews section, there's a **"Schedule Interview"** button
   - Click it to open the interview form
   - The form appears right below the button

5. **Fill and Submit**
   - Fill in all the interview details
   - Click **"Schedule"** to save

---

## Visual Guide

### Job Detail Page Layout:

```
┌─────────────────────────────────────────┐
│  Job Title                    [Edit Job]│
├─────────────────────────────────────────┤
│  Job Details          │  Statistics    │
│  (Description, etc.)  │  (Charts)      │
├─────────────────────────────────────────┤
│  Applicants (5)                         │
│  ┌───────────────────────────────────┐ │
│  │ [☐] Name  Email  Stage  Actions  │ │
│  │ [☐] John  ...    ...   [View]    │ │
│  │                 [Schedule Int.]   │ │  ← HERE!
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Applicant Detail Page Layout:

```
┌──────────────────────┬──────────────────┐
│  Contact Info        │  Interviews      │
│  (Name, Email, etc.) │  [Schedule Int.] │  ← HERE!
│                      │                  │
│  Cover Letter        │  (Interview      │
│                      │   list appears   │
│                      │   below)         │
└──────────────────────┴──────────────────┘
```

---

## Quick Access Paths

### From Navigation Bar:
1. Click **"Jobs"** → Select a job → Scroll to Applicants → Click **"Schedule Interview"**
   OR
2. Click **"Applicants"** → Select an applicant → Click **"Schedule Interview"** in sidebar

### Direct URLs:
- Job Detail: `http://localhost:3000/jobs/{job-id}`
- Applicant Detail: `http://localhost:3000/applicants/{applicant-id}`

---

## Summary

**Two Places to Schedule Interviews:**

1. ✅ **Job Detail Page** - Best when reviewing multiple applicants for one job
   - Location: Applicants table → Actions column → "Schedule Interview" button

2. ✅ **Applicant Detail Page** - Best when viewing a specific applicant
   - Location: Right sidebar → Interviews section → "Schedule Interview" button

Both locations have the same functionality - choose whichever is more convenient for your workflow!

