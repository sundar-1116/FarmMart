const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const check = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmers_to_mart';
    await mongoose.connect(connStr);
    console.log('Connected to DB.');
    const users = await User.find({}, '+password');
    console.log('Users in Database:');
    users.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, PasswordHash: ${u.password}`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

check();
