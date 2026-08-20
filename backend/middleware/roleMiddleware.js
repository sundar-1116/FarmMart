const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Access denied: Insufficient permissions');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    next();
  };
};

module.exports = { requireRole };
