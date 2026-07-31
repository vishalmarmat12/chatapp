import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get User Settings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    let settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (!settings) {
      await db.run('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.id]);
      settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// Update Settings
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { theme, show_online, show_last_seen, show_profile_photo, who_can_message, read_receipts, typing_status } = req.body;
    const db = await getDb();

    await db.run(
      `UPDATE user_settings SET 
         theme = COALESCE(?, theme),
         show_online = COALESCE(?, show_online),
         show_last_seen = COALESCE(?, show_last_seen),
         show_profile_photo = COALESCE(?, show_profile_photo),
         who_can_message = COALESCE(?, who_can_message),
         read_receipts = COALESCE(?, read_receipts),
         typing_status = COALESCE(?, typing_status)
       WHERE user_id = ?`,
      [theme, show_online, show_last_seen, show_profile_photo, who_can_message, read_receipts, typing_status, req.user.id]
    );

    const updated = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Settings updated successfully.', settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// Block User
router.post('/block', authMiddleware, async (req, res) => {
  try {
    const { user_to_block_id } = req.body;
    const currentUserId = req.user.id;

    if (!user_to_block_id) return res.status(400).json({ error: 'Target user ID is required.' });
    if (user_to_block_id === currentUserId) return res.status(400).json({ error: 'You cannot block yourself.' });

    const db = await getDb();

    const existing = await db.get(
      'SELECT id FROM block_users WHERE blocker_id = ? AND blocked_id = ?',
      [currentUserId, user_to_block_id]
    );

    if (!existing) {
      await db.run(
        'INSERT INTO block_users (id, blocker_id, blocked_id) VALUES (?, ?, ?)',
        [uuidv4(), currentUserId, user_to_block_id]
      );
    }

    res.json({ message: 'User blocked successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block user.' });
  }
});

// Unblock User
router.post('/unblock', authMiddleware, async (req, res) => {
  try {
    const { user_to_unblock_id } = req.body;
    const currentUserId = req.user.id;

    const db = await getDb();
    await db.run(
      'DELETE FROM block_users WHERE blocker_id = ? AND blocked_id = ?',
      [currentUserId, user_to_unblock_id]
    );

    res.json({ message: 'User unblocked successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock user.' });
  }
});

// List Blocked Users
router.get('/blocked-list', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const db = await getDb();

    const list = await db.all(
      `SELECT u.id, u.fullname, u.username, u.unique_id, u.profile_photo, bu.created_at as blocked_at
       FROM block_users bu
       JOIN users u ON bu.blocked_id = u.id
       WHERE bu.blocker_id = ?`,
      [currentUserId]
    );

    res.json({ blocked_users: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blocked users list.' });
  }
});

// Delete Account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const db = await getDb();

    await db.run('DELETE FROM users WHERE id = ?', [currentUserId]);
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

export default router;
