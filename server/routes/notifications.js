import express from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get Notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const db = await getDb();

    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [currentUserId]
    );

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark Notification Read
router.put('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { notification_id } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    if (notification_id) {
      await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notification_id, currentUserId]);
    } else {
      await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [currentUserId]);
    }

    res.json({ message: 'Notifications updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed.' });
  }
});

// Delete Notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    await db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed.' });
  }
});

export default router;
