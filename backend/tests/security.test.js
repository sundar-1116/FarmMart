// Set test environment variables before requiring server/app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_long_enough_2026';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.PORT = '5001'; // use different port for tests
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/farmers_to_mart_test';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const Task = require('../models/Task');
const Demand = require('../models/Demand');

describe('FarmMart Backend Security Hardening Tests', () => {
  let app;
  let mongoServer;
  let dbConnection;
  let testUser, testAdmin, testOtherUser;
  let userToken, adminToken, otherUserToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.MONGODB_URI = uri;

    // Require server after setting environment variables
    app = require('../server');
    dbConnection = mongoose.connection;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear users, tasks, and demands
    await User.deleteMany({});
    await Task.deleteMany({});
    await Demand.deleteMany({});

    // Create test user (min password length is 8)
    testUser = await User.create({
      name: 'Regular User',
      email: 'user@farmmart.com',
      password: 'userpassword123',
      role: 'user',
      status: 'active'
    });

    testAdmin = await User.create({
      name: 'Admin User',
      email: 'admin@farmmart.com',
      password: 'adminpassword123',
      role: 'admin',
      status: 'active'
    });

    testOtherUser = await User.create({
      name: 'Other User',
      email: 'other@farmmart.com',
      password: 'otherpassword123',
      role: 'user',
      status: 'active'
    });

    // Generate tokens manually
    userToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ id: testAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    otherUserToken = jwt.sign({ id: testOtherUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  // 1. Successful login
  test('Successful login returns token and user data', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@farmmart.com',
        password: 'userpassword123',
        role: 'user'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('user@farmmart.com');
  });

  // 2. Invalid password
  test('Login with invalid password fails with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@farmmart.com',
        password: 'wrongpassword',
        role: 'user'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 3. Missing JWT rejected by protected endpoint
  test('Protected endpoint rejects request without Authorization header with 401', async () => {
    const res = await request(app)
      .get('/api/demands');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // 4. Invalid JWT rejected
  test('Protected endpoint rejects invalid JWT with 401', async () => {
    const res = await request(app)
      .get('/api/demands')
      .set('Authorization', 'Bearer invalidtokenhere');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 5. Expired JWT rejected
  test('Protected endpoint rejects expired JWT with 401', async () => {
    const expiredToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/demands')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 6. Valid JWT accepted
  test('Protected endpoint accepts valid JWT with 200', async () => {
    const res = await request(app)
      .get('/api/demands')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 7. BOLA: User cannot update another user's profile
  test('BOLA check: profile update resolves ID via token, ignoring request body', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: testOtherUser._id.toString(), // Attacker tries to target other user
        name: 'Attacker Updated Name'
      });

    expect(res.status).toBe(200);
    // Profile updated should be for testUser, not testOtherUser
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.name).toBe('Attacker Updated Name');

    const otherUser = await User.findById(testOtherUser._id);
    expect(otherUser.name).toBe('Other User'); // remains unchanged
  });

  // 8. BOLA: User cannot change another user's password
  test('BOLA check: password change resolves ID via token, ignoring request body', async () => {
    const res = await request(app)
      .post('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: testOtherUser._id.toString(), // Attacker targets other user
        currentPassword: 'userpassword123',
        newPassword: 'newpassword123'
      });

    // It will change the password of testUser, not testOtherUser
    expect(res.status).toBe(200);

    const userWithPw = await User.findById(testUser._id).select('+password');
    const match = await userWithPw.comparePassword('newpassword123');
    expect(match).toBe(true);
  });

  // 9. Role hijacking prevention: Public signup cannot create admin
  test('Public signup forces role to user, ignoring role: admin payload', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Malicious Admin',
        email: 'attacker@farmmart.com',
        password: 'attackpassword123',
        role: 'admin' // Attempting to sign up as admin
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user'); // Forced to user

    const userInDb = await User.findOne({ email: 'attacker@farmmart.com' });
    expect(userInDb.role).toBe('user');
  });

  // 10. Password policy check
  test('Signup fails with 400 if password is less than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Weak Pass User',
        email: 'weak@farmmart.com',
        password: 'weak' // only 4 chars
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 11. Expired password reset token rejected
  test('Expired password reset token is rejected', async () => {
    const code = '123456';
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Create user with expired reset code
    const expiredUser = await User.create({
      name: 'Expired Token User',
      email: 'expired@farmmart.com',
      password: 'password123',
      resetCode: hashedCode,
      resetCodeExpires: new Date(Date.now() - 1000) // expired 1s ago
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'expired@farmmart.com',
        code: code,
        newPassword: 'newsecurepassword123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 12. Password reset token cannot be reused
  test('Password reset token is invalidated after successful use', async () => {
    const code = '123456';
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    await User.create({
      name: 'Reset User',
      email: 'reset@farmmart.com',
      password: 'password123',
      resetCode: hashedCode,
      resetCodeExpires: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    });

    // 1st reset (should succeed)
    const res1 = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'reset@farmmart.com',
        code: code,
        newPassword: 'newsecurepassword123'
      });

    expect(res1.status).toBe(200);

    // 2nd reset with same code (should fail)
    const res2 = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'reset@farmmart.com',
        code: code,
        newPassword: 'anotherpassword123'
      });

    expect(res2.status).toBe(400);
  });

  // 13. Sensitive endpoints are rate limited
  test('Rate limiting headers are returned on auth routes', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@farmmart.com', password: 'userpassword123', role: 'user' });

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  // 14. Production errors do not expose internal database information
  test('Errors in production environment are sanitized to database_error', async () => {
    process.env.NODE_ENV = 'production';

    // Trigger a database validation error by trying to update user with invalid fields
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        email: 'invalid-email-format' // invalid format triggers database error
      });

    expect(res.status).toBe(500); // MongoDB validation errors bubble up as 500
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATABASE_ERROR');
    expect(res.body.error.message).toBe('An internal system error occurred');

    process.env.NODE_ENV = 'test'; // restore
  });

  // 15. RBAC checks on administrator-level operations
  test('RBAC: Unauthenticated request to unfiltered tasks endpoint returns 401', async () => {
    const res = await request(app)
      .get('/api/tasks'); // unfiltered request

    expect(res.status).toBe(401);
  });

  test('RBAC: Authenticated normal user accessing unfiltered tasks endpoint returns 403', async () => {
    const res = await request(app)
      .get('/api/tasks') // unfiltered request
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('RBAC: Authenticated admin accessing unfiltered tasks endpoint succeeds', async () => {
    const res = await request(app)
      .get('/api/tasks') // unfiltered request
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 16. Role elevation check
  test('Role elevation prevention: updating profile ignores role: admin payload', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        role: 'admin' // Attempt to elevate role to admin
      });

    expect(res.status).toBe(200);

    const userInDb = await User.findById(testUser._id);
    expect(userInDb.role).toBe('user'); // Remains user
  });
});
