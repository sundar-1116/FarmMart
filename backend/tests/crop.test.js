process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_long_enough_2026_crop';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.PORT = '5002'; // use a different port for crop tests

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const Crop = require('../models/Crop');
const Demand = require('../models/Demand');
const Task = require('../models/Task');

describe('FarmMart Backend Crop Inventory & API Integration Tests', () => {
  let app;
  let mongoServer;
  let farmerA, farmerB, buyerUser, adminUser, nonFarmerUser;
  let farmerAToken, farmerBToken, buyerToken, adminToken, nonFarmerToken;

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
    await Crop.deleteMany({});
    await Demand.deleteMany({});
    await Task.deleteMany({});

    // Create Farmer A
    farmerA = await User.create({
      name: 'Farmer A',
      email: 'farmerA@farmmart.com',
      password: 'farmerpassword123',
      role: 'farmer',
      status: 'active'
    });

    // Create Farmer B
    farmerB = await User.create({
      name: 'Farmer B',
      email: 'farmerB@farmmart.com',
      password: 'farmerpassword123',
      role: 'farmer',
      status: 'active'
    });

    // Create Buyer
    buyerUser = await User.create({
      name: 'Regular Buyer',
      email: 'buyer@farmmart.com',
      password: 'buyerpassword123',
      role: 'buyer',
      status: 'active'
    });

    // Create Admin
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@farmmart.com',
      password: 'adminpassword123',
      role: 'admin',
      status: 'active'
    });

    // Create Non-farmer user (e.g. buyer role acting as a general non-farmer user for test 18)
    nonFarmerUser = await User.create({
      name: 'Non Farmer User',
      email: 'nonfarmer@farmmart.com',
      password: 'buyerpassword123',
      role: 'buyer',
      status: 'active'
    });

    farmerAToken = jwt.sign({ id: farmerA._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    farmerBToken = jwt.sign({ id: farmerB._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    buyerToken = jwt.sign({ id: buyerUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    nonFarmerToken = jwt.sign({ id: nonFarmerUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  // 1. Farmer can create a valid crop.
  test('1. Farmer can create a valid crop', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: 100,
        availableQuantity: 100,
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Organic Tomatoes');
    expect(res.body.data.farmer.toString()).toBe(farmerA._id.toString());
  });

  // 2. Missing required fields are rejected.
  test('2. Missing required fields are rejected', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        category: 'vegetables',
        quantity: 100
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 3. Invalid category is rejected.
  test('3. Invalid category is rejected', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        name: 'Organic Tomatoes',
        category: 'meat', // invalid category
        quantity: 100,
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 4. Negative quantity is rejected.
  test('4. Negative quantity is rejected', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: -10, // negative quantity
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 5. availableQuantity greater than quantity is rejected.
  test('5. availableQuantity greater than quantity is rejected', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: 100,
        availableQuantity: 120, // greater than quantity
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 6. Negative price is rejected.
  test('6. Negative price is rejected', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: 100,
        unit: 'kg',
        price: -5, // negative price
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 7. Farmer cannot create a crop belonging to another farmer.
  test('7. Farmer cannot create a crop belonging to another farmer', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        farmer: farmerB._id, // trying to assign to Farmer B
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: 100,
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    // Should reject with 403 Forbidden
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 8. Farmer can modify their own crop.
  test('8. Farmer can modify their own crop', async () => {
    const crop = await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .put(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        price: 35
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(35);
  });

  // 9. Farmer cannot modify another farmer's crop.
  test('9. Farmer cannot modify another farmer\'s crop', async () => {
    const crop = await Crop.create({
      farmer: farmerB._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .put(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${farmerAToken}`) // Farmer A attempting to edit Farmer B's crop
      .send({
        price: 35
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 10. Farmer can delete their own crop.
  test('10. Farmer can delete their own crop', async () => {
    const crop = await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .delete(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${farmerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkedCrop = await Crop.findById(crop._id);
    expect(checkedCrop).toBeNull();
  });

  // 11. Farmer cannot delete another farmer's crop.
  test('11. Farmer cannot delete another farmer\'s crop', async () => {
    const crop = await Crop.create({
      farmer: farmerB._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .delete(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${farmerAToken}`); // Farmer A trying to delete Farmer B's crop

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    const checkedCrop = await Crop.findById(crop._id);
    expect(checkedCrop).not.toBeNull();
  });

  // 12. Buyer can view crop inventory.
  test('12. Buyer can view crop inventory', async () => {
    await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .get('/api/crops')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    // 20. API Response Privacy Check
    expect(res.body.data[0].farmer.name).toBe('Farmer A');
    expect(res.body.data[0].farmer.email).toBeUndefined(); // Should not expose email
    expect(res.body.data[0].farmer.password).toBeUndefined(); // Should not expose password
  });

  // 13. Buyer cannot create crops.
  test('13. Buyer cannot create crops', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: 100,
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(403);
  });

  // 14. Buyer cannot update crops.
  test('14. Buyer cannot update crops', async () => {
    const crop = await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .put(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        price: 35
      });

    expect(res.status).toBe(403);
  });

  // 15. Buyer cannot delete crops.
  test('15. Buyer cannot delete crops', async () => {
    const crop = await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .delete(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(403);
  });

  // 16. Admin can view crops.
  test('16. Admin can view crops', async () => {
    await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .get('/api/crops')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  // 17. Admin can create a crop for a valid farmer.
  test('17. Admin can create a crop for a valid farmer', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        farmer: farmerA._id, // specifies valid farmer A
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: 100,
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.farmer.toString()).toBe(farmerA._id.toString());
  });

  // 18. Admin cannot create a crop for a non-farmer user.
  test('18. Admin cannot create a crop for a non-farmer user', async () => {
    const res = await request(app)
      .post('/api/crops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        farmer: nonFarmerUser._id, // specifies buyer/non-farmer user
        name: 'Organic Tomatoes',
        category: 'vegetables',
        quantity: 100,
        unit: 'kg',
        price: 30,
        location: 'Warangal, TS'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 19. Admin can update any crop.
  test('19. Admin can update any crop', async () => {
    const crop = await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .put(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 45
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(45);
  });

  // 20. Admin can delete any crop.
  test('20. Admin can delete any crop', async () => {
    const crop = await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .delete(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkedCrop = await Crop.findById(crop._id);
    expect(checkedCrop).toBeNull();
  });

  // 21. Unauthenticated users cannot access protected crop endpoints.
  test('21. Unauthenticated users cannot access protected crop endpoints', async () => {
    const res = await request(app).get('/api/crops');
    expect(res.status).toBe(401);
  });

  // 22. GET /api/crops returns crops.
  test('22. GET /api/crops returns crops', async () => {
    await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .get('/api/crops')
      .set('Authorization', `Bearer ${farmerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  // 23. GET /api/crops/:id returns a crop.
  test('23. GET /api/crops/:id returns a crop', async () => {
    const crop = await Crop.create({
      farmer: farmerA._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 100,
      availableQuantity: 100,
      unit: 'kg',
      price: 30,
      location: 'Warangal, TS'
    });

    const res = await request(app)
      .get(`/api/crops/${crop._id}`)
      .set('Authorization', `Bearer ${farmerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(crop._id.toString());
  });

  // 24. Invalid crop IDs are handled correctly.
  test('24. Invalid crop IDs are handled correctly', async () => {
    const res = await request(app)
      .get('/api/crops/invalid-id-format-123')
      .set('Authorization', `Bearer ${farmerAToken}`);

    expect(res.status).toBe(500); // errorHandler maps CastError to 500/BAD_REQUEST depending on environment. In test/dev it gives 500 with BAD_REQUEST code. Let's inspect errorHandler logic: CastError maps to 500 BAD_REQUEST in test.
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  // 25. Non-existent crop IDs are handled correctly.
  test('25. Non-existent crop IDs are handled correctly', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/crops/${nonExistentId}`)
      .set('Authorization', `Bearer ${farmerAToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // 26. Existing Demand functionality still passes.
  test('26. Existing Demand functionality still passes', async () => {
    // Admins can create demands
    const res = await request(app)
      .post('/api/demands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        storeName: 'Reliance Fresh',
        itemName: 'Red Apples',
        quantity: 50
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.itemName).toBe('Red Apples');
  });

  // 27. Existing Task functionality still passes.
  test('27. Existing Task functionality still passes', async () => {
    // Normal users can view their own tasks or create self-assigned tasks
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        assignedUser: buyerUser._id,
        type: 'procurement',
        storeName: 'Reliance Fresh',
        itemName: 'Red Apples',
        quantity: 50,
        deadline: new Date(Date.now() + 86400000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.itemName).toBe('Red Apples');
  });
});
