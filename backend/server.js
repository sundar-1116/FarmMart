const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Environment Validation
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  console.error('[FATAL ERROR] Environment variable MONGODB_URI (or MONGO_URI) is not defined.');
  process.exit(1);
}

const requiredEnv = ['JWT_SECRET', 'CLIENT_URL'];
requiredEnv.forEach(variable => {
  if (!process.env[variable]) {
    console.error(`[FATAL ERROR] Environment variable ${variable} is missing.`);
    process.exit(1);
  }
});

// Initialize express app
const app = express();

// Connect to Database
connectDB();

// CORS configuration matching process.env.CLIENT_URL
const corsOptions = {
  origin: (origin, callback) => {
    // In development mode, allow requests with no origin (e.g. curl) or local file systems
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    if (origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};
app.use(cors(corsOptions));

// Lower request size limit to a reasonable default (2mb)
app.use(express.json({ limit: '2mb' }));

// Seed admin account on startup (skip in test environment to avoid database seed race conditions)
if (process.env.NODE_ENV !== 'test') {
  seedAdmin();
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/demands', require('./routes/demands'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/users', require('./routes/users'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: "Farmers To Mart API is running..." });
});

// Centralized error handling middleware (must be registered after all routes)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
