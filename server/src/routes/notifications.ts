import express from 'express';
import { get, all, run } from '../database.js';

const router = express.Router();

// Get all notifications for a specific email
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email query parameter is required' });
        }

        const { data: notifications, error } = await (await import('../lib/supabase.js')).supabase
            .from('notifications')
            .select('*')
            .ilike('recipient_email', (email as string).trim())
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(notifications || []);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get unread notifications count
router.get('/unread-count', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const { count, error } = await (await import('../lib/supabase.js')).supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .ilike('recipient_email', (email as string).trim())
            .eq('is_read', 0);

        if (error) throw error;
        
        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Notifications] Marking as read: ${id}`);
        
        const { error } = await (await import('../lib/supabase.js')).supabase
            .from('notifications')
            .update({ is_read: 1 })
            .eq('id', id);

        if (error) throw error;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Delete a single notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await run('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Bulk delete notifications
router.delete('/', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required in body' });
        }

        const placeholders = ids.map(() => '?').join(',');
        await run(`DELETE FROM notifications WHERE id IN (${placeholders})`, ids);
        res.json({ success: true, count: ids.length });
    } catch (error) {
        console.error('Error bulk deleting notifications:', error);
        res.status(500).json({ error: 'Failed to bulk delete notifications' });
    }
});

export { router as notificationRoutes };
