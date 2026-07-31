import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Storage setup for Multer uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max file size
});

// Fetch Messages with a Friend
router.get('/history/:friend_id', authMiddleware, async (req, res) => {
  try {
    const { friend_id } = req.params;
    const currentUserId = req.user.id;
    const db = await getDb();

    // Verify friendship or permission
    const isFriend = await db.get(
      'SELECT id FROM friends WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [currentUserId, friend_id, friend_id, currentUserId]
    );

    if (!isFriend) {
      return res.status(403).json({ error: 'You can only message confirmed friends.' });
    }

    const messages = await db.all(
      `SELECT m.*, 
              (SELECT json_object('id', a.id, 'file_name', a.file_name, 'file_path', a.file_path, 'file_type', a.file_type, 'file_size', a.file_size) 
               FROM attachments a WHERE a.message_id = m.id) as attachment
       FROM messages m
       WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
       ORDER BY m.created_at ASC`,
      [currentUserId, friend_id, friend_id, currentUserId]
    );

    // Filter out messages deleted for current user
    const filtered = messages.map(msg => {
      let deletedUsers = [];
      try {
        deletedUsers = JSON.parse(msg.deleted_for_users || '[]');
      } catch (e) {
        deletedUsers = [];
      }

      if (deletedUsers.includes(currentUserId)) {
        return null;
      }

      if (msg.attachment) {
        try {
          msg.attachment = JSON.parse(msg.attachment);
        } catch (e) {}
      }

      if (msg.deleted_for_everyone) {
        return {
          ...msg,
          message: '🚫 This message was deleted.',
          attachment: null
        };
      }

      return msg;
    }).filter(Boolean);

    // Mark messages from friend as READ
    await db.run(
      `UPDATE messages SET status = 'read' WHERE sender_id = ? AND receiver_id = ? AND status != 'read'`,
      [friend_id, currentUserId]
    );

    res.json({ messages: filtered });
  } catch (err) {
    console.error('Fetch Messages Error:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Upload Attachment File (Image / Document / Voice Note)
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image/')
      ? 'image'
      : req.file.mimetype.startsWith('audio/')
      ? 'voice'
      : 'document';

    res.json({
      file_name: req.file.originalname,
      file_path: fileUrl,
      file_type: fileType,
      file_size: req.file.size
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'File upload failed.' });
  }
});

// Search Chat Messages
router.get('/search/:friend_id', authMiddleware, async (req, res) => {
  try {
    const { friend_id } = req.params;
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim() === '') {
      return res.json({ messages: [] });
    }

    const db = await getDb();
    const query = `%${q.trim().toLowerCase()}%`;

    const results = await db.all(
      `SELECT m.* FROM messages m
       WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
         AND m.deleted_for_everyone = 0
         AND LOWER(m.message) LIKE ?
       ORDER BY m.created_at DESC`,
      [currentUserId, friend_id, friend_id, currentUserId, query]
    );

    res.json({ messages: results });
  } catch (err) {
    res.status(500).json({ error: 'Search failed.' });
  }
});

// Edit Message
router.put('/edit/:message_id', authMiddleware, async (req, res) => {
  try {
    const { message_id } = req.params;
    const { new_message } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    const msg = await db.get('SELECT * FROM messages WHERE id = ?', [message_id]);
    if (!msg || msg.sender_id !== currentUserId) {
      return res.status(403).json({ error: 'You can only edit your own messages.' });
    }

    if (msg.deleted_for_everyone) {
      return res.status(400).json({ error: 'Cannot edit a deleted message.' });
    }

    await db.run(
      'UPDATE messages SET message = ?, edited = 1 WHERE id = ?',
      [new_message, message_id]
    );

    res.json({ message: 'Message updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to edit message.' });
  }
});

// Delete Message for Me
router.post('/delete-for-me', authMiddleware, async (req, res) => {
  try {
    const { message_id } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    const msg = await db.get('SELECT deleted_for_users FROM messages WHERE id = ?', [message_id]);
    if (!msg) return res.status(404).json({ error: 'Message not found.' });

    let deletedUsers = [];
    try {
      deletedUsers = JSON.parse(msg.deleted_for_users || '[]');
    } catch (e) {}

    if (!deletedUsers.includes(currentUserId)) {
      deletedUsers.push(currentUserId);
    }

    await db.run(
      'UPDATE messages SET deleted_for_users = ? WHERE id = ?',
      [JSON.stringify(deletedUsers), message_id]
    );

    res.json({ message: 'Message deleted for you.' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed.' });
  }
});

// Delete Message for Everyone
router.post('/delete-for-everyone', authMiddleware, async (req, res) => {
  try {
    const { message_id } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    const msg = await db.get('SELECT * FROM messages WHERE id = ?', [message_id]);
    if (!msg || msg.sender_id !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete your own messages for everyone.' });
    }

    await db.run(
      'UPDATE messages SET deleted_for_everyone = 1, message = "🚫 This message was deleted." WHERE id = ?',
      [message_id]
    );

    res.json({ message: 'Message deleted for everyone.' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed.' });
  }
});

// Clear Chat with Friend
router.post('/clear-chat', authMiddleware, async (req, res) => {
  try {
    const { friend_id } = req.body;
    const currentUserId = req.user.id;
    const db = await getDb();

    const messages = await db.all(
      `SELECT id, deleted_for_users FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
      [currentUserId, friend_id, friend_id, currentUserId]
    );

    for (const msg of messages) {
      let users = [];
      try {
        users = JSON.parse(msg.deleted_for_users || '[]');
      } catch (e) {}
      if (!users.includes(currentUserId)) {
        users.push(currentUserId);
        await db.run('UPDATE messages SET deleted_for_users = ? WHERE id = ?', [JSON.stringify(users), msg.id]);
      }
    }

    res.json({ message: 'Chat history cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Clear chat failed.' });
  }
});

export default router;
