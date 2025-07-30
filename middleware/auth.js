const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          message: 'Your session has expired. Please login again.'
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token',
          message: 'The provided token is invalid.'
        });
      }
      return res.status(403).json({ 
        error: 'Token verification failed',
        message: 'Unable to verify your authentication token.'
      });
    }

    const db = getDatabase();
    db.get(
      'SELECT id, email, full_name, is_active FROM users WHERE id = ? AND is_active = 1',
      [user.id],
      (err, row) => {
        if (err) {
          console.error('Database error during token verification:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
          return res.status(401).json({ 
            error: 'User not found',
            message: 'User account no longer exists or has been deactivated.'
          });
        }

        req.user = {
          id: row.id,
          email: row.email,
          full_name: row.full_name
        };
        next();
      }
    );
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    

    
    next();
  };
};


const loginRateLimit = (req, res, next) => {
  const { email } = req.body;
  const ip = req.ip;
  
  if (!email) {
    return next();
  }

  const db = getDatabase();
  
  db.get(
    `SELECT COUNT(*) as count FROM login_attempts 
      WHERE email = ? AND ip_address = ? AND success = 0 
      AND attempted_at > datetime('now', '-15 minutes')`,
    [email, ip],
    (err, row) => {
      if (err) {
        console.error('Rate limit check error:', err);
        return next();
      }
      
      if (row.count >= 5) {
        return res.status(429).json({
          error: 'Too many login attempts',
          message: 'Please wait 15 minutes before trying again.',
          retryAfter: 900
        });
      }
      
      next();
    }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  loginRateLimit
}; 