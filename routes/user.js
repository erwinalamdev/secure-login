const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateProfileUpdate, 
  sanitizeInput, 
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.get(
    'SELECT id, email, full_name, created_at, last_login FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error('Database error fetching profile:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Profile retrieved successfully',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    }
  );
});

// Update user profile
router.put('/profile', 
  authenticateToken,
  sanitizeInput,
  validateProfileUpdate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { full_name, current_password, new_password } = req.body;
      const db = getDatabase();

      db.get(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.id],
        async (err, user) => {
          if (err) {
            console.error('Database error fetching user:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          if (new_password) {
            if (!current_password) {
              return res.status(400).json({
                error: 'Current password required',
                message: 'Current password is required to change password'
              });
            }

            const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
            if (!isValidPassword) {
              return res.status(401).json({
                error: 'Invalid current password',
                message: 'Current password is incorrect'
              });
            }
          }

          let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
          let params = [];

          if (full_name) {
            updateQuery += ', full_name = ?';
            params.push(full_name);
          }

          if (new_password) {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(new_password, saltRounds);
            updateQuery += ', password_hash = ?';
            params.push(passwordHash);
          }

          updateQuery += ' WHERE id = ?';
          params.push(req.user.id);

          db.run(updateQuery, params, function(err) {
            if (err) {
              console.error('Database error updating profile:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: 'User not found' });
            }

            res.json({
              message: 'Profile updated successfully',
              updated: {
                full_name: full_name || undefined,
                password: new_password ? 'changed' : undefined
              }
            });
          });
        }
      );
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete user account
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();

    db.run(
      'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.user.id],
      function(err) {
        if (err) {
          console.error('Database error deactivating user:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({
          message: 'Account deactivated successfully',
          note: 'Your account has been deactivated. Contact support to reactivate.'
        });
      }
    );
  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.get(
    `SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
      COUNT(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 END) as recent_logins
     FROM users`,
    (err, stats) => {
      if (err) {
        console.error('Database error fetching stats:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({
        message: 'Statistics retrieved successfully',
        stats: {
          total_users: stats.total_users,
          active_users: stats.active_users,
          recent_logins: stats.recent_logins
        }
      });
    }
  );
});

// Get login history
router.get('/login-history', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.all(
    `SELECT ip_address, user_agent, success, attempted_at 
     FROM login_attempts 
     WHERE email = ? 
     ORDER BY attempted_at DESC 
     LIMIT 20`,
    [req.user.email],
    (err, attempts) => {
      if (err) {
        console.error('Database error fetching login history:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({
        message: 'Login history retrieved successfully',
        login_history: attempts.map(attempt => ({
          ip_address: attempt.ip_address,
          user_agent: attempt.user_agent,
          success: attempt.success === 1,
          attempted_at: attempt.attempted_at
        }))
      });
    }
  );
});

module.exports = router; 