import { run, initDatabase, all } from './src/database.js';

async function main() {
    await initDatabase();
    const applicants = await all<any>("SELECT * FROM applicants WHERE email='prab@gmail.com'");
    if (applicants.length > 0) {
        for (const app of applicants) {
            await run("UPDATE applicants SET stage='rejected', status='rejected' WHERE id=?", [app.id]);

            // Delete the mock interview
            await run("DELETE FROM interviews WHERE applicant_id=?", [app.id]);
        }
        console.log("Reverted prab@gmail.com back to rejected status and removed mock interview.");
    } else {
        console.log("Applicant not found");
    }
}
main().catch(console.error);
