const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let code = err.code || 'SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Sanitize internal database errors (like Mongoose/MongoDB) in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500 || err.name === 'MongoError' || err.name === 'ValidationError' || err.name === 'CastError') {
      code = 'DATABASE_ERROR';
      message = 'An internal system error occurred';
    }
  } else {
    // In development/test mode, expose more details but keep them structured
    if (err.name === 'ValidationError') {
      code = 'VALIDATION_ERROR';
      message = Object.values(err.errors).map(val => val.message).join(', ');
    } else if (err.name === 'CastError') {
      code = 'BAD_REQUEST';
      message = `Invalid format for field ${err.path}`;
    }
  }

  // Safe logging: Never log secrets, passwords, tokens, etc.
  // We log the request method, url, status code, and sanitized error code & message.
  console.error(`[ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode} - Code: ${code} - Msg: ${message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
};

module.exports = errorHandler;
