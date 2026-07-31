import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate Unique User ID like BYT10458
async function generateUniqueId(db) {
  let isUnique = false;
  let uniqueId = '';
  while (!isUnique) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    uniqueId = `BYT${randomNum}`;
    const existing = await db.get('SELECT id FROM users WHERE unique_id = ?', [uniqueId]);
    if (!existing) {
      isUnique = true;
    }
  }
  return uniqueId;
}

// Store OTPs temporarily in memory for demo email verification / forgot password
const otpStore = new Map();

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullname, username, email, password, bio } = req.body;

    if (!fullname || !username || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const db = await getDb();

    // Check if username or email already exists
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await db.get(
      'SELECT username, email FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
      if (existingUser.email === cleanEmail) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const uniqueId = await generateUniqueId(db);

    await db.run(
      `INSERT INTO users (id, fullname, username, email, password, unique_id, bio, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'online')`,
      [userId, fullname.trim(), cleanUsername, cleanEmail, hashedPassword, uniqueId, bio || 'Hey there! I am using ChatNest.']
    );

    // Initialize Default User Settings
    await db.run(
      `INSERT INTO user_settings (user_id) VALUES (?)`,
      [userId]
    );

    const token = jwt.sign({ id: userId, username: cleanUsername, email: cleanEmail, unique_id: uniqueId }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const newUser = await db.get(
      'SELECT id, fullname, username, email, unique_id, bio, profile_photo, cover_photo, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body; // username or email

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email and Password are required.' });
    }

    const db = await getDb();
    const cleanId = loginIdentifier.trim().toLowerCase();

    const user = await db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [cleanId, cleanId]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    // Update status to online
    await db.run('UPDATE users SET status = "online" WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, unique_id: user.unique_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful!',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const db = await getDb();
    const user = await db.get('SELECT id, email FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(user.email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    res.json({
      message: `OTP sent successfully! (Demo OTP: ${otp})`,
      demoOtp: otp // Returned so user can test seamlessly without needing actual SMTP setup
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generating reset OTP.' });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const record = otpStore.get(email.trim().toLowerCase());
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const db = await getDb();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.trim().toLowerCase()]);

    otpStore.delete(email.trim().toLowerCase());

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Error resetting password.' });
  }
});

// Get Current Logged-in User
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get(
      'SELECT id, fullname, username, email, unique_id, bio, profile_photo, cover_photo, status, last_seen, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);

    res.json({ user, settings: settings || {} });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profile.' });
  }
});

export default router;
