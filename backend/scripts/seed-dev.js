const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY ERROR] Cannot run development seeding script in production environment.');
      process.exit(1);
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmers_to_mart';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);

    // 1. TEST-ADMIN
    const adminEmail = 'test@admin.com';
    const adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      adminUser.role = 'admin';
      adminUser.password = 'adminpassword123';
      await adminUser.save();
      console.log(`Updated existing user ${adminEmail} to admin with standard password`);
    } else {
      await User.create({
        name: 'TEST - ADMIN',
        email: adminEmail,
        password: 'adminpassword123',
        role: 'admin',
        phone: '1111111111',
        gender: 'Other',
        age: 30,
        photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`,
        online: false
      });
      console.log(`Seeded default TEST-ADMIN: ${adminEmail}`);
    }

    // 2. TEST-BUYER
    const buyerEmail = 'test@buyer.com';
    const buyerUser = await User.findOne({ email: buyerEmail });
    if (buyerUser) {
      buyerUser.role = 'buyer';
      buyerUser.password = 'buyerpassword123';
      await buyerUser.save();
      console.log(`Updated existing user ${buyerEmail} to buyer with standard password`);
    } else {
      await User.create({
        name: 'TEST-BUYER',
        email: buyerEmail,
        password: 'buyerpassword123',
        role: 'buyer',
        phone: '2222222222',
        gender: 'Other',
        age: 28,
        photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`,
        online: false
      });
      console.log(`Seeded default TEST-BUYER: ${buyerEmail}`);
    }

    // 3. TEST-FARMER
    const farmerEmail = 'test@farmer.com';
    const farmerUser = await User.findOne({ email: farmerEmail });
    if (farmerUser) {
      farmerUser.role = 'farmer';
      farmerUser.password = 'farmerpassword123';
      await farmerUser.save();
      console.log(`Updated existing user ${farmerEmail} to farmer with standard password`);
    } else {
      await User.create({
        name: 'TEST-FARMER',
        email: farmerEmail,
        password: 'farmerpassword123',
        role: 'farmer',
        phone: '3333333333',
        gender: 'Other',
        age: 35,
        photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`,
        online: false
      });
      console.log(`Seeded default TEST-FARMER: ${farmerEmail}`);
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

run();
