const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to protect routes that require authentication.
 * It checks if a JSON Web Token (JWT) is present in the request's Authorization header
 * and validates it. If valid, the request continues; otherwise, it is blocked.
 */
const authenticateToken = (req, res, next) => {
  // Access headers and retrieve the Authorization token
  // It is usually structured as: "Bearer <token_value>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If no token is provided, respond with 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skillswap_secret_key_12345');
    
    // Attach the decoded token payload (e.g., { id: 1, email: "student@example.com" }) to the request.
    // This makes the logged-in user's ID accessible inside our route handlers via `req.user.id`.
    req.user = decoded;
    
    // Call next() to proceed to the actual route handler code
    next();
  } catch (error) {
    // If token verification fails (expired or tempered), respond with 403 Forbidden
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;
