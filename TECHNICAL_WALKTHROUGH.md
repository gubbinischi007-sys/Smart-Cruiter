# Technical Guide & Code Explanation: Smart-Cruiter

This document is designed to help you explain the project during your final year viva/presentation. It covers the architecture, technology stack, and core logic.

---

## 1. System Architecture (The Big Picture)

**Smart-Cruiter** is a full-stack **Applicant Tracking System (ATS)** built using the **PERN-like stack** (replacing Postgres with SQLite for portability).

*   **Frontend:** Built with **React** and **TypeScript** via **Vite**. It uses a component-based architecture for a fast, "Single Page Application" (SPA) experience.
*   **Backend:** A **Node.js** server using the **Express** framework to handle RESTful API requests.
*   **Database:** **SQLite**. Chosen for its lightweight, serverless nature, making it perfect for a standalone project delivery.
*   **Communication:** The Frontend and Backend communicate over **HTTP** using **Axios**.

---

## 2. Technology Stack

### Frontend (Client-side)
- **React (v18):** UI library for building interactive components.
- **TypeScript:** Used for type safety, reducing runtime errors and making the code easier to maintain.
- **Lucide-React:** For modern, consistent iconography.
- **Recharts:** For data visualization (graphs/metrics in the dashboard).
- **React Router Dom:** For handling navigation without reloading the page.
- **Vanilla CSS:** Custom styling for a unique, premium design (Glassmorphism effects).

### Backend (Server-side)
- **Node.js:** JavaScript runtime environment.
- **Express:** Web framework for building the API routes.
- **SQLite3:** Database engine that stores everything in a local file (`database.sqlite`).
- **Nodemailer:** To automatically send real-world emails to candidates (offers, rejections).
- **UUID:** To generate unique identifiers for applicants and jobs.

---

## 3. Core Logic Explanation (Critical Features)

### A. Candidate Communication Center (`CandidateEmails.tsx`)
**Explanation for Examiners:**
> "This component serves as the candidate's private inbox. When the component mounts, it uses the `useEffect` hook to fetch messages from the `/notifications` API. I implemented **polling** (refreshing every 3 seconds) to give it a real-time feel. It also handles complex logic like **Bulk Deletion** and **Conditional Rendering**—showing a different UI when an email is selected versus the list view."

### B. Offer Management Workflow
**Explanation for Examiners:**
> "The system automates the hiring flow. When an HR clicks 'Send Offer', the backend triggers **Nodemailer** to send an email. Inside the candidate's dashboard, I've integrated an 'Accept/Reject' logic. If a candidate accepts, the system automatically creates an **Employee Record** and logs the event in the **History Tracker** for auditing."

### C. State & Authentication
**Explanation for Examiners:**
> "I used a **Context API (`AuthContext`)** to manage user sessions globally. This ensures that a candidate can only see their own emails, and HR can only see the management dashboard. Protected routes prevent unauthorized access to sensitive pages."

---

## 4. Possible Viva Questions & Answers

**Q: Why did you choose React for the frontend?**
**A:** "React's virtual DOM makes the UI extremely fast. Its component-based structure allows me to reuse elements like buttons and modals, making the code 'DRY' (Don't Repeat Yourself) and easier to debug."

**Q: How do you handle data persistence?**
**A:** "I use SQLite. Every time a user adds a job or an applicant, the Express server executes an SQL query to insert that data into the `database.sqlite` file. This ensures data is saved even if the server restarts."

**Q: How does the 'History' feature work?**
**A:** "Every major action (hiring, rejecting, creating jobs) calls a utility function `logApplicationDecision`. This sends a POST request to the `/history` endpoint in the backend, which stores the audit trail in the database."

**Q: Why use TypeScript instead of plain JavaScript?**
**A:** "TypeScript catches 'undefined' errors during development rather than at runtime. It also provides 'IntelliSense,' which helped me work faster by knowing exactly what data type an API response would return."

---

## 5. Directory Structure
- `/client/src/components`: Reusable UI elements (Modals, Layouts).
- `/client/src/pages`: Main application views (Jobs, Emails, Dashboard).
- `/client/src/services`: API abstraction layer (Axios calls).
- `/server/src/routes`: API endpoints definition.
- `/server/src/index.ts`: The entry point where the Express server starts.

---
*Generated for: Final Year Project Presentation*
