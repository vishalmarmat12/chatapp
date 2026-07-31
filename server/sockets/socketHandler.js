import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

// Track online socket connections by userId
const onlineUsers = new Map(); // userId -> set of socket.ids

export function initSocketHandler(io) {
  // Socket JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`⚡ Socket Connected: User ${socket.user.username} (${socket.id})`);

    // Add socket ID to onlineUsers Map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal room for private socket events
    socket.join(`user_${userId}`);

    // Update DB status to online & broadcast status
    const db = await getDb();
    await db.run('UPDATE users SET status = "online" WHERE id = ?', [userId]);

    io.emit('user_status_change', {
      userId,
      status: 'online'
    });

    // 1. SEND MESSAGE EVENT
    socket.on('send_message', async (data, callback) => {
      try {
        const { receiver_id, message, message_type = 'text', reply_to_id, attachment } = data;

        if (!receiver_id) {
          if (callback) callback({ error: 'Receiver ID is required.' });
          return;
        }

        // Verify users are friends
        const isFriend = await db.get(
          'SELECT id FROM friends WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
          [userId, receiver_id, receiver_id, userId]
        );

        if (!isFriend) {
          if (callback) callback({ error: 'You can only message confirmed friends.' });
          return;
        }

        const messageId = uuidv4();
        // Initial status: if receiver is online in sockets, set 'delivered', else 'sent'
        const isReceiverOnline = onlineUsers.has(receiver_id) && onlineUsers.get(receiver_id).size > 0;
        const initialStatus = isReceiverOnline ? 'delivered' : 'sent';

        await db.run(
          `INSERT INTO messages (id, sender_id, receiver_id, message, message_type, reply_to_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [messageId, userId, receiver_id, message || '', message_type, reply_to_id || null, initialStatus]
        );

        // Store attachment if present
        if (attachment) {
          await db.run(
            `INSERT INTO attachments (id, message_id, file_name, file_path, file_type, file_size)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), messageId, attachment.file_name, attachment.file_path, attachment.file_type, attachment.file_size || 0]
          );
        }

        // Retrieve created message payload with attachment info
        const newMsg = await db.get(
          `SELECT m.*, 
                  (SELECT json_object('id', a.id, 'file_name', a.file_name, 'file_path', a.file_path, 'file_type', a.file_type, 'file_size', a.file_size) 
                   FROM attachments a WHERE a.message_id = m.id) as attachment
           FROM messages m WHERE m.id = ?`,
          [messageId]
        );

        if (newMsg.attachment) {
          try {
            newMsg.attachment = JSON.parse(newMsg.attachment);
          } catch (e) {}
        }

        // Emit message to receiver's room and sender's room
        io.to(`user_${receiver_id}`).emit('new_message', newMsg);
        io.to(`user_${userId}`).emit('new_message', newMsg);

        if (callback) callback({ success: true, message: newMsg });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ error: 'Failed to send message.' });
      }
    });

    // 2. TYPING INDICATOR EVENTS
    socket.on('typing', ({ receiver_id }) => {
      io.to(`user_${receiver_id}`).emit('user_typing', { sender_id: userId });
    });

    socket.on('stop_typing', ({ receiver_id }) => {
      io.to(`user_${receiver_id}`).emit('user_stop_typing', { sender_id: userId });
    });

    // 3. MARK MESSAGES READ
    socket.on('mark_read', async ({ sender_id }) => {
      try {
        await db.run(
          `UPDATE messages SET status = 'read' WHERE sender_id = ? AND receiver_id = ? AND status != 'read'`,
          [sender_id, userId]
        );

        io.to(`user_${sender_id}`).emit('messages_read', { reader_id: userId });
      } catch (err) {
        console.error('Mark read socket error:', err);
      }
    });

    // 4. DISCONNECT EVENT
    socket.on('disconnect', async () => {
      console.log(`❌ Socket Disconnected: User ${socket.user.username} (${socket.id})`);

      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          // Update status to offline and set last_seen
          const nowIso = new Date().toISOString();
          await db.run(
            'UPDATE users SET status = "offline", last_seen = ? WHERE id = ?',
            [nowIso, userId]
          );

          io.emit('user_status_change', {
            userId,
            status: 'offline',
            last_seen: nowIso
          });
        }
      }
    });
  });
}
