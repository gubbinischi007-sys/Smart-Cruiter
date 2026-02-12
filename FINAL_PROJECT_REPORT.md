# FINAL YEAR PROJECT REPORT
## SMART-CRUITER: AN AUTOMATED APPLICANT TRACKING SYSTEM (ATS)

**Project Representative:** [Your Name]
**Degree:** Bachelor of Technology / Computer Science
**Academic Year:** 2025-2026

---

## ABSTRACT
The recruitment process in modern organizations often faces challenges related to scale, speed, and communication. **Smart-Cruiter** is an Automated Applicant Tracking System (ATS) developed to bridge the gap between human resource managers and potential candidates. Built using the React.js, Node.js, and SQLite stack, the system provides a seamless interface for posting jobs, managing applicants, and automating the hiring workflow (including offer letter generation and email communication). The system emphasizes user experience through a professional glassmorphism-based UI, interactive analytics for HR, and a dedicated communication center for candidates to track their application lifecycle.

---

## CHAPTER 1: INTRODUCTION

### 1.1 Overview
In the digital age, talent acquisition is the backbone of any successful enterprise. However, traditional hiring methods—revolving around manual email sorting and spreadsheet tracking—are prone to loss of data and delays. Smart-Cruiter is a centralized platform designed to handle the end-to-end recruitment lifecycle.

### 1.2 Problem Statement
Existing manual hiring processes are inefficient for several reasons:
- **Data Fragmentation:** Resumes are buried in email threads or local folders.
- **Communication Gap:** Candidates often receive no feedback, leading to a poor brand image for the company.
- **Workflow Bottlenecks:** Manual generation of offer letters and rejections consumes significant HR time.
- **Lack of Analytics:** Managers cannot easily visualize the "Hiring Funnel" (e.g., how many applicants move from 'applied' to 'hired').

### 1.3 Objectives
- To develop a responsive, web-based platform for recruitment management.
- To automate the status update process for applicants.
- To implement a secure notification system for candidate communications.
- To provide a dashboard with real-time analytics for HR personnel.

### 1.4 Scope of the Project
The project covers:
- User Authentication (HR and Candidate roles).
- Job Posting and Categorization.
- Applicant Screening and Status Management.
- Automated Email Delivery (Nodemailer integration).
- Historical Log Tracking (Audit Trail).

---

## CHAPTER 2: LITERATURE SURVEY

### 2.1 Study of Existing Systems
Most enterprise-level ATS solutions like Workday or Greenhouse are prohibitively expensive for startups and mid-sized firms. On the other end, free tools lack the automation and professional branding required for a modern hiring experience.

### 2.2 Gaps Identified
- **Complexity vs. Simplicity:** Many tools are too complex for non-technical HR staff.
- **Visual Feedback:** Lack of intuitive graphs for tracking progress.
- **Interactive Communication:** Standard systems send emails but don't provide a "Candidate Inbox" for tracking all interactions in one place.

---

## CHAPTER 3: REQUIREMENT ANALYSIS

### 3.1 Functional Requirements
- **FR1: Job Management:** HR must be able to Create, Update, and Delete job listings.
- **FR2: Application Processing:** Candidates must be able to view jobs and apply.
- **FR3: Status Workflow:** HR can move a candidate through "Applied," "Interviewing," "Offered," and "Hired."
- **FR4: Automated Emails:** System sends emails for every status change.
- **FR5: History Logging:** Every action is timestamped and recorded for auditing.

### 3.2 Non-Functional Requirements
- **NFR1: Performance:** Pages must load in under 2 seconds.
- **NFR2: Security:** Sensitive data like candidate emails must be protected.
- **NFR3: Scalability:** The system should handle hundreds of concurrent applicants.
- **NFR4: Usability:** The interface must be intuitive (Single Page Application).

### 3.3 Hardware Requirements
- CPU: Intel Core i3 / M1 Chip or higher.
- RAM: 8 GB.
- Storage: 1 GB free space.

### 3.4 Software Requirements
- Frontend: React.js, Vite, TypeScript.
- Backend: Node.js, Express.js.
- Database: SQLite3.
- Tooling: VS Code, Git.

---

## CHAPTER 4: SYSTEM DESIGN

### 4.1 System Architecture
Smart-Cruiter follows a **Client-Server Architecture**:
1.  **Frontend (View):** React components manage the UI and state.
2.  **API Layer (Controller):** Express routes handle logic and validation.
3.  **Database (Model):** SQLite stores persistent data.

### 4.2 Database Design (Schema)
The database comprises several interconnected tables:
- **`jobs`**: Stores job titles, descriptions, and metadata.
- **`applicants`**: Stores candidate info, job references, and hiring status.
- **`notifications`**: Stores messages sent to candidates.
- **`history`**: Stores the audit trail of all platform activities.
- **`employees`**: Once an applicant is hired, they are moved to this table.

### 4.3 Data Flow Diagram (DFD)
- **Level 0 (Context Diagram):** Users (HR/Candidate) interact with the Smart-Cruiter system.
- **Level 1 (Process Diagram):**
  - Process 1.0: Authentication
  - Process 2.0: Job Creation
  - Process 3.0: Application Submission
  - Process 4.0: Hiring Workflow & Email Trigger

---

## CHAPTER 5: IMPLEMENTATION DETAILS

### 5.1 Frontend Module (React & TypeScript)
The frontend uses a modular structure:
- **`Layout.tsx`**: Provides the navigation and sidebar consistent across pages.
- **`Dashboard.tsx`**: Uses `Recharts` to display the Hiring funnel.
- **`CandidateEmails.tsx`**: Handles complex logic for displaying an inbox, including bulk delete and status polling.

### 5.2 Backend Module (Node.js & Express)
The backend is organized into routes:
- **`jobs.ts`**: CRUD operations for job listings.
- **`applicants.ts`**: Logic for status changes (e.g., when a status becomes "Hired", it triggers the history logger).
- **`notifications.ts`**: Manages the storage and retrieval of internal system messages.

### 5.3 Notification Service (Nodemailer)
A critical feature is the `mailer.ts` utility. It uses SMTP configuration to send actual e-mails to candidates when they are shortlisted or offered a position.

### 5.4 Security Implementation
Security is handled through:
- **Environment Variables**: Storing keys in `.env`.
- **CORS Policy**: Ensuring only the authorized frontend can talk to the backend.

---

## CHAPTER 6: TESTING AND QUALITY ASSURANCE

### 6.1 Unit Testing
- Tested the "Submit Application" button to ensure it prevents null values.
- Tested the "Search Job" filter to ensure accurate results.

### 6.2 Integration Testing
- Verified that deleting a job also handles (refers to) the associated applicants appropriately.
- Confirmed that changing a status in the HR Dashboard updates the candidate's view in real-time via the API.

### 6.3 Test Cases
| Test ID | Description | Input | Expected Result | Result |
| :--- | :--- | :--- | :--- | :--- |
| TC01 | Job Creation | Form Data | Job visible in list | Pass |
| TC02 | Email Notification | Status Change | Email received in inbox | Pass |
| TC03 | Offer Response | Accept Click | Status becomes 'Hired' | Pass |
| TC04 | Duplicate Prevention | Same Email | Show error message | Pass |

---

## CHAPTER 7: RESULTS AND USER INTERFACE

### 7.1 HR Dashboard
The dashboard provides a "Control Center" view. Large cards show total hires, active jobs, and recent applicant activity.

### 7.2 Candidate Portal
Candidates have a simplified "Inbox" UX. It uses a dark theme with high-contrast text for readability.

### 7.3 Automated Audit Trail
The "History" page shows a chronological log:
- *Example: "John Doe's status updated to Interviewed by Admin at 12:45 PM"*

---

## CHAPTER 8: CONCLUSION AND FUTURE ENHANCEMENTS

### 8.1 Conclusion
The Smart-Cruiter project successfully demonstrates the power of modern web technologies to simplify complex business processes. By automating the "boring" parts of recruitment, it allows human resource professionals to focus on the human side of the job.

### 8.2 Future Enhancements
- **Multi-factor Authentication (MFA):** To enhance recruiter account security.
- **Resume Parsing (AI):** Using NLP to automatically extract skills from uploaded PDFs.
- **Calendar Integration:** Deep integration with Google/Outlook calendars for interview scheduling.
- **Social Media Casting:** One-click sharing of jobs to LinkedIn and Twitter.

---

## REFERENCES
1. React Documentation - https://react.dev/
2. Express.js API Reference - https://expressjs.com/
3. SQLite Documentation - https://www.sqlite.org/docs.html
4. Node.js Documentation - https://nodejs.org/en/docs/
5. StackOverflow Communities for Bug Fixing.

---
### APPENDIX: CODE SNIPPETS
*(Important logic sections for reference)*

**Polling Logic in `CandidateEmails.tsx`:**
```typescript
useEffect(() => {
    loadEmails();
    const interval = setInterval(loadEmails, 3000); // Polling for real-time updates
    return () => clearInterval(interval);
}, [user.email]);
```

**History Logging Service:**
```typescript
export const logApplicationDecision = async (data: HistoryEntry) => {
    return await api.post('/history', data);
};
```
