require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const { requireAuth, requireRole } = require('./middleware/auth');

const { MONGO_URI, JWT_SECRET, PORT = 3000 } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(helmet());            // secure HTTP headers
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Public static files (login, register, css, js)
const pub = path.join(__dirname, 'public');
app.use(express.static(pub, { index: false }));

// API
app.use('/api/auth', authRoutes);

// Pages
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(pub, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(pub, 'register.html')));

// Protected pages: the server checks the token BEFORE sending the file
app.get('/dashboard', requireAuth({ redirect: true }), (req, res) =>
  res.sendFile(path.join(pub, 'dashboard.html')));
app.get('/admin', requireAuth({ redirect: true }), requireRole('admin', { redirect: true }), (req, res) =>
  res.sendFile(path.join(pub, 'admin.html')));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
