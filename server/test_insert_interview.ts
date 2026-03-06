import { run, initDatabase, all } from './src/database.js';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    await initDatabase();
    const applicants = await all<any>("SELECT * FROM applicants WHERE email='prab@gmail.com'");
    if (applicants.length > 0) {
        const app = applicants[0];
        await run("UPDATE applicants SET stage='interview', status='active' WHERE id=?", [app.id]);

        // Delete existing interviews for this applicant to avoid duplicates
        await run("DELETE FROM interviews WHERE applicant_id=?", [app.id]);

        // Create an interview
        const interviewId = uuidv4();
        const futureDate = new Date(Date.now() + 86400000 * 2).toISOString(); // 2 days from now
        await run(`INSERT INTO interviews (id, applicant_id, job_id, scheduled_at, type, meeting_link, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                interviewId,
                app.id,
                app.job_id,
                futureDate,
                'online',
                'https://meet.google.com/abc-defg-hij',
                'Please prepare a brief introduction of your past projects. Make sure to have a stable internet connection and be ready to share your screen.',
                'scheduled',
                new Date().toISOString(),
                new Date().toISOString()
            ]
        );
        console.log("Updated applicant and inserted interview.");
    } else {
        console.log("Applicant not found");
    }
}
main().catch(console.error);
