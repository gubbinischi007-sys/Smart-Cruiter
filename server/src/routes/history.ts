import { Router } from 'express';
import { all, run } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all history
router.get('/', async (req, res) => {
    try {
        const history = await all('SELECT * FROM application_history ORDER BY date DESC');
        res.json(history);
    } catch (error) {
        console.error('Failed to fetch history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST new history record
router.get('/stats', async (req, res) => {
    try {
        const stats = await all('SELECT status, COUNT(*) as count FROM application_history GROUP BY status');
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.post('/', async (req, res) => {
    const { name, email, job_title, status, reason } = req.body;

    if (!name || !email || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const id = uuidv4();
        await run(
            'INSERT INTO application_history (id, name, email, job_title, status, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, email, job_title, status, reason, new Date().toISOString()]
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

export default router;
