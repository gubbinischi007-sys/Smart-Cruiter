import { run } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export async function logHrAction(req: any, action: string) {
  try {
    const userEmail = req.headers['x-user-email'];
    const companyId = req.headers['x-company-id'];

    if (!userEmail) {
      console.warn('[ActivityLogger] No user email in headers, skipping log.');
      return;
    }

    const id = uuidv4();
    await run(
      'INSERT INTO hr_activity_logs (id, user_email, company_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        userEmail,
        companyId || null,
        action,
        new Date().toISOString()
      ]
    );
  } catch (err) {
    console.error('[ActivityLogger] Failed to log action:', err);
  }
}
