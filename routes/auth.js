const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { authenticateToken, loginRateLimit } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  sanitizeInput, 
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

// Registrasi user baru
router.post('/register', 
  sanitizeInput,
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, full_name } = req.body;
      const db = getDatabase();

      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
          console.error('Database error during registration:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (row) {
          return res.status(409).json({
            error: 'User already exists',
            message: 'An account with this email already exists'
          });
        }

        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);


        db.run(
          'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
          [email, passwordHash, full_name],
          function(err) {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }

            // Generate JWT token
            const token = jwt.sign(
              { id: this.lastID, email },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.status(201).json({
              message: 'User registered successfully',
              user: {
                id: this.lastID,
                email,
                full_name
              },
              token
            });
          }
        );
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Login user
router.post('/login',
  sanitizeInput,
  validateLogin,
  handleValidationErrors,
  loginRateLimit,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');
      const db = getDatabase();

      db.get(
        'SELECT id, email, password_hash, full_name, login_attempts, locked_until, is_active FROM users WHERE email = ?',
        [email],
        async (err, user) => {
          if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          if (!user) {
            db.run(
              'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, 0)',
              [email, ip, userAgent]
            );
            
            return res.status(401).json({
              error: 'Invalid credentials',
              message: 'Email or password is incorrect'
            });
          }

          if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(423).json({
              error: 'Account locked',
              message: 'Account is temporarily locked due to too many failed attempts'
            });
          }

          if (!user.is_active) {
            return res.status(401).json({
              error: 'Account deactivated',
              message: 'This account has been deactivated'
            });
          }

          const isValidPassword = await bcrypt.compare(password, user.password_hash);

          if (!isValidPassword) {
            const newAttempts = user.login_attempts + 1;
            let lockedUntil = null;

            if (newAttempts >= 5) {
              lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            }

            db.run(
              'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
              [newAttempts, lockedUntil, user.id]
            );

            db.run(
              'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, 0)',
              [email, ip, userAgent]
            );

            return res.status(401).json({
              error: 'Invalid credentials',
              message: 'Email or password is incorrect'
            });
          }

          db.run(
            'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
          );

          db.run(
            'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, 1)',
            [email, ip, userAgent]
          );

          // Generate JWT token
          const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
          );

          res.json({
            message: 'Login successful',
            user: {
              id: user.id,
              email: user.email,
              full_name: user.full_name
            },
            token
          });
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful',
    note: 'Please remove the token from client storage'
  });
});

router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router; 