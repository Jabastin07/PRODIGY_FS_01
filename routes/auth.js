const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Slow down brute-force attempts: 10 tries per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in 15 minutes.' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 characters, with a letter and a number
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

function setTokenCookie(res, user) {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
  res.cookie('token', token, {
    httpOnly: true,                                 // browser JavaScript cannot read it (limits XSS token theft)
    sameSite: 'strict',                             // not sent on cross-site requests (limits CSRF)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    maxAge: 60 * 60 * 1000,
  });
}

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name) return res.status(400).json({ message: 'Name is required.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!PASSWORD_RE.test(password))
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number.' });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 12); // 12 salt rounds
    const isAdmin = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase();
    const user = await User.create({ name, email, password: hash, role: isAdmin ? 'admin' : 'user' });

    setTokenCookie(res, user);
    res.status(201).json({ message: 'Account created.', user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email }).select('+password');
    // Same message for "no such user" and "wrong password" so attackers cannot discover which emails exist
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ message: 'Incorrect email or password.' });

    setTokenCookie(res, user);
    res.json({ message: 'Logged in.', user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out.' });
});

// GET /api/auth/me  (protected)
router.get('/me', requireAuth(), (req, res) => res.json({ user: publicUser(req.user) }));

// GET /api/auth/users  (admin only)
router.get('/users', requireAuth(), requireRole('admin'), async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((u) => ({ ...publicUser(u), createdAt: u.createdAt })) });
});

module.exports = router;
