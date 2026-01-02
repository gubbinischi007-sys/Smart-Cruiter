# Smart-Cruiter - Applicant Tracking System (ATS)
*Currently maintained by Nischitha L*

Smart-Cruiter is a comprehensive Applicant Tracking System designed to streamline and automate the hiring process for organizations. The system allows HR teams to create job postings, manage applicants across different stages, schedule interviews, send bulk emails, and generate insightful analytics.

## Features

### Core Functionality
- **Job Management**: Create, edit, and manage job postings with detailed descriptions and requirements
- **Applicant Tracking**: Manage applicants across multiple stages:
  - Applied
  - Shortlisted
  - Recommended
  - Hired
  - Declined
  - Withdrawn
- **Interview Scheduling**: Schedule online interviews with meeting links and notes
- **Bulk Email Operations**: Send acceptance or rejection emails to multiple applicants with a single click
- **Analytics Dashboard**: View recruitment metrics, applicant distribution, and job statistics with data visualizations
- **Public Job Board**: Candidates can view job details and submit applications

### Technical Stack

**Backend:**
- Node.js with Express
- TypeScript
- SQLite database
- Nodemailer for email functionality

**Frontend:**
- React 18 with TypeScript
- React Router for navigation
- Recharts for data visualization
- Vite for build tooling

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd project
```

2. Install dependencies for all packages:
```bash
npm run install:all
```

This will install dependencies for the root, server, and client packages.

3. Set up environment variables:
```bash
cd server
cp .env.example .env
```

Edit `server/.env` and configure:
- `PORT`: Server port (default: 3001)
- `DATABASE_PATH`: Path to SQLite database file
- `EMAIL_HOST`: SMTP server host (e.g., smtp.gmail.com)
- `EMAIL_PORT`: SMTP port (e.g., 587)
- `EMAIL_USER`: Your email address
- `EMAIL_PASS`: Your email app password
- `EMAIL_FROM`: From address for emails

**Note:** If email credentials are not configured, the system will log email details to the console instead of sending them.

### Running the Application

#### Development Mode (Recommended)

Run both server and client concurrently:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

#### Running Separately

**Backend only:**
```bash
npm run dev:server
# or
cd server && npm run dev
```

**Frontend only:**
```bash
npm run dev:client
# or
cd client && npm run dev
```

### Production Build

Build both server and client:
```bash
npm run build
```

Start the production server:
```bash
cd server && npm start
```

## Project Structure

```
project/
├── server/                 # Backend application
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── database.ts    # Database setup and utilities
│   │   ├── models/        # TypeScript interfaces
│   │   ├── routes/        # API route handlers
│   │   └── services/      # Business logic (email, etc.)
│   ├── package.json
│   └── tsconfig.json
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
└── package.json           # Root package.json with scripts
```

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs (optional query: `?status=open`)
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applicants
- `GET /api/applicants` - Get all applicants (optional queries: `?job_id=`, `?stage=`, `?status=`)
- `GET /api/applicants/:id` - Get applicant by ID
- `POST /api/applicants` - Create new applicant (job application)
- `PUT /api/applicants/:id` - Update applicant
- `POST /api/applicants/bulk-update-stage` - Bulk update applicant stages
- `DELETE /api/applicants/:id` - Delete applicant

### Interviews
- `GET /api/interviews` - Get all interviews (optional queries: `?applicant_id=`, `?job_id=`, `?status=`)
- `GET /api/interviews/:id` - Get interview by ID
- `POST /api/interviews` - Schedule new interview
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview

### Emails
- `POST /api/emails/bulk-acceptance` - Send bulk acceptance emails
- `POST /api/emails/bulk-rejection` - Send bulk rejection emails

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/applicants-by-stage` - Get applicants grouped by stage
- `GET /api/analytics/applicants-over-time` - Get applicants over time (optional query: `?days=30`)
- `GET /api/analytics/job-stats/:jobId` - Get statistics for a specific job

## Usage Guide

### For HR/Recruiters

1. **Creating Jobs**: Navigate to "Jobs" → "Create New Job" and fill in the job details.

2. **Managing Applicants**: 
   - View all applicants in the "Applicants" page
   - Filter by job, stage, or status
   - Update applicant stages directly from the list or detail page
   - View applicant details including resume and cover letter

3. **Scheduling Interviews**:
   - Open an applicant's detail page
   - Click "Schedule Interview"
   - Fill in the interview details and meeting link

4. **Bulk Email Operations**:
   - On a job detail page, select multiple applicants using checkboxes
   - Click "Send Acceptance" or "Send Rejection" to send bulk emails

5. **Analytics**: View the dashboard for recruitment metrics and visualizations

### For Candidates

1. **Viewing Jobs**: Navigate to `/jobs/:id` to view job details
2. **Applying**: Click "Apply for this Position" and fill out the application form

## Database

The application uses SQLite for data storage. The database file is created automatically on first run at the path specified in `DATABASE_PATH` (default: `server/database.sqlite`).

### Database Schema

- **jobs**: Job postings with title, department, location, description, etc.
- **applicants**: Applicant information linked to jobs
- **interviews**: Scheduled interviews linked to applicants and jobs

## Email Configuration

The application uses Nodemailer for sending emails. For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

If email is not configured, the application will log email details to the console for development purposes.

## Development

### Adding New Features

1. Backend: Add routes in `server/src/routes/` and models in `server/src/models/`
2. Frontend: Add pages in `client/src/pages/` and update routing in `client/src/App.tsx`
3. API: Update `client/src/services/api.ts` with new endpoints

### Code Style

- TypeScript strict mode enabled
- ES modules (ESM) for both frontend and backend
- React functional components with hooks

## License

MIT

## Support

For issues or questions, please check the code comments or create an issue in the repository.

