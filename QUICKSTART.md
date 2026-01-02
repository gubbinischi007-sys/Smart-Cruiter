# Quick Start Guide

## Installation Steps

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cd server
   # Create .env file
   cat > .env << EOF
   PORT=3001
   DATABASE_PATH=./database.sqlite
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@smartcruiter.com
   EOF
   ```

   **Note:** For email functionality, you can leave EMAIL_USER and EMAIL_PASS empty for development (emails will be logged to console).

3. **Start the application:**
   ```bash
   cd ..
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## First Steps

1. Create a job posting from the "Jobs" page
2. View the public job page at `/jobs/{job-id}`
3. Submit an application as a candidate
4. Manage applicants from the "Applicants" page
5. Schedule interviews and send bulk emails from job detail pages
6. View analytics on the Dashboard

## Troubleshooting

- **Database errors:** Ensure the server directory has write permissions for creating the SQLite database
- **Email errors:** If email credentials are not set, the app will log email content to the console instead
- **Port conflicts:** Change PORT in server/.env if 3001 is already in use
- **TypeScript errors:** Run `npm install` in both server/ and client/ directories

