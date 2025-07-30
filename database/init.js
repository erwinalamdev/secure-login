const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database/users.db';

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          login_attempts INTEGER DEFAULT 0,
          locked_until DATETIME,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `, (err) => {
        if (err) {
          console.error('Error creating email index:', err);
          reject(err);
          return;
        }
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS login_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          ip_address TEXT NOT NULL,
          user_agent TEXT,
          success BOOLEAN DEFAULT 0,
          attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating login_attempts table:', err);
          reject(err);
          return;
        }
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_login_attempts_email_ip ON login_attempts(email, ip_address)
      `, (err) => {
        if (err) {
          console.error('Error creating login attempts index:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

function getDatabase() {
  return db;
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
}; 