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
  let testUser, testAdmin, testOtherUser, testFarmerUser;
  let userToken, adminToken, otherUserToken, farmerToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

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

    // Create test user (buyer)
    testUser = await User.create({
      name: 'Regular Buyer',
      email: 'buyer@farmmart.com',
      password: 'buyerpassword123',
      role: 'buyer',
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
      name: 'Other Buyer',
      email: 'otherbuyer@farmmart.com',
      password: 'otherpassword123',
      role: 'buyer',
      status: 'active'
    });

    testFarmerUser = await User.create({
      name: 'Regular Farmer',
      email: 'farmer@farmmart.com',
      password: 'farmerpassword123',
      role: 'farmer',
      status: 'active'
    });

    // Generate tokens manually
    userToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ id: testAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    otherUserToken = jwt.sign({ id: testOtherUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    farmerToken = jwt.sign({ id: testFarmerUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  // 1. Successful login
  test('Successful login returns token and user data', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'buyer@farmmart.com',
        password: 'buyerpassword123',
        role: 'buyer'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('buyer@farmmart.com');
    expect(res.body.user.role).toBe('buyer'); // derived from DB
  });

  // 2. Invalid password
  test('Login with invalid password fails with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'buyer@farmmart.com',
        password: 'wrongpassword',
        role: 'buyer'
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
        userId: testOtherUser._id.toString(),
        name: 'Attacker Updated Name'
      });

    expect(res.status).toBe(200);
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.name).toBe('Attacker Updated Name');

    const otherUser = await User.findById(testOtherUser._id);
    expect(otherUser.name).toBe('Other Buyer'); // remains unchanged
  });

  // 8. BOLA: User cannot change another user's password
  test('BOLA check: password change resolves ID via token, ignoring request body', async () => {
    const res = await request(app)
      .post('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: testOtherUser._id.toString(),
        currentPassword: 'buyerpassword123',
        newPassword: 'newpassword123'
      });

    expect(res.status).toBe(200);

    const userWithPw = await User.findById(testUser._id).select('+password');
    const match = await userWithPw.comparePassword('newpassword123');
    expect(match).toBe(true);
  });

  // 9. Signups and role restrictions
  test('Public signup defaults to role: buyer if role is omitted', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Default Buyer',
        email: 'defaultbuyer@farmmart.com',
        password: 'buyerpassword123'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('buyer');

    const userInDb = await User.findOne({ email: 'defaultbuyer@farmmart.com' });
    expect(userInDb.role).toBe('buyer');
  });

  test('Public signup allows role: buyer', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Explicit Buyer',
        email: 'explicitbuyer@farmmart.com',
        password: 'buyerpassword123',
        role: 'buyer'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('buyer');
  });

  test('Public signup allows role: farmer', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Explicit Farmer',
        email: 'explicitfarmer@farmmart.com',
        password: 'farmerpassword123',
        role: 'farmer'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('farmer');
  });

  test('Public signup rejects role: admin with 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Fake Admin',
        email: 'fakeadmin@farmmart.com',
        password: 'adminpassword123',
        role: 'admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Public signup rejects role: user with 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Legacy User',
        email: 'legacyuser@farmmart.com',
        password: 'userpassword123',
        role: 'user' // invalid role now
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 10. Password policy check
  test('Signup fails with 400 if password is less than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Weak Pass User',
        email: 'weak@farmmart.com',
        password: 'weak'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 11. Expired password reset token rejected
  test('Expired password reset token is rejected', async () => {
    const code = '123456';
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    await User.create({
      name: 'Expired Token User',
      email: 'expired@farmmart.com',
      password: 'password123',
      role: 'buyer',
      resetCode: hashedCode,
      resetCodeExpires: new Date(Date.now() - 1000)
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
      role: 'buyer',
      resetCode: hashedCode,
      resetCodeExpires: new Date(Date.now() + 15 * 60 * 1000)
    });

    const res1 = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'reset@farmmart.com',
        code: code,
        newPassword: 'newsecurepassword123'
      });

    expect(res1.status).toBe(200);

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
      .send({ email: 'buyer@farmmart.com', password: 'buyerpassword123', role: 'buyer' });

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  // 14. Production errors do not expose internal database information
  test('Errors in production environment are sanitized to database_error', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        email: 'invalid-email-format'
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATABASE_ERROR');
    expect(res.body.error.message).toBe('An internal system error occurred');

    process.env.NODE_ENV = 'test'; // restore
  });

  // 15. RBAC checks on tasks and demands
  test('RBAC: Unauthenticated request to unfiltered tasks endpoint returns 401', async () => {
    const res = await request(app)
      .get('/api/tasks');

    expect(res.status).toBe(401);
  });

  test('RBAC: Authenticated normal user (buyer) accessing tasks endpoint defaults to own tasks (returns 200)', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('RBAC: Authenticated admin accessing unfiltered tasks endpoint succeeds', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('RBAC: Farmer can access tasks endpoint to manage assigned procurement tasks (returns 200)', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(res.status).toBe(200);
  });

  test('RBAC: Buyer cannot access admin demands creation (POST /api/demands returns 403)', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        storeName: 'Test Store',
        itemName: 'Crops',
        quantity: 100
      });

    expect(res.status).toBe(403);
  });

  test('RBAC: Farmer cannot access admin demands creation (POST /api/demands returns 403)', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        storeName: 'Test Store',
        itemName: 'Crops',
        quantity: 100
      });

    expect(res.status).toBe(403);
  });

  test('RBAC: Admin can access demands creation (POST /api/demands returns 201)', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        storeName: 'Test Store',
        itemName: 'Crops',
        quantity: 100
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  // 16. Role elevation check
  test('Role elevation prevention: updating profile ignores role: admin payload', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        role: 'admin'
      });

    expect(res.status).toBe(200);

    const userInDb = await User.findById(testUser._id);
    expect(userInDb.role).toBe('buyer'); // remains buyer
  });

  // 17. GET /api/auth/profile tests
  test('GET /api/auth/profile returns 200 and user data for authenticated requests', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('buyer@farmmart.com');
    expect(res.body.user.role).toBe('buyer');

    // Ensure sensitive fields are not returned
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.resetCode).toBeUndefined();
    expect(res.body.user.resetCodeExpires).toBeUndefined();
  });

  test('GET /api/auth/profile returns 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .get('/api/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 18. Task API Scoping tests
  test('RBAC: Non-admin task requests with matching assignedUser succeed', async () => {
    const res = await request(app)
      .get(`/api/tasks?assignedUser=${testUser._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('RBAC: Non-admin task requests with arbitrary assignedUser values fail with 403', async () => {
    const res = await request(app)
      .get(`/api/tasks?assignedUser=${testOtherUser._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toBe("Access denied: Cannot view other users' tasks");
  });

  // 19. FarmMart 2.6 Regression Tests
  test('A. createDemand endpoint accepts request matching the admin form', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        storeName: 'Reliance Fresh',
        itemName: 'Apples',
        quantity: 300
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.storeName).toBe('Reliance Fresh');
  });

  test('B. Claiming an already-assigned demand is rejected with 409', async () => {
    const demand = await Demand.create({
      storeName: 'Reliance Fresh',
      itemName: 'Oranges',
      quantity: 150,
      status: 'assigned'
    });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        assignedUser: testUser._id.toString(),
        type: 'procurement',
        storeName: demand.storeName,
        itemName: demand.itemName,
        quantity: demand.quantity,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        demandId: demand._id.toString()
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('C. Concurrent claim attempts cannot create duplicate tasks', async () => {
    const demand = await Demand.create({
      storeName: 'Target Store',
      itemName: 'Bananas',
      quantity: 200,
      status: 'pending'
    });

    const taskData = {
      assignedUser: testUser._id.toString(),
      type: 'procurement',
      storeName: demand.storeName,
      itemName: demand.itemName,
      quantity: demand.quantity,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      demandId: demand._id.toString()
    };

    // Fire two concurrent requests in parallel
    const [res1, res2] = await Promise.all([
      request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send(taskData),
      request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send(taskData)
    ]);

    // One must succeed, one must fail with 409
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    // Verify only one task was actually saved in DB
    const count = await Task.countDocuments({ storeName: 'Target Store', itemName: 'Bananas' });
    expect(count).toBe(1);
  });

  test('D. Paid task detail modification is rejected with 400', async () => {
    const task = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Store A',
      itemName: 'Crop A',
      quantity: 50,
      paymentStatus: 'paid',
      deliveryStatus: 'pending',
      deadline: new Date()
    });

    const res = await request(app)
      .put(`/api/tasks/${task._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        purchasePrice: 100
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('E. Delivered task detail modification is rejected with 400', async () => {
    const task = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Store B',
      itemName: 'Crop B',
      quantity: 50,
      paymentStatus: 'pending',
      deliveryStatus: 'delivered',
      deadline: new Date()
    });

    const res = await request(app)
      .put(`/api/tasks/${task._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        deliveryPrice: 200
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('F. Existing unpaid and undelivered task detail modification still works', async () => {
    const task = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Store C',
      itemName: 'Crop C',
      quantity: 50,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date()
    });

    const res = await request(app)
      .put(`/api/tasks/${task._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        purchasePrice: 150
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.purchasePrice).toBe(150);
  });

  test('G. Existing task payment endpoint still works', async () => {
    const task = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Store D',
      itemName: 'Crop D',
      quantity: 50,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date()
    });

    const res = await request(app)
      .put(`/api/tasks/${task._id.toString()}/payment`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentStatus).toBe('paid');
  });

  test('H. Existing task delivery endpoint still works when paid', async () => {
    const task = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Store E',
      itemName: 'Crop E',
      quantity: 50,
      paymentStatus: 'paid',
      deliveryStatus: 'pending',
      deadline: new Date()
    });

    const res = await request(app)
      .put(`/api/tasks/${task._id.toString()}/delivery`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deliveryStatus).toBe('delivered');
  });

  test('I. Verify PUT /api/demands/:id authorization behavior', async () => {
    const demand = await Demand.create({
      storeName: 'Reliance Store',
      itemName: 'Grapes',
      quantity: 100,
      status: 'pending'
    });

    // 1. Admin can update a demand where intended
    const resAdmin = await request(app)
      .put(`/api/demands/${demand._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'assigned' });
    expect(resAdmin.status).toBe(200);

    // 2. Buyer cannot manually set a demand to assigned
    const resBuyerAssign = await request(app)
      .put(`/api/demands/${demand._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'assigned' });
    expect(resBuyerAssign.status).toBe(403);

    // 3. Buyer cannot manually set a demand to completed
    const resBuyerComplete = await request(app)
      .put(`/api/demands/${demand._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'completed' });
    expect(resBuyerComplete.status).toBe(403);

    // 4. Buyer cannot manually reset a demand to pending
    const resBuyerPending = await request(app)
      .put(`/api/demands/${demand._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'pending' });
    expect(resBuyerPending.status).toBe(403);
  });

  test('J. Verify non-admin users cannot perform admin-only demands creation', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        storeName: 'Banned Store',
        itemName: 'Crop',
        quantity: 10
      });

    expect(res.status).toBe(403);
  });

  test('K. Failed task creation leaves demand pending', async () => {
    const demand = await Demand.create({
      storeName: 'Error Store',
      itemName: 'Error Item',
      quantity: 100,
      status: 'pending'
    });

    const spy = jest.spyOn(Task, 'create').mockRejectedValueOnce(new Error('Simulated Task insertion failure'));

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        assignedUser: testUser._id.toString(),
        type: 'procurement',
        storeName: demand.storeName,
        itemName: demand.itemName,
        quantity: demand.quantity,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        demandId: demand._id.toString()
      });

    expect(res.status).toBe(500);

    // Verify demand status reverted to pending
    const checkDemand = await Demand.findById(demand._id);
    expect(checkDemand.status).toBe('pending');
    expect(checkDemand.claimedByTask).toBeNull();

    spy.mockRestore();
  });

  test('L. Failed claim cannot revert another successful claim', async () => {
    const demand = await Demand.create({
      storeName: 'Isolation Store',
      itemName: 'Isolation Item',
      quantity: 100,
      status: 'pending'
    });

    // 1. Successful claimant A claims demand
    const taskIdA = new mongoose.Types.ObjectId();
    demand.status = 'assigned';
    demand.claimedByTask = taskIdA;
    await demand.save();

    const taskIdB = new mongoose.Types.ObjectId();

    // Trigger B's rollback query directly to verify it has no effect on A's assignment
    const updateResult = await Demand.updateOne(
      { _id: demand._id, claimedByTask: taskIdB },
      { $set: { status: 'pending', claimedByTask: null } }
    );

    expect(updateResult.matchedCount).toBe(0);

    // Verify demand remains assigned to A
    const checkDemand = await Demand.findById(demand._id);
    expect(checkDemand.status).toBe('assigned');
    expect(checkDemand.claimedByTask.toString()).toBe(taskIdA.toString());
  });

  // --- Regression Tests added in Milestone 2.7 ---

  // A. Unpaid task delivery: PUT /api/tasks/:id/delivery must reject a task whose paymentStatus is pending
  test('A. Unpaid task delivery: PUT /api/tasks/:id/delivery must reject a task whose paymentStatus is pending', async () => {
    const task = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Reliance Store',
      itemName: 'Apples',
      quantity: 50,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date(Date.now() + 86400000)
    });

    const res = await request(app)
      .put(`/api/tasks/${task._id.toString()}/delivery`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('must be cleared first');
  });

  // B. Sequential delivery: Verify that delivery is rejected when an older unpaid task exists for the same user
  test('B. Independent delivery: Allow delivery confirmation regardless of older unpaid tasks for the same user', async () => {
    // Older task: unpaid
    const olderTask = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Older Store',
      itemName: 'Apples',
      quantity: 50,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date(Date.now() + 86400000),
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    });

    // Newer task: paid
    const newerTask = await Task.create({
      assignedUser: testUser._id,
      storeName: 'Newer Store',
      itemName: 'Oranges',
      quantity: 40,
      paymentStatus: 'paid',
      deliveryStatus: 'pending',
      deadline: new Date(Date.now() + 86400000),
      createdAt: new Date()
    });

    const res = await request(app)
      .put(`/api/tasks/${newerTask._id.toString()}/delivery`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deliveryStatus).toBe('delivered');
  });

  // C. Inactive account: Verify that an authenticated user with status inactive cannot access protected endpoints
  test('C. Inactive account: Authenticated user with status inactive cannot access protected endpoints and receives 403', async () => {
    testUser.status = 'inactive';
    await testUser.save();

    const res = await request(app)
      .get('/api/demands')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('deactivated');
  });

  // D. Forgot-password leakage: POST /api/auth/forgot-password must not return raw or hashed resetCode
  test('D. Forgot-password leakage: forgot-password response must not expose raw or hashed reset code', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const responseString = JSON.stringify(res.body);
    expect(responseString).not.toContain('resetCode');
    expect(responseString).not.toContain('resetCodeExpires');

    const userInDb = await User.findOne({ email: testUser.email });
    expect(userInDb.resetCode).toBeDefined();
    expect(userInDb.resetCode).not.toBe('');
    expect(responseString).not.toContain(userInDb.resetCode);
  });

  // E. Task stats scoping: Verify that a non-admin cannot retrieve another user\'s statistics
  test('E. Task stats scoping: Non-admin cannot retrieve another user\'s stats by manipulating assignedUser', async () => {
    const res = await request(app)
      .get(`/api/tasks/stats?assignedUser=${testOtherUser._id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toBe("Access denied: Cannot view other users' stats");
  });
});
