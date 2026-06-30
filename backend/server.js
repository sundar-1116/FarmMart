const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// Seed admin account on startup
seedAdmin();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/demands', require('./routes/demands'));
app.use('/api/tasks', require('./routes/tasks'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: "Farmers To Mart API is running..." });
});

// Start Server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
