# Interview Scheduling Guide

## ✅ Interview Scheduling Feature

You can now schedule online interviews directly from the **Job Detail** page or the **Applicant Detail** page!

---

## How to Schedule an Interview

### Method 1: From Job Detail Page (NEW! ✅)

1. **Navigate to a Job**
   - Go to **Jobs** page
   - Click on any job to view details

2. **Find the Applicant**
   - Scroll down to the **Applicants** section
   - Find the applicant you want to interview

3. **Click "Schedule Interview" Button**
   - Click the **"Schedule Interview"** button next to the applicant's name
   - The interview form will appear above the applicants table

4. **Fill in Interview Details**
   - **Date & Time*** - Select when the interview will take place
   - **Interview Type*** - Choose:
     - **Online** - For Zoom, Google Meet, Teams, etc.
     - **In-Person** - For face-to-face interviews
     - **Phone** - For phone interviews
   - **Meeting Link*** (required for online interviews)
     - Provide Zoom, Google Meet, Teams, or other meeting platform link
     - Example: `https://meet.google.com/xxx-xxxx-xxx`
     - Example: `https://zoom.us/j/xxxxxx`
   - **Notes** (optional)
     - Additional instructions or information for the candidate

5. **Submit**
   - Click **"Schedule Interview"** button
   - The interview will be saved and visible in the applicant's detail page

---

### Method 2: From Applicant Detail Page

1. **Navigate to Applicant**
   - Go to **Applicants** page
   - Click on an applicant's name to view details

2. **Schedule Interview**
   - In the right sidebar, find the **"Interviews"** section
   - Click **"Schedule Interview"** button
   - Fill in the form (same fields as above)
   - Click **"Schedule"**

---

## Interview Features

### Interview Types Supported
- ✅ **Online** - With meeting link (Zoom, Google Meet, Teams, etc.)
- ✅ **In-Person** - Physical location interviews
- ✅ **Phone** - Phone call interviews

### What Gets Stored
- Interview date and time
- Interview type
- Meeting link (for online interviews)
- Notes/instructions
- Interview status (scheduled, completed, cancelled, rescheduled)
- Link to applicant and job

### Viewing Scheduled Interviews
- Interviews are displayed on the **Applicant Detail** page
- Shows date/time, type, status, and meeting link (if online)
- Meeting link is clickable for easy access

---

## Example Workflow

```
1. HR creates a job posting for "Software Engineer"
2. Candidates apply for the position
3. HR reviews applications on Job Detail page
4. HR clicks "Schedule Interview" next to a candidate's name
5. HR fills in:
   - Date/Time: 2024-01-15 10:00 AM
   - Type: Online
   - Meeting Link: https://meet.google.com/abc-defg-hij
   - Notes: "Bring portfolio and be ready to discuss your projects"
6. Interview is scheduled!
7. Candidate can see interview details on their application
8. On interview day, HR clicks the meeting link to join
```

---

## Best Practices

1. **Schedule in Advance**: Give candidates enough notice (at least 24-48 hours)

2. **Use Reliable Platforms**: 
   - Google Meet (works with Gmail accounts)
   - Zoom (most popular)
   - Microsoft Teams (for enterprise)
   - Other reliable video conferencing tools

3. **Include Clear Instructions**:
   - Add notes about what to prepare
   - Include timezone if scheduling across regions
   - Mention if recording the interview

4. **Test Links**: 
   - Make sure meeting links work before sending
   - For recurring interviews, use recurring meeting links

5. **Update Status**:
   - Mark interviews as "completed" after they finish
   - Mark as "cancelled" if needed to reschedule

---

## Technical Details

### API Endpoints
- `POST /api/interviews` - Create new interview
- `GET /api/interviews` - Get interviews (with filters)
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview

### Database Fields
- `scheduled_at` - Date and time of interview
- `type` - online, in-person, or phone
- `meeting_link` - URL for online meetings
- `notes` - Additional information
- `status` - scheduled, completed, cancelled, rescheduled

---

## Troubleshooting

**Problem:** Meeting link not working
- **Solution:** Double-check the link format and test it before scheduling

**Problem:** Can't schedule interview
- **Solution:** Make sure you've selected an applicant and filled all required fields

**Problem:** Interview time conflict
- **Solution:** Check existing interviews before scheduling (view on Applicant Detail page)

**Problem:** Need to reschedule
- **Solution:** Go to Applicant Detail page, view the interview, and update the date/time

---

## Summary

✅ Interview scheduling is now available from both **Job Detail** and **Applicant Detail** pages  
✅ Supports Online, In-Person, and Phone interviews  
✅ Meeting links can be added for online interviews  
✅ Notes field for additional instructions  
✅ Easy to use, one-click scheduling!

