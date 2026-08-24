process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_long_enough_2026';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.PORT = '5002'; // different port for offers tests

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const Task = require('../models/Task');
const Demand = require('../models/Demand');
const Crop = require('../models/Crop');
const Offer = require('../models/Offer');

describe('FarmMart Backend Offer & Negotiation Workflow Tests', () => {
  let app;
  let mongoServer;
  let buyer1, buyer2, farmer1, farmer2, admin;
  let buyer1Token, buyer2Token, farmer1Token, farmer2Token, adminToken;
  let demand1, crop1, crop2;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

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
    await Task.deleteMany({});
    await Demand.deleteMany({});
    await Crop.deleteMany({});
    await Offer.deleteMany({});

    // Create users
    buyer1 = await User.create({
      name: 'Buyer One',
      email: 'buyer1@farmmart.com',
      password: 'buyerpassword123',
      role: 'buyer',
      status: 'active'
    });

    buyer2 = await User.create({
      name: 'Buyer Two',
      email: 'buyer2@farmmart.com',
      password: 'buyerpassword123',
      role: 'buyer',
      status: 'active'
    });

    farmer1 = await User.create({
      name: 'Farmer One',
      email: 'farmer1@farmmart.com',
      password: 'farmerpassword123',
      role: 'farmer',
      status: 'active'
    });

    farmer2 = await User.create({
      name: 'Farmer Two',
      email: 'farmer2@farmmart.com',
      password: 'farmerpassword123',
      role: 'farmer',
      status: 'active'
    });

    admin = await User.create({
      name: 'Admin User',
      email: 'admin@farmmart.com',
      password: 'adminpassword123',
      role: 'admin',
      status: 'active'
    });

    // Sign tokens
    buyer1Token = jwt.sign({ id: buyer1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    buyer2Token = jwt.sign({ id: buyer2._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    farmer1Token = jwt.sign({ id: farmer1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    farmer2Token = jwt.sign({ id: farmer2._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create a demand (unclaimed)
    demand1 = await Demand.create({
      storeName: 'Reliance Fresh',
      itemName: 'Tomatoes',
      quantity: 100,
      status: 'pending'
    });

    // Create crops
    crop1 = await Crop.create({
      farmer: farmer1._id,
      name: 'Organic Tomatoes',
      category: 'vegetables',
      quantity: 500,
      availableQuantity: 400,
      unit: 'kg',
      price: 35,
      location: 'Pune',
      status: 'available'
    });

    crop2 = await Crop.create({
      farmer: farmer2._id,
      name: 'Fresh Tomatoes',
      category: 'vegetables',
      quantity: 200,
      availableQuantity: 200,
      unit: 'kg',
      price: 40,
      location: 'Nashik',
      status: 'available'
    });
  });

  // 1. Farmer creates valid initial offer
  test('Farmer can create a valid initial offer', async () => {
    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30,
        message: 'High quality local tomatoes'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalPrice).toBe(1500); // 50 * 30
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.createdBy).toBe(farmer1._id.toString());
  });

  // 2. Buyer cannot create initial offer
  test('Buyer cannot create an initial offer', async () => {
    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 3. Unauthenticated user cannot create offer
  test('Unauthenticated user cannot create an offer', async () => {
    const res = await request(app)
      .post('/api/offers')
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30
      });

    expect(res.status).toBe(401);
  });

  // 4. Farmer cannot use another farmer's crop
  test('Farmer cannot submit another farmer\'s crop', async () => {
    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop2._id.toString(), // belongs to farmer2
        quantity: 50,
        pricePerUnit: 30
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 5. Invalid demand rejected
  test('Invalid/non-existent demand is rejected', async () => {
    const fakeDemandId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: fakeDemandId,
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30
      });

    expect(res.status).toBe(404);
  });

  // 6. Closed/Completed demand rejected
  test('Creating an offer for a completed demand is rejected', async () => {
    const completedDemand = await Demand.create({
      storeName: 'Spencers',
      itemName: 'Potatoes',
      quantity: 100,
      status: 'completed'
    });

    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: completedDemand._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('completed');
  });

  // 7. Duplicate active offer rejected
  test('Duplicate active pending offer from same farmer is rejected', async () => {
    // Submit first offer
    await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30
      });

    // Submit second offer
    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 40,
        pricePerUnit: 28
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('active pending offer');
  });

  // 8. Farmer sees own offers
  test('Farmer can view their own offers', async () => {
    // Create offer
    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .get('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(offer._id.toString());
  });

  // 9. Farmer cannot modify another farmer's offer
  test('Farmer cannot modify/withdraw another farmer\'s offer', async () => {
    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .put(`/api/offers/${offer._id}`)
      .set('Authorization', `Bearer ${farmer2Token}`)
      .send({ status: 'withdrawn' });

    expect(res.status).toBe(403);
  });

  // 10. Farmer withdraws pending offer
  test('Farmer can withdraw their pending offer', async () => {
    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .put(`/api/offers/${offer._id}`)
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ status: 'withdrawn' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('withdrawn');
  });

  // 11. Buyer sees offers on own demand
  test('Buyer can view offers on their own demand', async () => {
    // Assign buyer to demand
    demand1.buyer = buyer1._id;
    await demand1.save();

    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .get(`/api/offers?demand=${demand1._id.toString()}`)
      .set('Authorization', `Bearer ${buyer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(offer._id.toString());
  });

  // 12. Buyer cannot see another buyer's offers
  test('Buyer cannot view another buyer\'s private offers', async () => {
    // Assign buyer2 to demand
    demand1.buyer = buyer2._id;
    await demand1.save();

    await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .get(`/api/offers?demand=${demand1._id.toString()}`)
      .set('Authorization', `Bearer ${buyer1Token}`); // buyer1 attempts to view

    expect(res.status).toBe(403);
  });

  // 13. Buyer accepts valid offer
  test('Buyer can accept a valid pending offer', async () => {
    demand1.buyer = buyer1._id;
    await demand1.save();

    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .put(`/api/offers/${offer._id}`)
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.data.offer.status).toBe('accepted');
    expect(res.body.data.task).toBeDefined();

    // Verify task details
    const task = await Task.findById(res.body.data.task._id);
    expect(task.assignedUser.toString()).toBe(buyer1._id.toString());
    expect(task.quantity).toBe(50);
    expect(task.purchasePrice).toBe(1500);
    expect(task.farmer.name).toBe(farmer1.name);

    // Verify demand details
    const updatedDemand = await Demand.findById(demand1._id);
    expect(updatedDemand.status).toBe('assigned');
    expect(updatedDemand.claimedByTask.toString()).toBe(task._id.toString());
  });

  // 14. Buyer rejects valid offer
  test('Buyer can reject a valid pending offer', async () => {
    demand1.buyer = buyer1._id;
    await demand1.save();

    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .put(`/api/offers/${offer._id}`)
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
  });

  // 15. Buyer creates counter-offer
  test('Buyer can create counter-offer to farmer\'s offer', async () => {
    demand1.buyer = buyer1._id;
    await demand1.save();

    const farmerOffer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 100,
      pricePerUnit: 35,
      totalPrice: 3500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({
        demand: demand1._id.toString(),
        parentOffer: farmerOffer._id.toString(),
        quantity: 80,
        pricePerUnit: 32,
        message: 'Counter offer: Proposing reduced quantity and price'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.createdBy).toBe(buyer1._id.toString());
    expect(res.body.data.parentOffer).toBe(farmerOffer._id.toString());

    // Verify parent offer is now countered
    const updatedParent = await Offer.findById(farmerOffer._id);
    expect(updatedParent.status).toBe('countered');
  });

  // 16. Farmer responds to buyer counter-offer
  test('Farmer can counter a buyer\'s counter-offer', async () => {
    demand1.buyer = buyer1._id;
    await demand1.save();

    const farmerOffer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 100,
      pricePerUnit: 35,
      totalPrice: 3500,
      createdBy: farmer1._id,
      status: 'countered'
    });

    const buyerCounter = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 80,
      pricePerUnit: 32,
      totalPrice: 2560,
      createdBy: buyer1._id,
      parentOffer: farmerOffer._id,
      status: 'pending'
    });

    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        parentOffer: buyerCounter._id.toString(),
        quantity: 90,
        pricePerUnit: 33,
        message: 'Final compromise'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.createdBy).toBe(farmer1._id.toString());
    expect(res.body.data.parentOffer).toBe(buyerCounter._id.toString());

    const updatedParent = await Offer.findById(buyerCounter._id);
    expect(updatedParent.status).toBe('countered');
  });

  // 17. Farmer accepts buyer counter-offer
  test('Farmer can accept a buyer\'s counter-offer', async () => {
    demand1.buyer = buyer1._id;
    await demand1.save();

    const farmerOffer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 100,
      pricePerUnit: 35,
      totalPrice: 3500,
      createdBy: farmer1._id,
      status: 'countered'
    });

    const buyerCounter = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 80,
      pricePerUnit: 32,
      totalPrice: 2560,
      createdBy: buyer1._id,
      parentOffer: farmerOffer._id,
      status: 'pending'
    });

    const res = await request(app)
      .put(`/api/offers/${buyerCounter._id}`)
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.data.offer.status).toBe('accepted');
    expect(res.body.data.task).toBeDefined();

    // Verify task details match the buyerCounter terms
    const task = await Task.findById(res.body.data.task._id);
    expect(task.quantity).toBe(80);
    expect(task.purchasePrice).toBe(2560);
    expect(task.farmer.name).toBe(farmer1.name);
  });

  // 18. Invalid state transitions rejected
  test('Invalid state transitions are rejected', async () => {
    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id,
      status: 'withdrawn' // already withdrawn
    });

    const res = await request(app)
      .put(`/api/offers/${offer._id}`)
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already withdrawn');
  });

  // 19. Invalid quantity rejected
  test('Negative or zero quantity is rejected', async () => {
    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: -10,
        pricePerUnit: 30
      });

    expect(res.status).toBe(400);
  });

  // 20. Invalid price rejected
  test('Negative price is rejected', async () => {
    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: -5
      });

    expect(res.status).toBe(400);
  });

  // 21. Safe population verification
  test('Populated response does not leak passwords or auth keys', async () => {
    const offer = await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .get(`/api/offers/${offer._id}`)
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    // Safe fields of farmer
    expect(data.farmer.name).toBe(farmer1.name);
    expect(data.farmer.password).toBeUndefined();
    // Safe fields of crop
    expect(data.crop.name).toBe(crop1.name);
    expect(data.crop.availableQuantity).toBeUndefined(); // not in population list
    // Safe fields of createdBy
    expect(data.createdBy.name).toBe(farmer1.name);
    expect(data.createdBy.password).toBeUndefined();
  });

  // 22. Existing Claim -> Task workflow remains functional
  test('Existing claim -> task workflow continues to function as before', async () => {
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({
        assignedUser: buyer1._id.toString(),
        type: 'procurement',
        storeName: demand1.storeName,
        itemName: demand1.itemName,
        quantity: demand1.quantity,
        farmer: { name: '', category: '' },
        purchasePrice: 0,
        deliveryPrice: 0,
        deliveryCharges: 0,
        deadline,
        demandId: demand1._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const updatedDemand = await Demand.findById(demand1._id);
    expect(updatedDemand.status).toBe('assigned');
    expect(updatedDemand.buyer.toString()).toBe(buyer1._id.toString());
    expect(updatedDemand.claimedByTask.toString()).toBe(res.body.data._id.toString());
  });

  // 23. Farmer can submit initial offer to an assigned/claimed demand
  test('Farmer can submit initial offer to an assigned/claimed demand', async () => {
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const claimRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({
        assignedUser: buyer1._id.toString(),
        type: 'procurement',
        storeName: demand1.storeName,
        itemName: demand1.itemName,
        quantity: demand1.quantity,
        farmer: { name: '', category: '' },
        purchasePrice: 0,
        deliveryPrice: 0,
        deliveryCharges: 0,
        deadline,
        demandId: demand1._id.toString()
      });

    expect(claimRes.status).toBe(201);
    const assignedDemand = await Demand.findById(demand1._id);
    expect(assignedDemand.status).toBe('assigned');

    const offerRes = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30,
        message: 'Bidding on claimed demand'
      });

    expect(offerRes.status).toBe(201);
    expect(offerRes.body.success).toBe(true);
    expect(offerRes.body.data.status).toBe('pending');
  });

  // 24. Counter-offer does NOT assign demand or set buyer
  test('Counter-offer does NOT assign demand or set buyer', async () => {
    // Farmer creates offer on open demand
    const offerRes = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 50,
        pricePerUnit: 30,
        message: 'Initial farmer offer'
      });
    expect(offerRes.status).toBe(201);

    // Buyer counters offer
    const counterRes = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({
        demand: demand1._id.toString(),
        parentOffer: offerRes.body.data._id,
        quantity: 45,
        pricePerUnit: 28,
        message: 'Buyer counter proposal'
      });

    expect(counterRes.status).toBe(201);
    expect(counterRes.body.data.status).toBe('pending');

    // Verify demand remains pending and unassigned (buyer is still null)
    const refreshedDemand = await Demand.findById(demand1._id);
    expect(refreshedDemand.status).toBe('pending');
    expect(refreshedDemand.buyer).toBeNull();
  });

  // 25. Complete open demand negotiation: Farmer initial -> Buyer counter -> Farmer counter -> Buyer accepts
  test('Complete open demand negotiation flow to acceptance and task creation', async () => {
    // 1. Farmer creates initial offer
    const farmerOfferRes = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        crop: crop1._id.toString(),
        quantity: 100,
        pricePerUnit: 35,
        message: 'Initial offer'
      });
    const farmerOfferId = farmerOfferRes.body.data._id;

    // 2. Buyer discovers offer on open demand via GET /api/offers
    const buyerGetRes = await request(app)
      .get(`/api/offers?demand=${demand1._id.toString()}`)
      .set('Authorization', `Bearer ${buyer1Token}`);
    expect(buyerGetRes.status).toBe(200);
    expect(buyerGetRes.body.data.length).toBe(1);

    // 3. Buyer counters farmer offer
    const buyerCounterRes = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({
        demand: demand1._id.toString(),
        parentOffer: farmerOfferId,
        quantity: 90,
        pricePerUnit: 32,
        message: 'Counter proposal'
      });
    const buyerCounterId = buyerCounterRes.body.data._id;

    // Verify demand still unassigned
    let currentDemand = await Demand.findById(demand1._id);
    expect(currentDemand.status).toBe('pending');
    expect(currentDemand.buyer).toBeNull();

    // 4. Farmer counters back
    const farmerCounterRes = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: demand1._id.toString(),
        parentOffer: buyerCounterId,
        quantity: 95,
        pricePerUnit: 33,
        message: 'Farmer counter compromise'
      });
    const finalFarmerOfferId = farmerCounterRes.body.data._id;

    // 5. Buyer accepts farmer\'s counter-offer
    const acceptRes = await request(app)
      .put(`/api/offers/${finalFarmerOfferId}`)
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({ status: 'accepted' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.offer.status).toBe('accepted');
    expect(acceptRes.body.data.task).toBeDefined();

    // 6. Verify demand is NOW assigned to buyer1 and linked to task
    currentDemand = await Demand.findById(demand1._id);
    expect(currentDemand.status).toBe('assigned');
    expect(currentDemand.buyer.toString()).toBe(buyer1._id.toString());
    expect(currentDemand.claimedByTask.toString()).toBe(acceptRes.body.data.task._id.toString());

    // 7. Verify task terms match final accepted offer
    const task = await Task.findById(acceptRes.body.data.task._id);
    expect(task.assignedUser.toString()).toBe(buyer1._id.toString());
    expect(task.quantity).toBe(95);
    expect(task.purchasePrice).toBe(3135); // 95 * 33
  });

  // 26. Admin can inspect all offers and demands
  test('Admin can view all offers across demands', async () => {
    await Offer.create({
      demand: demand1._id,
      farmer: farmer1._id,
      crop: crop1._id,
      quantity: 50,
      pricePerUnit: 30,
      totalPrice: 1500,
      createdBy: farmer1._id
    });

    const res = await request(app)
      .get('/api/offers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // 27. Admin can edit and delete store demands
  test('Admin can edit and delete store demands', async () => {
    // 1. Admin edits demand
    const updateRes = await request(app)
      .put(`/api/demands/${demand1._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        storeName: 'Updated Store Name',
        itemName: 'Organic Potato',
        quantity: 1200
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.storeName).toBe('Updated Store Name');
    expect(updateRes.body.data.itemName).toBe('Organic Potato');
    expect(updateRes.body.data.quantity).toBe(1200);

    // 2. Admin deletes demand
    const deleteRes = await request(app)
      .delete(`/api/demands/${demand1._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const deletedCheck = await Demand.findById(demand1._id);
    expect(deletedCheck).toBeNull();
  });

  // 28. Non-admins cannot edit or delete store demands
  test('Non-admins are forbidden from editing or deleting store demands', async () => {
    // Buyer attempt to edit
    const buyerEditRes = await request(app)
      .put(`/api/demands/${demand1._id}`)
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({ storeName: 'Hacked Store' });
    expect(buyerEditRes.status).toBe(403);

    // Farmer attempt to delete
    const farmerDeleteRes = await request(app)
      .delete(`/api/demands/${demand1._id}`)
      .set('Authorization', `Bearer ${farmer1Token}`);
    expect(farmerDeleteRes.status).toBe(403);
  });

  // 29. Store demand automatically marks as completed when task is delivered and paid
  test('Store demand marks as completed when procurement task is cleared and delivered', async () => {
    const Task = require('../models/Task');
    // Create an assigned demand
    const testDemand = await Demand.create({
      storeName: 'Completion Store',
      itemName: 'Apples',
      quantity: 300,
      status: 'assigned',
      buyer: buyer1._id
    });

    const task = await Task.create({
      assignedUser: buyer1._id,
      storeName: 'Completion Store',
      itemName: 'Apples',
      quantity: 300,
      farmer: { name: 'Farmer Bob', category: 'fruits' },
      purchasePrice: 9000,
      deliveryPrice: 500,
      deliveryCharges: 100,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date(Date.now() + 86400000)
    });

    testDemand.claimedByTask = task._id;
    await testDemand.save();

    // 1. Clear payment
    await request(app)
      .put(`/api/tasks/${task._id}/payment`)
      .set('Authorization', `Bearer ${buyer1Token}`);

    // 2. Confirm delivery
    await request(app)
      .put(`/api/tasks/${task._id}/delivery`)
      .set('Authorization', `Bearer ${buyer1Token}`);

    const updatedDemand = await Demand.findById(testDemand._id);
    expect(updatedDemand.status).toBe('completed');
  });

  // 30. Offer acceptance sets farmerId and procurementStatus: 'pending' on created Task
  test('Accepting an offer populates farmerId and procurementStatus on the task', async () => {
    const freshDemand = await Demand.create({
      storeName: 'Procurement Test Store',
      itemName: 'Guavas',
      quantity: 150
    });

    const offerRes = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        demand: freshDemand._id,
        quantity: 150,
        pricePerUnit: 25,
        message: 'Guavas ready'
      });

    const acceptRes = await request(app)
      .put(`/api/offers/${offerRes.body.data._id}`)
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({ status: 'accepted' });

    expect(acceptRes.status).toBe(200);
    const createdTask = acceptRes.body.data.task;
    expect(createdTask.farmerId.toString()).toBe(farmer1._id.toString());
    expect(createdTask.procurementStatus).toBe('pending');
  });

  // 31. Farmer can fetch tasks assigned to them
  test('Farmer can retrieve tasks where farmerId matches their user ID', async () => {
    const Task = require('../models/Task');
    const farmerTask = await Task.create({
      assignedUser: buyer1._id,
      farmerId: farmer1._id,
      storeName: 'Farmer Store',
      itemName: 'Oranges',
      quantity: 100,
      farmer: { name: farmer1.name, category: 'fruits' },
      purchasePrice: 2000,
      deadline: new Date(Date.now() + 86400000)
    });

    const getRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBeGreaterThan(0);
    const foundTask = getRes.body.data.find(t => (t._id || t.id).toString() === farmerTask._id.toString());
    expect(foundTask).toBeDefined();
  });

  // 32. Farmer can mark task as procured
  test('Farmer can mark their task as procured via PUT /api/tasks/:id/procure', async () => {
    const Task = require('../models/Task');
    const farmerTask = await Task.create({
      assignedUser: buyer1._id,
      farmerId: farmer1._id,
      storeName: 'Farmer Store 2',
      itemName: 'Bananas',
      quantity: 200,
      farmer: { name: farmer1.name, category: 'fruits' },
      purchasePrice: 3000,
      deadline: new Date(Date.now() + 86400000)
    });

    const procureRes = await request(app)
      .put(`/api/tasks/${farmerTask._id}/procure`)
      .set('Authorization', `Bearer ${farmer1Token}`);

    expect(procureRes.status).toBe(200);
    expect(procureRes.body.data.procurementStatus).toBe('procured');
  });

  // 33. Non-assigned farmer cannot mark task as procured
  test('Non-assigned farmer receives 403 when trying to mark a task as procured', async () => {
    const Task = require('../models/Task');
    const farmerTask = await Task.create({
      assignedUser: buyer1._id,
      farmerId: farmer1._id,
      storeName: 'Farmer Store 3',
      itemName: 'Pineapples',
      quantity: 50,
      farmer: { name: farmer1.name, category: 'fruits' },
      purchasePrice: 1500,
      deadline: new Date(Date.now() + 86400000)
    });

    const unauthorizedRes = await request(app)
      .put(`/api/tasks/${farmerTask._id}/procure`)
      .set('Authorization', `Bearer ${farmer2Token}`);

    expect(unauthorizedRes.status).toBe(403);
  });

  // 34. Delivery confirmation requires procurementStatus === 'procured'
  test('Delivery confirmation is blocked until farmer marks task as procured', async () => {
    const Task = require('../models/Task');
    const gatedTask = await Task.create({
      assignedUser: buyer1._id,
      farmerId: farmer1._id,
      storeName: 'Gated Store',
      itemName: 'Lemons',
      quantity: 80,
      farmer: { name: farmer1.name, category: 'fruits' },
      purchasePrice: 800,
      paymentStatus: 'paid',
      procurementStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date(Date.now() + 86400000)
    });

    // Attempt delivery while procurement is pending -> Should fail with 400
    const deliveryAttempt = await request(app)
      .put(`/api/tasks/${gatedTask._id}/delivery`)
      .set('Authorization', `Bearer ${buyer1Token}`);

    expect(deliveryAttempt.status).toBe(400);
    expect(deliveryAttempt.body.message).toMatch(/procurement/i);

    // Farmer marks as procured
    await request(app)
      .put(`/api/tasks/${gatedTask._id}/procure`)
      .set('Authorization', `Bearer ${farmer1Token}`);

    // Now delivery attempt succeeds -> 200
    const successfulDelivery = await request(app)
      .put(`/api/tasks/${gatedTask._id}/delivery`)
      .set('Authorization', `Bearer ${buyer1Token}`);

    expect(successfulDelivery.status).toBe(200);
    expect(successfulDelivery.body.data.deliveryStatus).toBe('delivered');
  });

  // 35. Admins, buyers, and unauthenticated users cannot mark task as procured
  test('Admin, buyer, and unauthenticated users receive 403/401 when attempting to mark task as procured', async () => {
    const Task = require('../models/Task');
    const farmerTask = await Task.create({
      assignedUser: buyer1._id,
      farmerId: farmer1._id,
      storeName: 'Farmer Procurement Only Store',
      itemName: 'Watermelons',
      quantity: 60,
      farmer: { name: farmer1.name, category: 'fruits' },
      purchasePrice: 1800,
      deadline: new Date(Date.now() + 86400000)
    });

    // Admin attempt -> 403 Forbidden
    const adminRes = await request(app)
      .put(`/api/tasks/${farmerTask._id}/procure`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(403);

    // Buyer attempt -> 403 Forbidden
    const buyerRes = await request(app)
      .put(`/api/tasks/${farmerTask._id}/procure`)
      .set('Authorization', `Bearer ${buyer1Token}`);
    expect(buyerRes.status).toBe(403);

    // Unauthenticated attempt -> 401 Unauthorized
    const unauthRes = await request(app)
      .put(`/api/tasks/${farmerTask._id}/procure`);
    expect(unauthRes.status).toBe(401);
  });
});
