const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config()

const dbPath = path.resolve(__dirname, 'users.db')
const db = new Database(dbPath)

// Initialize users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h'

/**
 * Register a new user
 * @param {string} username 
 * @param {string} password 
 * @returns {object} The created user object
 */
const register = (username, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10)
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
  try {
    const info = stmt.run(username, hashedPassword)
    return { id: info.lastInsertRowid, username }
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username already exists')
    }
    throw err
  }
}

/**
 * Login a user and return a JWT
 * @param {string} username 
 * @param {string} password 
 * @returns {object} { token, user }
 */
const login = (username, password) => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
  const user = stmt.get(username)
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error('Invalid username or password')
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRATION })
  return { token, user: { id: user.id, username: user.username } }
}

/**
 * Middleware to authenticate requests via JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' })
  }
}

/**
 * Refresh a JWT — issues a new token with a fresh expiration
 * @param {string} token - The current (still-valid) JWT
 * @returns {object} { token }
 */
const refreshToken = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET)
  const { iat, exp, ...payload } = decoded
  const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION })
  return { token: newToken }
}

module.exports = {
  register,
  login,
  authenticateToken,
  refreshToken
}
