const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return next(error);
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const error = new Error('JWT Secret Configuration is missing');
      error.statusCode = 500;
      error.code = 'SERVER_ERROR';
      return next(error);
    }

    const decoded = jwt.verify(token, secret);

    // Load the user from the database - this is the source of truth
    const user = await User.findById(decoded.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    if (user.status === 'inactive') {
      const error = new Error('Account is deactivated. Contact admin.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return next(error);
  }
};

module.exports = authMiddleware;
