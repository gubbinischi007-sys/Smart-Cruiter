# SMART-CRUITER: PROJECT REPORT

---

## 1. INTRODUCTION

### 1.1 PROJECT DESCRIPTION
**Smart-Cruiter** is a sophisticated, full-stack **Automated Applicant Tracking System (ATS)** developed to streamline and optimize the modern recruitment process. By integrating AI-driven matching technologies and automated communication workflows, the system enables HR departments to manage large volumes of applications with high precision and minimal manual effort.

### 1.2 PURPOSE
The purpose of Smart-Cruiter is to eliminate the inefficiencies of manual talent acquisition. It aims to provide an objective, data-driven approach to candidate screening, ensuring that the best-fit talent is identified quickly and engaged through a transparent, high-visibility communication hub.

### 1.3 SCOPE
The project scope encompasses:
- A secure **HR Admin Hub** for job and applicant management.
- A **Public Career Board** for candidate applications.
- An **AI Matching Engine** for resume analysis and scoring.
- **Automated Communication** flows for interview scheduling and job offers.
- **Audit Trails** and **Analytics Dashboards** for internal compliance and tracking.

---

## 2. LITERATURE SURVEY
A study of modern recruitment trends reveals a significant shift from reactive "Post-and-Pray" methods to proactive, AI-driven sourcing. Research indicates that organizations using automated ATS solutions experience a 60% reduction in time-to-hire. Current literature emphasizes the importance of "Candidate Experience," highlighting that lack of feedback is the number one cause of talent dropout. Smart-Cruiter addresses this by prioritizing automated transparency.

---

## 3. EXISTING SYSTEM
Traditional recruitment systems often consist of:
- **Manual Spreadsheets**: No version control, high risk of data loss, and zero automation.
- **Disconnected Email Inboxes**: Fragmented candidate communication and lack of a centralized history.
- **Legacy ATS**: Expensive, high-complexity systems that are often too rigid for the fast-paced needs of startups and SMBs.

---

## 4. PROPOSED SYSTEM
The proposed system, **Smart-Cruiter**, introduces:
- **Centralized Data Lake**: A relational database (SQLite) for all candidate and job data.
- **Intelligence Layer**: Automated PDF parsing and skill-requirement alignment scoring.
- **Process Orchestration**: State-based workflows where hiring decisions trigger downstream actions (emails, logs, offers).
- **Glassmorphism UI**: A modern, premium interface designed for high-density HR data as well as accessible candidate views.

---

## 5. MODULES
1. **User Authentication & RBAC**: Managing HR roles and candidate access.
2. **Job Management Module**: Handling the full lifecycle of a vacancy.
3. **Application Handler**: Receiving uploads, parsing PDFs, and initializing match scores.
4. **Communication Engine**: SMTP-based automated email dispatch.
5. **Interview & Feedback Module**: Scheduling and rating candidate interactions.
6. **Analytics & History**: Visualizing metrics and recording audit logs.

---

## 6. HARDWARE AND SOFTWARE REQUIREMENTS

### 6.1 HARDWARE REQUIREMENTS
- **Processor**: Dual-core 2.4 GHz or higher (Intel i5/M1+ recommended).
- **Memory (RAM)**: 8 GB Minimum (16 GB for concurrent development).
- **Disk Space**: 1 GB available space for project files and local database storage.
- **Network**: Stable internet connection for SMTP and API polling.

### 6.2 SOFTWARE REQUIREMENTS
- **Operating System**: Windows 10/11, macOS, or Linux.
- **Web Browser**: Chrome, Edge, or Safari (must support backdrop-filter).
- **Runtime**: Node.js v18.0.0 or higher.
- **Database**: SQLite 3.
- **Build Tools**: Vite (Frontend), TSX (Backend Runtime).

---

## 7. SOFTWARE REQUIREMENTS SPECIFICATION

### 7.1 USERS
- **HR Admins**: Full access to manage jobs, applicants, employees, and team invitations.
- **Candidates**: Access to browse jobs, apply, and track status.
- **Referees**: Access to specific feedback forms via secure tokens.

### 7.2 FUNCTIONAL REQUIREMENTS
- **FR1**: The system shall parse PDF resumes and extract plain text.
- **FR2**: The system shall calculate a match score based on keyword alignment.
- **FR3**: The system shall send automated rejection emails for scores < 50%.
- **FR4**: The system shall generate digital offer letters with dynamic salary fields.
- **FR5**: The system shall provide an immutable history of all hiring actions.

### 7.3 NON-FUNCTIONAL REQUIREMENTS
- **Latency**: UI updates for status changes shall reflect in < 3 seconds via polling.
- **Security**: All API endpoints shall be protected via JWT or role-based checks.
- **Scalability**: The database shall be indexed to support up to 10k applicants per job.

---

## 8. SYSTEM DESIGN

### 8.1 ARCHITECTURE DIAGRAM
The system follows a **3-Tier Distributed Architecture**:
- **Presentation Tier**: React.js SPA.
- **Application Tier**: Node.js/Express REST API.
- **Data Tier**: SQLite Relational Engine.

### 8.2 CONTEXT FLOW DIAGRAM
Candidates submit applications (Input) -> System parses and scores (Process) -> HR reviews and updates stage (Process) -> Candidate receives notification (Output) -> Audit logs recorded (Data Store).

---

## 9. DETAILED DESIGN

### 9.1 CLASS DIAGRAM
Core entities include `Job`, `Applicant`, `Interview`, `Employee`, `AuditRecord`, and `RefRequest`. Relationships are primarily 1:N (One Job to many Applicants).

### 9.2 USE CASE DIAGRAM
- **HR Admin**: Create Job, View Analytics, Shortlist Applicant, Send Offer.
- **Candidate**: Browse Career Page, Upload Resume, View Inbox.

### 9.3 ACTIVITY DIAGRAM
1. Candidate applies -> 2. AI parses PDF -> 3. Score calculated -> 4. If high, notify HR -> 5. If low, auto-reject -> 6. End.

### 9.4 DATABASE DESIGN (Core Schema)
Indexing is applied to `applicant_email` and `job_id` for high-performance querying.

### 9.5 ER DIAGRAM
The schema is highly normalized with foreign key constraints between `Jobs` and `Applicants`, and `Applicants` and `Interviews`.

---

## 10. IMPLEMENTATION

### 10.1 SCREEN SHOTS
*(Placeholders for actual portal views such as Dashboard, Job Creation, and Candidate Inbox)*

### 10.2 CODING
Key implementation highlights including the **AI Matching Algorithm**:
```typescript
const matchResult = await calculateMatchScore(applicantText, jobRequirements, jobTitle);
if (matchResult.score < 50) {
    await run('UPDATE applicants SET status = ?, stage = ?', ['rejected', 'rejected']);
    await sendRejectionEmail(applicant.email);
}
```

---

## 11. SOFTWARE TESTING
Integrated testing was performed using a module-by-module approach:
- **Unit Testing**: Verified PDF parsing and SMTP connectivity.
- **Integration Testing**: Validated the full flow from "Apply" to "Offer Sent".
- **Performance Testing**: Verified sub-second response times for dashboard analytics.

---

## 12. CONCLUSION
Smart-Cruiter successfully automates the recruitment pipeline, providing significant efficiency gains for HR teams. The integration of AI for initial screening ensures that high-quality talent is prioritized, while automated communication maintains a premium candidate experience.

---

## 13. FUTURE ENHANCEMENT
- **Automated Interview Proctoring**: AI-based monitoring for online screenings.
- **Advanced Predictive Analytics**: Forecasting "Time-to-Hire" based on historical data.
- **Native Mobile Apps**: Dedicated mobile dashboards for HR reviewers.

---

## Appendix A: BIBLIOGRAPHY
1. React.js Documentation (v18)
2. Node.js Express API Reference
3. SQLite Performance Guides
4. "Modern Recruitment Automation" - Research Reports 2024

---

## Appendix B: USER MANUAL
*(Guidelines for HR to create jobs and Candidates to check their status)*

---
*Generated based on Project Template Version 1.0*
