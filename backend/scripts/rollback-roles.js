const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  // 0. Safety verification: Ensure the running codebase supports the 'user' role.
  // This prevents leaving the database in an incompatible state relative to the current application.
  const allowedRoles = User.schema.path('role').enumValues;
  if (!allowedRoles.includes('user') && process.env.NODE_ENV !== 'test') {
    console.error('[FATAL ERROR] The current application schema does not support the legacy "user" role.');
    console.error('To rollback roles in the database, you must first checkout/revert the codebase to the legacy state (where "user" is in the enum).');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[FATAL ERROR] MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  const logPath = path.join(__dirname, 'migrated-users.json');
  if (!fs.existsSync(logPath)) {
    console.log('No migration log file found at: ', logPath);
    console.log('Nothing to rollback.');
    process.exit(0);
  }

  const migratedIds = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  if (!Array.isArray(migratedIds) || migratedIds.length === 0) {
    console.log('Migration log is empty. Nothing to rollback.');
    process.exit(0);
  }

  console.log(`Found ${migratedIds.length} users to rollback in audit trail.`);
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);

  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const objectIds = migratedIds.map(id => new mongoose.Types.ObjectId(id));

    // Revert role to 'user' strictly for the audited ObjectIDs
    const result = await usersCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: { role: 'user' } }
    );

    console.log(`Successfully rolled back ${result.modifiedCount} users back to 'user' role.`);

    // Delete audit log file upon successful rollback
    fs.unlinkSync(logPath);
    console.log('Audit trail log file deleted.');

  } catch (err) {
    console.error('Rollback failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

run();
