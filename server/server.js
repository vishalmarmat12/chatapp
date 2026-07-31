import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { getDb } from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import settingRoutes from './routes/settings.js';
import { initSocketHandler } from './sockets/socketHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Static Files (Images, Docs, Voice Notes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

initSocketHandler(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Calculator Vault API Server is running smoothly!' });
});

// Serve Client Web Production Build
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Calculator Vault</title>
            <style>
              body { background: #090d16; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #1e293b; padding: 2rem; border-radius: 1rem; max-width: 400px; text-align: center; border: 1px solid #334155; }
              h1 { font-size: 1.5rem; color: #06b6d4; }
              p { color: #94a3b8; font-size: 0.9rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>🧮 Calculator Vault App</h1>
              <p>API Server is live and healthy. Web build is initializing...</p>
            </div>
          </body>
        </html>
      `);
    }
  }
});

const PORT = process.env.PORT || 5000;

// Initialize DB and start HTTP server
getDb().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 ChatNest / ByteChat Server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
