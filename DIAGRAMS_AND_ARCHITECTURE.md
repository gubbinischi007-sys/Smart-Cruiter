# System Architecture & Workflow Flowcharts: Smart-Cruiter

This document contains visual representations and detailed explanations of how the Smart-Cruiter system is structured and how data flows through it. These sections are formatted to be used directly in your final report.

---

## 1. High-Level System Architecture

**[INSERT IMAGE: system_architecture_diagram]**

### Description:
The Smart-Cruiter system is built on a modern **Full-Stack Architecture** designed for high performance and scalability.
-   **Presentation Layer (Frontend):** Developed using **React.js** and **TypeScript**. It provides a dynamic, responsive User Interface that manages the application state and handles user interactions.
-   **Service Layer (Backend):** A **Node.js** server utilizing the **Express** framework. It handles all business logic, process orchestration (like hiring workflows), and serves as the bridge between the UI and the data.
-   **Data Layer (Database):** A persistent **SQLite** database that stores all critical information including job listings, applicant profiles, and communication logs.
-   **External Integration:** The system integrates with **Nodemailer** for real-time SMTP-based email communication, ensuring candidates receive immediate updates.

---

## 2. Recruitment Process Workflow

**[INSERT IMAGE: hiring_workflow_flowchart]**

### Process Stages:
1.  **Job Posting:** HR creates and publishes vacancies with specific categories and details.
2.  **Applicant Submission:** Candidates browse and apply for jobs via the frontend dashboard.
3.  **Screening:** Internal logic and HR review allow for shortlisting from the pool of applicants.
4.  **Interview:** The system tracks candidates as they move through the selection phases.
5.  **Offer Generation:** Automated generation and delivery of offer letters via the Communication Center.
6.  **Hiring/Onboarding:** Successful candidates are converted to Employee records, completing the recruitment lifecycle.

---
---

## 3. Data Flow Diagrams (DFD)

**[INSERT IMAGE: data_flow_diagram_dfd]**

### DFD Level 0 (Context Diagram)
The system interacts with two primary external entities: **HR Admins** and **Candidates**.
-   **HR Admins** provide job data and hiring decisions, and receive applicant lists and system logs.
-   **Candidates** provide profile/resume data and application responses, and receive job details and status notifications.

### DFD Level 1 (Process Breakdown)
-   **P1 - Authentication:** Manages secure login for different user roles.
-   **P2 - Job Management:** Processes the creation and maintenance of job listings.
-   **P3 - Application Engine:** Handles the submission and status tracking of applications.
-   **P4 - Notification Hub:** Coordinates internal messages and external email triggers.

---

## 4. Entity-Relationship Diagram (ERD)

**[INSERT IMAGE: database_relationship_diagram_erd]**

### Entities and Relationships:
-   **Jobs Table:** The central entity where all vacancies are stored. One job can have multiple **Applicants**.
-   **Applicants Table:** Links individual users to specific jobs. Each applicant record tracks the `offer_status` and `hiring_status`.
-   **Notifications Table:** Stores a log of all communications sent to a specific `user_email`.
-   **History Table:** Maintains a 1-to-many relationship with actions to provide a complete audit trail of the hiring process.

---

*Note: The images referenced above (system_architecture_diagram, hiring_workflow_flowchart, data_flow_diagram_dfd, and database_relationship_diagram_erd) have been professionally generated and are available in your visual preview. Please download and insert them into your final Word/LaTeX document.*
