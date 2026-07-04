const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'skillswap_secret_key_12345';

// =========================================================================
// 1. SIGNUP ROUTE: POST /api/auth/signup
// Handles user registration.
// =========================================================================
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic Input Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields (name, email, password).' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if the user already exists in the database
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash the password using bcrypt.
    // Hashing is a one-way process. It converts a plain-text password into a fixed-length string of characters (a hash).
    // The "10" is the number of "salt rounds", which makes the hashing mathematically secure and slow to crack by hackers.
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user into the database
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const userId = result.insertId;

    // Generate a JWT token.
    // The token contains the user's ID and email, is signed by the secret key, and will expire in 24 hours.
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });

    // Send token and user details back to frontend
    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        teach_skill: '',
        learn_skill: '',
        bio: ''
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// =========================================================================
// 2. LOGIN ROUTE: POST /api/auth/login
// Handles user authentication.
// =========================================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic Input Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  try {
    // Find the user by their email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Compare the raw password input by the user with the stored password hash in the database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token since password matched
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // Send token and user details back to frontend (excluding password_hash)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        teach_skill: user.teach_skill,
        learn_skill: user.learn_skill,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
