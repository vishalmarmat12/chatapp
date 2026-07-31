import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Send Friend Request
router.post('/request/send', authMiddleware, async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id) {
      return res.status(400).json({ error: 'Receiver ID is required.' });
    }

    if (sender_id === receiver_id) {
      return res.status(400).json({ error: 'You cannot send a friend request to yourself.' });
    }

    const db = await getDb();

    // Check if blocked
    const isBlocked = await db.get(
      'SELECT id FROM block_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
      [sender_id, receiver_id, receiver_id, sender_id]
    );
    if (isBlocked) {
      return res.status(400).json({ error: 'Cannot send request due to user block settings.' });
    }

    // Check if already friends
    const existingFriend = await db.get(
      'SELECT id FROM friends WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [sender_id, receiver_id, receiver_id, sender_id]
    );
    if (existingFriend) {
      return res.status(400).json({ error: 'You are already friends with this user.' });
    }

    // Check existing request
    const existingRequest = await db.get(
      'SELECT id, status FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ error: 'Friend request is already pending.' });
      }
      // If previously rejected, allow re-sending by updating record
      await db.run(
        'UPDATE friend_requests SET sender_id = ?, receiver_id = ?, status = "pending", created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [sender_id, receiver_id, existingRequest.id]
      );
    } else {
      const requestId = uuidv4();
      await db.run(
        'INSERT INTO friend_requests (id, sender_id, receiver_id, status) VALUES (?, ?, ?, "pending")',
        [requestId, sender_id, receiver_id]
      );
    }

    // Create Notification for receiver
    const sender = await db.get('SELECT fullname, username FROM users WHERE id = ?', [sender_id]);
    await db.run(
      'INSERT INTO notifications (id, user_id, title, description, type) VALUES (?, ?, ?, ?, "friend_request")',
      [
        uuidv4(),
        receiver_id,
        'New Friend Request',
        `${sender.fullname} (@${sender.username}) sent you a friend request.`,
      ]
    );

    res.json({ message: 'Friend request sent successfully!' });
  } catch (err) {
    console.error('Send Request Error:', err);
    res.status(500).json({ error: 'Failed to send friend request.' });
  }
});

// Accept Friend Request
router.post('/request/accept', authMiddleware, async (req, res) => {
  try {
    const { request_id } = req.body;
    const currentUserId = req.user.id;

    const db = await getDb();

    const request = await db.get(
      'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = "pending"',
      [request_id, currentUserId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found or already processed.' });
    }

    // Update request status to accepted
    await db.run('UPDATE friend_requests SET status = "accepted" WHERE id = ?', [request_id]);

    // Insert into friends table
    const friendId = uuidv4();
    await db.run(
      'INSERT INTO friends (id, user1_id, user2_id) VALUES (?, ?, ?)',
      [friendId, request.sender_id, request.receiver_id]
    );

    // Notify sender that request was accepted
    const receiver = await db.get('SELECT fullname, username FROM users WHERE id = ?', [currentUserId]);
    await db.run(
      'INSERT INTO notifications (id, user_id, title, description, type) VALUES (?, ?, ?, ?, "request_accepted")',
      [
        uuidv4(),
        request.sender_id,
        'Friend Request Accepted',
        `${receiver.fullname} (@${receiver.username}) accepted your friend request!`,
      ]
    );

    res.json({ message: 'Friend request accepted!' });
  } catch (err) {
    console.error('Accept Request Error:', err);
    res.status(500).json({ error: 'Failed to accept friend request.' });
  }
});

// Reject / Decline Friend Request
router.post('/request/reject', authMiddleware, async (req, res) => {
  try {
    const { request_id } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    await db.run(
      'UPDATE friend_requests SET status = "rejected" WHERE id = ? AND receiver_id = ?',
      [request_id, currentUserId]
    );

    res.json({ message: 'Friend request declined.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline request.' });
  }
});

// Cancel Outgoing Request
router.post('/request/cancel', authMiddleware, async (req, res) => {
  try {
    const { request_id } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    await db.run(
      'DELETE FROM friend_requests WHERE id = ? AND sender_id = ?',
      [request_id, currentUserId]
    );

    res.json({ message: 'Friend request cancelled.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel request.' });
  }
});

// Get Pending Requests (Incoming & Outgoing)
router.get('/requests/pending', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const db = await getDb();

    const incoming = await db.all(
      `SELECT fr.id as request_id, fr.created_at, u.id as user_id, u.fullname, u.username, u.unique_id, u.profile_photo, u.bio
       FROM friend_requests fr
       JOIN users u ON fr.sender_id = u.id
       WHERE fr.receiver_id = ? AND fr.status = 'pending'`,
      [currentUserId]
    );

    const outgoing = await db.all(
      `SELECT fr.id as request_id, fr.created_at, u.id as user_id, u.fullname, u.username, u.unique_id, u.profile_photo, u.bio
       FROM friend_requests fr
       JOIN users u ON fr.receiver_id = u.id
       WHERE fr.sender_id = ? AND fr.status = 'pending'`,
      [currentUserId]
    );

    res.json({ incoming, outgoing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending requests.' });
  }
});

// Get Friends List
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const db = await getDb();

    const friends = await db.all(
      `SELECT f.id as relationship_id, f.is_favorite, f.is_pinned, f.created_at as friends_since,
              u.id as id, u.fullname, u.username, u.email, u.unique_id, u.bio, u.profile_photo, u.status, u.last_seen,
              (SELECT message FROM messages 
               WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
               ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages 
               WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
               ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages 
               WHERE sender_id = u.id AND receiver_id = ? AND status != 'read') as unread_count
       FROM friends f
       JOIN users u ON (f.user1_id = u.id OR f.user2_id = u.id) AND u.id != ?
       WHERE f.user1_id = ? OR f.user2_id = ?
       ORDER BY f.is_pinned DESC, last_message_time DESC`,
      [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId]
    );

    res.json({ friends });
  } catch (err) {
    console.error('Fetch Friends Error:', err);
    res.status(500).json({ error: 'Failed to fetch friends list.' });
  }
});

// Toggle Favorite / Pin Friend
router.put('/action', authMiddleware, async (req, res) => {
  try {
    const { friend_user_id, is_favorite, is_pinned } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    if (is_favorite !== undefined) {
      await db.run(
        `UPDATE friends SET is_favorite = ? 
         WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
        [is_favorite ? 1 : 0, currentUserId, friend_user_id, friend_user_id, currentUserId]
      );
    }

    if (is_pinned !== undefined) {
      await db.run(
        `UPDATE friends SET is_pinned = ? 
         WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
        [is_pinned ? 1 : 0, currentUserId, friend_user_id, friend_user_id, currentUserId]
      );
    }

    res.json({ message: 'Friend updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update friend status.' });
  }
});

// Unfriend User
router.delete('/unfriend/:friend_user_id', authMiddleware, async (req, res) => {
  try {
    const { friend_user_id } = req.params;
    const currentUserId = req.user.id;
    const db = await getDb();

    await db.run(
      'DELETE FROM friends WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [currentUserId, friend_user_id, friend_user_id, currentUserId]
    );

    await db.run(
      'DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [currentUserId, friend_user_id, friend_user_id, currentUserId]
    );

    res.json({ message: 'Unfriended successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unfriend user.' });
  }
});

export default router;
