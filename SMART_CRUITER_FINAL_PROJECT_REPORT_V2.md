provide # SMART-CRUITER: AN AUTOMATED APPLICANT TRACKING SYSTEM (ATS)
## FINAL PROJECT REPORT

---

## 1. ABSTRACT
In the contemporary corporate landscape, the efficiency of talent acquisition directly correlates with organizational growth. However, many HR departments still rely on fragmented workflows and manual screening, leading to "Talent Leakage" and long hiring cycles. 

**Smart-Cruiter** is a sophisticated **Automated Applicant Tracking System (ATS)** designed to revolutionize the end-to-end recruitment lifecycle. Developed with a high-performance **React.js** frontend and a robust **Node.js/Express** backend, it integrates an **AI-driven Resume Matching Engine** that automatically parses resumes using `pdf-parse` and ranks candidates based on multi-dimensional skill alignment. 

Key technical innovations include a real-time **Candidate Engagement Hub**, an **Automated Reference Verification System**, and a secure **HR Collaboration Audit Trail**. This report documents the technical architecture, implementation logic, and evaluation of Smart-Cruiter as a modular, enterprise-ready solution for modern Human Resource Management.

---

## 2. CHAPTER 1: INTRODUCTION

### 2.1 Project Overview
Smart-Cruiter is an intelligent recruitment engine that automates the "boring" parts of hiring. It allows HR teams to post jobs, track applicants across custom stages, and leverage AI to prioritize high-potential talent instantly.

### 2.2 Objectives
- **Screening Automation**: Reduce manual resume review time by 75% using AI match scores.
- **Engagement Consistency**: Ensure 100% of candidates receive automated status updates via SMTP.
- **Data Centralization**: Maintain a single source of truth for hiring decisions, interviews, and reference feedback.
- **High Transparency**: Provide a secure portal for candidates to track their own progress in real-time.

### 2.3 Problem Statement
Traditional hiring methods suffer from:
- **Administrative Fatigue**: Manual entry of candidate data and tracking in spreadsheets.
- **Reactive Communication**: Lack of timely feedback to applicants.
- **Decision Bias**: Inconsistent screening criteria across different recruiters.

---

## 3. CHAPTER 2: SYSTEM REQUIREMENTS SPECIFICATION (SRS)

### 3.1 Functional Requirements (FR)
| ID | Requirement | Description |
| :--- | :--- | :--- |
| **FR01** | **Job Lifecycle Management** | HR can create, update, and manage job vacancies with detailed requirements. |
| **FR02** | **AI Resume Parsing** | Automatic extraction of text from PDF resumes using the `pdf-parse` library. |
| **FR03** | **Dynamic Match Scoring** | System calculates a suitcase score (0-100%) against job descriptions. |
| **FR04** | **Autonomous Rejection** | Automatic flagging and emailing of low-scoring (<50%) candidates. |
| **FR05** | **Real-time Status Sync** | Candidate hub polls every 3 seconds to reflect HR decision changes. |
| **FR06** | **Offer Letter Engine** | Automated generation of offer letters with salary and joining date variables. |
| **FR07** | **Reference Verification** | Automated feedback collection from provided candidate referees. |
| **FR08** | **Audit Trial Logs** | Immutable history of all hiring stage transitions and reasons. |
| **FR09** | **HR Team Collaboration** | Secure invitation system for adding new team members to a company workspace. |
| **FR10** | **Analytics Dashboard** | Visualization of "Applicants by Stage" and "Time-to-Hire" metrics. |

### 3.2 Non-Functional Requirements (NFR)
- **Performance**: API response time < 300ms for core operations.
- **Security**: Role-Based Access Control (RBAC) and parameterized SQL queries to prevent injections.
- **Reliability**: Use of local SQLite for high availability and portability.
- **UX**: Premium "Glassmorphism" UI design with responsive layouts.

---

## 4. CHAPTER 3: SYSTEM DESIGN & ARCHITECTURE

### 4.1 3-Tier Architecture
1. **Presentation Layer**: React.js (Vite) for a responsive UI.
2. **Logic Layer**: Node.js/Express server handling AI matching and SMTP.
3. **Data Layer**: Relational SQLite database for persistent storage.

### 4.2 Detailed Data Dictionary

| Table | Key Attributes |
| :--- | :--- |
| **jobs** | `title`, `department`, `requirements`, `status`. |
| **applicants** | `first_name`, `email`, `resume_text`, `score`, `stage`. |
| **interviews** | `applicant_id`, `scheduled_at`, `meeting_link`, `feedback`. |
| **references** | `token`, `ref_name`, `status`, `responses` (JSON). |
| **history** | `action_taken`, `reason`, `timestamp`. |

---

## 5. CHAPTER 4: SYSTEM IMPLEMENTATION

### 5.1 AI Matching Service Logic
The core intelligence of Smart-Cruiter resides in the `matchingService.ts`.
- **Text Sourcing**: Extracts content from PDF buffers upon upload.
- **Weighted Ranking**:
    - **50% Skill Alignment**: Matching keywords from resume vs. job requirements.
    - **30% Semantic Relevance**: Analyzing job title and cover letter context.
    - **20% Formatting/Metadata**: Checking for proper resume structure.
- **Auto-shortlisting**: If Score > 90%, the candidate is moved to 'Shortlisted' instantly.

### 5.2 Communication Engine
Powered by **Nodemailer** and **SMTP**.
- **Automated Triggers**: Triggered during `POST /apply` and `PUT /status-update`.
- **Dynamic Templates**: Highly stylized HTML templates for Offer Letters and Rejection feedback.

### 5.3 Security Implementation
- **JWT Authentication**: Secure sessions for HR users.
- **Input Sanitization**: Middleware layer removes potentially malicious scripts from application forms.
- **RBAC**: Ensures candidates cannot access `/api/history` or delete job postings.

---

## 6. CHAPTER 5: TESTING & QUALITY ASSURANCE

### 6.1 Testing Suite Table

| Test ID | Module | Action | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Application | Upload PDF Resume | Text extracted and Score > 0 | PASS |
| **TC-02** | AI logic | Score < 50% | Auto-Rejection email triggered | PASS |
| **TC-03** | Sync | Change stage in HR | Candidate Hub reflects in < 3s | PASS |
| **TC-04** | Refs | Submit Ref Feedback | DB updated as 'Submitted' | PASS |
| **TC-05** | Bulk | Bulk Move to Intv | 10 applicants moved to 'Interview' | PASS |

---

## 7. CHAPTER 6: RESULTS & CONCLUSION

### 7.1 Key Outcomes
Smart-Cruiter successfully implements a modern, automated recruitment pipeline. The system provides:
- Instant feedback to candidates.
- Reduced cognitive load for recruiters through AI ranking.
- A legally sound audit trail for all hiring decisions.

### 7.2 Future Scope
- **Video Interview AI**: Sentiment analysis during video screening.
- **Cloud Migration**: Integration with Supabase Cloud for global scaling.
- **Calendar Integration**: Direct booking on Google/Outlook calendars from the dashboard.

---

## 8. APPENDICES
### 8.1 Database DDL (Core Schema)
```sql
CREATE TABLE applicants (
  id UUID PRIMARY KEY,
  first_name TEXT,
  email TEXT UNIQUE,
  resume_text TEXT,
  score INTEGER DEFAULT 0,
  stage TEXT DEFAULT 'applied'
);
```

---
*Created by Smart-Cruiter Project Team.*
