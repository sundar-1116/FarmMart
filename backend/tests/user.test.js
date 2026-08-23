process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_long_enough_2026';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.PORT = '5002'; // use different port for tests
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/farmers_to_mart_user_test';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');

describe('FarmMart User & Role Management Tests', () => {
  let app;
  let mongoServer;
  let buyer1, farmer1, admin1, admin2;
  let buyerToken, farmerToken, admin1Token, admin2Token;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.MONGODB_URI = uri;

    app = require('../server');
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
    await User.deleteMany({});

    // Create Buyer
    buyer1 = await User.create({
      name: 'Test Buyer',
      email: 'buyer1@test.com',
      password: 'password123',
      role: 'buyer',
      status: 'active'
    });

    // Create Farmer
    farmer1 = await User.create({
      name: 'Test Farmer',
      email: 'farmer1@test.com',
      password: 'password123',
      role: 'farmer',
      status: 'active'
    });

    // Create Admin 1
    admin1 = await User.create({
      name: 'Admin One',
      email: 'admin1@test.com',
      password: 'password123',
      role: 'admin',
      status: 'active'
    });

    // Create Admin 2
    admin2 = await User.create({
      name: 'Admin Two',
      email: 'admin2@test.com',
      password: 'password123',
      role: 'admin',
      status: 'active'
    });

    // Generate JWT Tokens
    buyerToken = jwt.sign({ id: buyer1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    farmerToken = jwt.sign({ id: farmer1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    admin1Token = jwt.sign({ id: admin1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    admin2Token = jwt.sign({ id: admin2._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  // 1. Public signup cannot create admin
  test('Public signup cannot create admin', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Attacker Admin',
        email: 'attacker@example.com',
        password: 'password123',
        role: 'admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    // Verify user was not created
    const createdUser = await User.findOne({ email: 'attacker@example.com' });
    expect(createdUser).toBeNull();
  });

  // 2. Public signup as buyer creates buyer
  test('Public signup as buyer creates buyer', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'New Buyer',
        email: 'newbuyer@example.com',
        password: 'password123',
        role: 'buyer'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('buyer');

    const createdUser = await User.findOne({ email: 'newbuyer@example.com' });
    expect(createdUser).toBeDefined();
    expect(createdUser.role).toBe('buyer');
  });

  // 3. Public signup as farmer creates farmer
  test('Public signup as farmer creates farmer', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'New Farmer',
        email: 'newfarmer@example.com',
        password: 'password123',
        role: 'farmer'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('farmer');

    const createdUser = await User.findOne({ email: 'newfarmer@example.com' });
    expect(createdUser.role).toBe('farmer');
  });

  // 4. Unauthenticated GET /api/users returns 401
  test('Unauthenticated GET /api/users returns 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  // 5. Buyer GET /api/users returns 403
  test('Buyer GET /api/users returns 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(403);
  });

  // 6. Farmer GET /api/users returns 403
  test('Farmer GET /api/users returns 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(res.status).toBe(403);
  });

  // 7. Buyer cannot update user roles
  test('Buyer cannot update user roles', async () => {
    const res = await request(app)
      .put(`/api/users/${farmer1._id}/role`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });

  // 8. Farmer cannot update user roles
  test('Farmer cannot update user roles', async () => {
    const res = await request(app)
      .put(`/api/users/${buyer1._id}/role`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });

  // 9. Admin can retrieve all users
  test('Admin can retrieve all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(4);
    expect(res.body.data.length).toBe(4);
  });

  // 10. Admin can retrieve a single user
  test('Admin can retrieve a single user', async () => {
    const res = await request(app)
      .get(`/api/users/${buyer1._id}`)
      .set('Authorization', `Bearer ${admin1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Buyer');
  });

  // 11. Passwords are never returned
  test('User responses never contain passwords', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin1Token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(user => {
      expect(user.password).toBeUndefined();
      expect(user.passwordHash).toBeUndefined();
    });

    const resSingle = await request(app)
      .get(`/api/users/${buyer1._id}`)
      .set('Authorization', `Bearer ${admin1Token}`);

    expect(resSingle.body.data.password).toBeUndefined();
    expect(resSingle.body.data.passwordHash).toBeUndefined();
  });

  // 12. Tokens are never returned
  test('Tokens are never returned', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin1Token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(user => {
      expect(user.token).toBeUndefined();
      expect(user.refreshToken).toBeUndefined();
      expect(user.jwt).toBeUndefined();
    });
  });

  // 13. Buyer -> farmer promotion works
  test('Buyer -> farmer promotion works', async () => {
    const res = await request(app)
      .put(`/api/users/${buyer1._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'farmer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('farmer');

    const updatedUser = await User.findById(buyer1._id);
    expect(updatedUser.role).toBe('farmer');
  });

  // 14. Farmer -> buyer promotion works
  test('Farmer -> buyer promotion works', async () => {
    const res = await request(app)
      .put(`/api/users/${farmer1._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'buyer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('buyer');

    const updatedUser = await User.findById(farmer1._id);
    expect(updatedUser.role).toBe('buyer');
  });

  // 15. Buyer -> admin promotion works
  test('Buyer -> admin promotion works', async () => {
    const res = await request(app)
      .put(`/api/users/${buyer1._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('admin');

    const updatedUser = await User.findById(buyer1._id);
    expect(updatedUser.role).toBe('admin');
  });

  // 16. Farmer -> admin promotion works
  test('Farmer -> admin promotion works', async () => {
    const res = await request(app)
      .put(`/api/users/${farmer1._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('admin');

    const updatedUser = await User.findById(farmer1._id);
    expect(updatedUser.role).toBe('admin');
  });

  // 17. Admin -> buyer demotion works when another admin exists
  test('Admin -> buyer demotion works when another admin exists', async () => {
    const res = await request(app)
      .put(`/api/users/${admin2._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'buyer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('buyer');

    const updatedUser = await User.findById(admin2._id);
    expect(updatedUser.role).toBe('buyer');
  });

  // 18. Admin -> farmer demotion works when another admin exists
  test('Admin -> farmer demotion works when another admin exists', async () => {
    const res = await request(app)
      .put(`/api/users/${admin2._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'farmer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('farmer');

    const updatedUser = await User.findById(admin2._id);
    expect(updatedUser.role).toBe('farmer');
  });

  // 19. Final admin cannot be demoted
  test('Final admin cannot be demoted', async () => {
    // Delete Admin 2 first to leave only Admin 1
    await User.deleteOne({ _id: admin2._id });

    const res = await request(app)
      .put(`/api/users/${admin1._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'buyer' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Cannot remove the final administrator');

    const checkAdmin = await User.findById(admin1._id);
    expect(checkAdmin.role).toBe('admin');
  });

  // 20. Admin cannot change their own role
  test('Admin cannot change their own role (self-demotion protection)', async () => {
    const res = await request(app)
      .put(`/api/users/${admin1._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'buyer' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Self-demotion denied');

    const checkAdmin = await User.findById(admin1._id);
    expect(checkAdmin.role).toBe('admin');
  });

  // 21. Invalid role is rejected
  test('Invalid role is rejected', async () => {
    const res = await request(app)
      .put(`/api/users/${buyer1._id}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'superadmin' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid role');
  });

  // 22. Non-existent user returns 404
  test('Non-existent user returns 404', async () => {
    const randomId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/users/${randomId}/role`)
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'buyer' });

    expect(res.status).toBe(404);
  });

  // 23. Invalid ObjectId is handled cleanly
  test('Invalid ObjectId is handled cleanly', async () => {
    const res = await request(app)
      .put('/api/users/invalid-object-id/role')
      .set('Authorization', `Bearer ${admin1Token}`)
      .send({ role: 'buyer' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid user ID format');
  });
});
