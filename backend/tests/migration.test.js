const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const exec = require('child_process').exec;

const User = require('../models/User');

describe('Database Migration and Rollback Integration Tests', () => {
  let mongoServer;
  let mongoUri;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }

    // Cleanup generated log files if they remain
    const logPath = path.join(__dirname, '../scripts/migrated-users.json');
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
  });

  test('Migration script updates role: user -> buyer, writes log; Rollback restores them', (done) => {
    // 1. Connect and seed mock users
    mongoose.connect(mongoUri).then(async () => {
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');

      await usersCollection.deleteMany({});

      // Seed direct documents to bypass role enums and seed raw legacy 'user'
      await usersCollection.insertMany([
        { name: 'Legacy User 1', email: 'legacy1@farmmart.com', role: 'user' },
        { name: 'Legacy User 2', email: 'legacy2@farmmart.com', role: 'user' },
        { name: 'Admin User', email: 'admin@farmmart.com', role: 'admin' },
        { name: 'New Buyer', email: 'buyer@farmmart.com', role: 'buyer' }
      ]);

      await mongoose.disconnect();

      // 2. Run migrate-roles.js pointing to the memory database
      const env = { ...process.env, MONGODB_URI: mongoUri };
      exec('node scripts/migrate-roles.js', { env, cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        expect(error).toBeNull();
        expect(stdout).toContain('Successfully migrated 2 users from \'user\' to \'buyer\'');

        // Verify audit log file exists and has correct length
        const logPath = path.join(__dirname, '../scripts/migrated-users.json');
        expect(fs.existsSync(logPath)).toBe(true);
        const migratedIds = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        expect(migratedIds.length).toBe(2);

        // Connect back to assert database updates
        mongoose.connect(mongoUri).then(async () => {
          const u1 = await User.findOne({ email: 'legacy1@farmmart.com' });
          expect(u1.role).toBe('buyer');

          const u2 = await User.findOne({ email: 'legacy2@farmmart.com' });
          expect(u2.role).toBe('buyer');

          const admin = await User.findOne({ email: 'admin@farmmart.com' });
          expect(admin.role).toBe('admin'); // Unchanged

          const newBuyer = await User.findOne({ email: 'buyer@farmmart.com' });
          expect(newBuyer.role).toBe('buyer'); // Unchanged

          await mongoose.disconnect();

          // 3. Run rollback-roles.js to undo migration
          exec('node scripts/rollback-roles.js', { env, cwd: path.join(__dirname, '..') }, (rbError, rbStdout, rbStderr) => {
            expect(rbError).toBeNull();
            expect(rbStdout).toContain('Successfully rolled back 2 users back to \'user\' role.');
            expect(fs.existsSync(logPath)).toBe(false); // Deleted on success

            // Connect back to assert database is restored
            mongoose.connect(mongoUri).then(async () => {
              const activeDb = mongoose.connection.db;
              const rU1 = await activeDb.collection('users').findOne({ email: 'legacy1@farmmart.com' });
              expect(rU1.role).toBe('user');

              const rU2 = await activeDb.collection('users').findOne({ email: 'legacy2@farmmart.com' });
              expect(rU2.role).toBe('user');

              const rAdmin = await activeDb.collection('users').findOne({ email: 'admin@farmmart.com' });
              expect(rAdmin.role).toBe('admin');

              const rNewBuyer = await activeDb.collection('users').findOne({ email: 'buyer@farmmart.com' });
              expect(rNewBuyer.role).toBe('buyer'); // Remains buyer (never rolled back!)

              done();
            }).catch(done);
          });
        }).catch(done);
      });
    }).catch(done);
  });
});
