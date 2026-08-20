const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[FATAL ERROR] MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);

  try {
    // We access the collection directly to bypass Mongoose's new schema validation during migration query
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Count legacy users (role: 'user')
    // We explicitly exclude admins or already-migrated roles
    const legacyCount = await usersCollection.countDocuments({ role: 'user' });
    console.log(`Auditing users. Found ${legacyCount} legacy users with role 'user'.`);

    if (legacyCount === 0) {
      console.log('No legacy users to migrate. Idempotent check passed.');
      process.exit(0);
    }

    // Find and list the ObjectIDs of these legacy users to create the audit trail
    const legacyUsers = await usersCollection.find({ role: 'user' }, { projection: { _id: 1 } }).toArray();
    const migratedIds = legacyUsers.map(u => u._id.toString());

    // Update their role to 'buyer'
    const result = await usersCollection.updateMany(
      { role: 'user' },
      { $set: { role: 'buyer' } }
    );

    console.log(`Successfully migrated ${result.modifiedCount} users from 'user' to 'buyer'.`);

    // Write audit trail log of migrated IDs
    const logPath = path.join(__dirname, 'migrated-users.json');
    fs.writeFileSync(logPath, JSON.stringify(migratedIds, null, 2));
    console.log(`Audit log written to: ${logPath}`);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

run();
