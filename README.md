# Secure Login System

## Features

### Security Features
- **JWT Authentication** - Secure token-based authentication with automatic refresh
- **Password Security** - BCrypt hashing with 12 salt rounds
- **Rate Limiting** - Protection against brute force attacks
- **Account Lockout** - Automatic lockout after 5 failed attempts
- **Login Monitoring** - Track login attempts and user activity
- **Input Validation** - Comprehensive validation and sanitization
- **CORS Protection** - Secure cross-origin resource sharing
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Input sanitization and output encoding

### User Features
- **User Registration** - Secure account creation with strong password requirements
- **User Login** - Secure authentication with remember me functionality
- **Profile Management** - Update profile information and change password
- **Dashboard** - User statistics and login history
- **Account Deletion** - Secure account deactivation

### Technical Features
- **High Performance** - Optimized database queries and caching
- **Responsive Design** - Modern UI built with Tailwind CSS
- **TypeScript Support** - Full type safety (frontend)
- **Comprehensive Logging** - Detailed error and security event logging
- **Error Handling** - Graceful error handling and user feedback

## Tech Stack

### Backend
- **Express.js** - Web framework
- **SQLite3** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### Frontend
- **Next.js** - React framework
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **js-cookie** - Cookie management

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/erwinalamdev/secure-login.git
   cd secure-login
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   DB_PATH=./database/users.db
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/verify` - Verify JWT token

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/profile` - Delete user account
- `GET /api/user/login-history` - Get login history
- `GET /api/user/stats` - Get user statistics

### Health Check
- `GET /api/health` - Server health status

## Security Implementation

### Password Security
- **BCrypt Hashing**: Passwords are hashed using BCrypt with 12 salt rounds
- **Strong Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **No Plain Text Storage**: Passwords are never stored in plain text

### JWT Authentication
- **Secure Tokens**: JWT tokens with expiration (24 hours default)
- **Token Refresh**: Automatic token refresh mechanism
- **Token Verification**: Server-side token validation on each request

### Rate Limiting
- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Login Rate Limit**: 5 failed attempts per 15 minutes per email/IP
- **Speed Limiting**: Progressive delays after 50 requests

### Input Validation
- **Email Validation**: Proper email format validation
- **Password Validation**: Strong password requirements
- **Input Sanitization**: XSS prevention through input sanitization
- **SQL Injection Prevention**: Parameterized queries

### Account Protection
- **Account Lockout**: Automatic lockout after 5 failed login attempts
- **Login Monitoring**: Track all login attempts with IP and user agent
- **Session Management**: Secure session handling with JWT

## Database Schema

### Users Table
```sql
CREATE TABLE users (
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
);
```

### Login Attempts Table
```sql
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  success BOOLEAN DEFAULT 0,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Author

**Erwin Alam Syah Putra**
- Full Stack Web Developer
- Website: [erwinalam.dev](https://erwinalam.dev)