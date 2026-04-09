import { Router } from 'express';
import { all, run, get } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all history
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        const companyId = req.headers['x-company-id'];
        let query = 'SELECT * FROM application_history WHERE 1=1';
        const params: any[] = [];

        if (email) {
            query += ' AND email = ?';
            params.push(email);
        }
        if (companyId) {
            query += ' AND company_id = ?';
            params.push(companyId);
        }

        query += ' ORDER BY date DESC';

        const history = await all(query, params);
        res.json(history);
    } catch (error) {
        console.error('Failed to fetch history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST new history record
router.get('/stats', async (req, res) => {
    try {
        const companyId = req.headers['x-company-id'];
        let query = 'SELECT status, COUNT(*) as count FROM application_history WHERE 1=1';
        const params: any[] = [];
        if (companyId) {
            query += ' AND company_id = ?';
            params.push(companyId);
        }
        query += ' GROUP BY status';

        const stats = await all(query, params);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.post('/', async (req, res) => {
    const { name, email, job_title, status, reason } = req.body;
    const companyId = req.headers['x-company-id'];

    if (!name || !email || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const id = uuidv4();
        await run(
            'INSERT INTO application_history (id, name, email, job_title, status, reason, company_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, email, job_title, status, reason, companyId || null, new Date().toISOString()]
        );
        res.status(201).json({ id, name, email, status });
    } catch (error) {
        console.error('Failed to create history record:', error);
        res.status(500).json({ error: 'Failed to create history record' });
    }
});

router.delete('/', async (req, res) => {
    try {
        await run('DELETE FROM application_history');
        res.json({ message: 'History cleared successfully' });
    } catch (error) {
        console.error('Failed to clear history:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await run('DELETE FROM application_history WHERE id = ?', [req.params.id]);
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Failed to delete history record:', error);
        res.status(500).json({ error: 'Failed to delete history record' });
    }
});

router.get('/activity', async (req, res) => {
    try {
        const companyId = req.headers['x-company-id'];
        let query = 'SELECT * FROM hr_activity_logs WHERE 1=1';
        const params: any[] = [];

        if (companyId) {
            query += ' AND company_id = ?';
            params.push(companyId);
        }

        query += ' ORDER BY created_at DESC LIMIT 500';

        const logs = await all(query, params);
        res.json(logs);
    } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

router.get('/sessions', async (req, res) => {
    try {
        const companyId = req.headers['x-company-id'];
        let query = 'SELECT * FROM user_sessions WHERE 1=1';
        const params: any[] = [];

        if (companyId) {
            query += ' AND company_id = ?';
            params.push(companyId);
        }

        query += ' ORDER BY login_time DESC LIMIT 100';

        const sessions = await all(query, params);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

router.post('/sessions/start', async (req, res) => {
    const { email } = req.body;
    const companyId = req.headers['x-company-id'];
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // Prevent duplicates: Check for an existing active session for this user/company
        const existingSession = await get(
            'SELECT id FROM user_sessions WHERE user_email = ? AND (company_id = ? OR (company_id IS NULL AND ? IS NULL)) AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1',
            [email, companyId || null, companyId || null]
        );

        if (existingSession) {
            return res.json({ sessionId: existingSession.id });
        }

        // Close any other "dangling" active sessions for this user before starting a new one
        await run(
            'UPDATE user_sessions SET logout_time = ? WHERE user_email = ? AND logout_time IS NULL',
            [new Date().toISOString(), email]
        );

        const id = uuidv4();
        await run(
            'INSERT INTO user_sessions (id, user_email, company_id, login_time) VALUES (?, ?, ?, ?)',
            [id, email, companyId || null, new Date().toISOString()]
        );
        res.json({ sessionId: id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start session' });
    }
});

router.post('/sessions/stop', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    try {
        await run(
            'UPDATE user_sessions SET logout_time = ? WHERE id = ?',
            [new Date().toISOString(), sessionId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop session' });
    }
});

export default router;
