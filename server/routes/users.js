import express from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Search users by Username or User ID (e.g. @vishal or BYT10458)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const query = q.trim().replace(/^@/, '').toLowerCase();
    const db = await getDb();
    const currentUserId = req.user.id;

    const results = await db.all(
      `SELECT u.id, u.fullname, u.username, u.email, u.unique_id, u.bio, u.profile_photo, u.status, u.last_seen,
              (SELECT status FROM friend_requests WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)) as request_status,
              (SELECT sender_id FROM friend_requests WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)) as request_sender,
              (SELECT id FROM friends WHERE (user1_id = ? AND user2_id = u.id) OR (user1_id = u.id AND user2_id = ?)) as friend_id
       FROM users u
       WHERE u.id != ? AND (LOWER(u.username) LIKE ? OR LOWER(u.unique_id) LIKE ? OR LOWER(u.fullname) LIKE ?)
       LIMIT 20`,
      [
        currentUserId, currentUserId,
        currentUserId, currentUserId,
        currentUserId, currentUserId,
        currentUserId,
        `%${query}%`, `%${query}%`, `%${query}%`
      ]
    );

    res.json({ users: results });
  } catch (err) {
    console.error('Search Users Error:', err);
    res.status(500).json({ error: 'Failed to search users.' });
  }
});

// Update Profile Info (Fullname, Bio, Profile Photo, Cover Photo)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullname, bio, profile_photo, cover_photo } = req.body;
    const db = await getDb();

    await db.run(
      `UPDATE users 
       SET fullname = COALESCE(?, fullname),
           bio = COALESCE(?, bio),
           profile_photo = COALESCE(?, profile_photo),
           cover_photo = COALESCE(?, cover_photo)
       WHERE id = ?`,
      [fullname, bio, profile_photo, cover_photo, req.user.id]
    );

    const updatedUser = await db.get(
      'SELECT id, fullname, username, email, unique_id, bio, profile_photo, cover_photo, status, last_seen, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Fetch Single User Profile by ID or Username
router.get('/:identifier', authMiddleware, async (req, res) => {
  try {
    const { identifier } = req.params;
    const db = await getDb();
    const currentUserId = req.user.id;

    const user = await db.get(
      `SELECT u.id, u.fullname, u.username, u.email, u.unique_id, u.bio, u.profile_photo, u.cover_photo, u.status, u.last_seen, u.created_at,
              (SELECT status FROM friend_requests WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)) as request_status,
              (SELECT sender_id FROM friend_requests WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)) as request_sender,
              (SELECT id FROM friends WHERE (user1_id = ? AND user2_id = u.id) OR (user1_id = u.id AND user2_id = ?)) as friend_id
       FROM users u
       WHERE u.id = ? OR u.username = ? OR u.unique_id = ?`,
      [
        currentUserId, currentUserId,
        currentUserId, currentUserId,
        currentUserId, currentUserId,
        identifier, identifier, identifier
      ]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user profile.' });
  }
});

export default router;
