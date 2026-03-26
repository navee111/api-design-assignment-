const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Create a signed JWT for a user id.
 *
 * @param {string|number} userId - Unique user identifier to embed in the token.
 * @returns {string} Signed JWT token.
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT.
 *
 * @param {string} token - JWT token string.
 * @returns {{ userId: string|number, iat: number, exp: number }|null} Decoded payload or null when invalid.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash a plaintext password.
 *
 * @param {string} password - Raw password value.
 * @returns {Promise<string>} Hashed password.
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plaintext password against a stored hash.
 *
 * @param {string} password - Raw password value.
 * @param {string} hashedPassword - Previously hashed password.
 * @returns {Promise<boolean>} True when passwords match.
 */
async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Extract user id from an Authorization header in GraphQL context.
 *
 * @param {{ req?: { headers?: { authorization?: string } } }} context - Resolver context object.
 * @returns {string|number|null} User id when token is valid; otherwise null.
 */
function getUserFromContext(context) {
  const authHeader = context.req?.headers?.authorization || '';
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  return decoded ? decoded.userId : null;
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getUserFromContext,
};
