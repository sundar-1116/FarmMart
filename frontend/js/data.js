// ============================================================
// Farmers To Mart — Data Layer
// All data is stored in localStorage. Passwords are hashed
// using Web Crypto API (SHA-256).
// TODO(security): Replace with bcrypt/argon2 on a real backend.
// TODO(security): Replace localStorage with a real database.
// ============================================================

const FTM_KEYS = {
  USERS: 'ftm_users',
  FARMERS: 'ftm_farmers',
  STORES: 'ftm_stores',
  QUERIES: 'ftm_queries',
  REPORTS: 'ftm_reports',
  SESSION: 'ftm_session',
  INITIALIZED: 'ftm_initialized_v2',
  DEMANDS: 'ftm_demands',
  TASKS: 'ftm_tasks',
  SUBMITTED_REPORTS: 'ftm_submitted_reports',
};

// ── Crypto helpers ──────────────────────────────────────────
async function hashPassword(password) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn("crypto.subtle not available, falling back to simple hash", e);
  }
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return 'mock-' + Math.abs(hash);
}

async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ── Storage helpers ─────────────────────────────────────────
function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Session (sessionStorage — cleared on tab close)
function getSession() {
  try {
    const raw = sessionStorage.getItem(FTM_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(data) {
  sessionStorage.setItem(FTM_KEYS.SESSION, JSON.stringify(data));
}

function clearSession() {
  sessionStorage.removeItem(FTM_KEYS.SESSION);
}

// ── Seed Data ────────────────────────────────────────────────
// Farmer categories: fruits | vegetables | flowers | pulses
const SEED_FARMERS = [
  // ── Fruit Growers ──
  { id: 1, name: 'Lakshmi Devi', category: 'fruits', location: 'Guntur, Andhra Pradesh', crops: ['Mangoes', 'Bananas', 'Papayas', 'Sapota'], phone: '9876543211', email: 'lakshmi@farm.com', rating: 4.8, avatar: 'LD', joinDate: '2023-01-15', status: 'active', experience: '8 years', landArea: '5 acres' },
  { id: 2, name: 'Savitri Bai', category: 'fruits', location: 'Kurnool, Andhra Pradesh', crops: ['Grapes', 'Pomegranate', 'Sweet Lime', 'Watermelon'], phone: '9876543217', email: 'savitri@farm.com', rating: 4.6, avatar: 'SB', joinDate: '2023-02-10', status: 'active', experience: '11 years', landArea: '7 acres' },
  { id: 3, name: 'Ramesh Nair', category: 'fruits', location: 'Visakhapatnam, AP', crops: ['Jackfruit', 'Guava', 'Dragon Fruit', 'Avocado'], phone: '9876543220', email: 'ramesh@farm.com', rating: 4.7, avatar: 'RN', joinDate: '2023-03-08', status: 'active', experience: '9 years', landArea: '6 acres' },

  // ── Vegetable Growers ──
  { id: 4, name: 'Raju Kumar', category: 'vegetables', location: 'Warangal, Telangana', crops: ['Tomatoes', 'Onions', 'Brinjal', 'Capsicum'], phone: '9876543210', email: 'raju@farm.com', rating: 4.9, avatar: 'RK', joinDate: '2023-01-20', status: 'active', experience: '12 years', landArea: '8 acres' },
  { id: 5, name: 'Srinivas Reddy', category: 'vegetables', location: 'Khammam, Telangana', crops: ['Turmeric', 'Red Chilli', 'Coriander', 'Spinach'], phone: '9876543214', email: 'srini@farm.com', rating: 4.5, avatar: 'SR', joinDate: '2023-04-12', status: 'active', experience: '10 years', landArea: '12 acres' },
  { id: 6, name: 'Meena Kumari', category: 'vegetables', location: 'Nalgonda, Telangana', crops: ['Cucumber', 'Bitter Gourd', 'Ladies Finger', 'Cabbage'], phone: '9876543221', email: 'meena@farm.com', rating: 4.6, avatar: 'MK', joinDate: '2023-05-18', status: 'active', experience: '7 years', landArea: '5 acres' },

  // ── Flower Growers ──
  { id: 7, name: 'Padmavathi', category: 'flowers', location: 'Nellore, Andhra Pradesh', crops: ['Roses', 'Marigolds', 'Jasmine', 'Lotus'], phone: '9876543213', email: 'padma@farm.com', rating: 4.9, avatar: 'PD', joinDate: '2023-02-05', status: 'active', experience: '6 years', landArea: '3 acres' },
  { id: 8, name: 'Annapurna Devi', category: 'flowers', location: 'Tirupati, Andhra Pradesh', crops: ['Sunflowers', 'Chrysanthemum', 'Lily', 'Gerbera'], phone: '9876543222', email: 'anna@farm.com', rating: 4.7, avatar: 'AD', joinDate: '2023-06-22', status: 'active', experience: '5 years', landArea: '2 acres' },

  // ── Pulses Growers ──
  { id: 9, name: 'Venkat Rao', category: 'pulses', location: 'Karimnagar, Telangana', crops: ['Rice', 'Wheat', 'Sorghum', 'Jowar'], phone: '9876543212', email: 'venkat@farm.com', rating: 4.7, avatar: 'VR', joinDate: '2023-03-10', status: 'active', experience: '15 years', landArea: '20 acres' },
  { id: 10, name: 'Anitha Kumari', category: 'pulses', location: 'Visakhapatnam, AP', crops: ['Toor Dal', 'Moong Dal', 'Chana', 'Urad Dal'], phone: '9876543215', email: 'anitha@farm.com', rating: 4.4, avatar: 'AK', joinDate: '2023-06-18', status: 'active', experience: '7 years', landArea: '6 acres' },
  { id: 11, name: 'Mahesh Goud', category: 'pulses', location: 'Nizamabad, Telangana', crops: ['Rajma', 'Masoor Dal', 'Black Gram', 'Green Gram'], phone: '9876543216', email: 'mahesh@farm.com', rating: 4.6, avatar: 'MG', joinDate: '2023-07-22', status: 'active', experience: '9 years', landArea: '10 acres' },
];

// Store categories matching real Indian retail chains
const SEED_STORES = [
  { id: 1, name: 'JioMart', category: 'supermarket', location: 'Pan India — Multiple Locations', rating: 4.5, logo: 'JM', products: ['Fresh Vegetables', 'Fruits', 'Pulses', 'Dairy', 'Groceries'], priceRange: '₹10–₹500', status: 'active', joinDate: '2023-01-10', orders: 5820, about: "Reliance's online grocery platform delivering fresh farm produce across India." },
  { id: 2, name: 'More Supermarket', category: 'supermarket', location: 'South India — Hyderabad, Bangalore, Chennai', rating: 4.3, logo: 'MS', products: ['Organic Vegetables', 'Seasonal Fruits', 'Whole Grains', 'Flowers'], priceRange: '₹20–₹600', status: 'active', joinDate: '2023-01-15', orders: 3240, about: "Aditya Birla Retail's supermarket chain with a strong focus on fresh produce." },
  { id: 3, name: 'Reliance Smart', category: 'hypermarket', location: 'Hyderabad, Secunderabad, Warangal', rating: 4.4, logo: 'RS', products: ['Vegetables', 'Fruits', 'Flowers', 'Pulses & Grains', 'Dairy'], priceRange: '₹15–₹800', status: 'active', joinDate: '2023-02-05', orders: 4610, about: "Reliance Retail's hypermarket offering a wide range of fresh farm-to-shelf products." },
  { id: 4, name: 'Amazon Fresh', category: 'online', location: 'Online — Hyderabad, Vizag, Vijayawada', rating: 4.6, logo: 'AF', products: ['Organic Produce', 'Exotic Fruits', 'Herbs', 'Premium Vegetables'], priceRange: '₹30–₹1200', status: 'active', joinDate: '2023-02-20', orders: 6900, about: "Amazon's grocery delivery service connecting farms directly to your doorstep." },
  { id: 5, name: 'Panchavati Stores', category: 'general', location: 'Hyderabad, Guntur, Vijayawada', rating: 4.7, logo: 'PS', products: ['Local Vegetables', 'Seasonal Fruits', 'Fresh Flowers', 'Pulses'], priceRange: '₹10–₹300', status: 'active', joinDate: '2023-03-01', orders: 2870, about: 'Beloved local chain known for sourcing directly from nearby farmers at fair prices.' },
  { id: 6, name: 'D-Mart', category: 'hypermarket', location: 'Hyderabad, Secunderabad, Karimnagar', rating: 4.5, logo: 'DM', products: ['Staples', 'Pulses & Grains', 'Vegetables', 'Fruits', 'Grocery'], priceRange: '₹10–₹700', status: 'active', joinDate: '2023-03-15', orders: 7200, about: "India's largest retail chain offering everyday essentials at the best prices." },
  { id: 7, name: 'Q-Mart', category: 'general', location: 'Hyderabad, Warangal, Nalgonda', rating: 4.2, logo: 'QM', products: ['Vegetables', 'Fruits', 'Dairy', 'Fresh Flowers', 'Pulses'], priceRange: '₹15–₹400', status: 'active', joinDate: '2023-04-10', orders: 1540, about: 'Quick-service mart offering fresh local produce with fast home delivery.' },
  { id: 8, name: 'General Stores Network', category: 'general', location: 'Village & Town Markets — All Districts', rating: 4.1, logo: 'GS', products: ['Seasonal Vegetables', 'Local Fruits', 'Grains', 'Pulses', 'Flowers'], priceRange: '₹5–₹250', status: 'active', joinDate: '2023-05-01', orders: 3100, about: 'Network of neighbourhood general stores directly linked to local farmer cooperatives.' },
];

const SEED_REPORTS = {
  monthly_sales: [42000, 58000, 51000, 67000, 73000, 88000, 95000, 102000, 89000, 115000, 128000, 142000],
  monthly_orders: [320, 450, 390, 520, 580, 670, 720, 810, 750, 890, 960, 1100],
  monthly_users: [45, 62, 58, 74, 88, 95, 112, 128, 135, 150, 168, 190],
  categories: { vegetables: 35, fruits: 28, pulses: 18, flowers: 10, daily: 9 },
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

// ── Initialize Data ──────────────────────────────────────────
async function initializeData() {
  // Always ensure the admin account exists with admin@gmail. / admin
  const adminHash = await hashPassword('admin');
  const adminUser = {
    id: 'admin-001',
    name: 'Platform Admin',
    email: 'admin@gmail.',
    passwordHash: adminHash,
    role: 'admin',
    joinDate: '2023-01-01',
    status: 'active',
    avatar: 'PA',
  };

  const customAdminHash = await hashPassword('hemasundar');
  const customAdminUser = {
    id: 'admin-hemasundar',
    name: 'Hema Sundar Sai',
    email: 'hemasundarsai@gmail.com',
    passwordHash: customAdminHash,
    role: 'admin',
    joinDate: '2023-01-01',
    status: 'active',
    avatar: 'HS',
  };

  // Seed mock users with complete profile details
  const mockUsers = [
    {
      id: 'user-priya',
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      passwordHash: await hashPassword('password123'),
      role: 'user',
      joinDate: '2023-02-15',
      status: 'active',
      avatar: 'PS',
      phone: '9876543201',
      gender: 'Female',
      age: 26,
      photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%23f472b6"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%23db2777"/></svg>`,
      online: true
    },
    {
      id: 'user-arjun',
      name: 'Arjun Reddy',
      email: 'arjun.reddy@gmail.com',
      passwordHash: await hashPassword('password123'),
      role: 'user',
      joinDate: '2023-03-10',
      status: 'active',
      avatar: 'AR',
      phone: '9876543202',
      gender: 'Male',
      age: 31,
      photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`,
      online: false
    },
    {
      id: 'user-kavya',
      name: 'Kavya Nair',
      email: 'kavya.nair@gmail.com',
      passwordHash: await hashPassword('password123'),
      role: 'user',
      joinDate: '2023-04-18',
      status: 'active',
      avatar: 'KN',
      phone: '9876543203',
      gender: 'Female',
      age: 24,
      photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%23f472b6"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%23db2777"/></svg>`,
      online: true
    },
    {
      id: 'user-rohan',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@gmail.com',
      passwordHash: await hashPassword('password123'),
      role: 'user',
      joinDate: '2023-05-22',
      status: 'inactive',
      avatar: 'RM',
      phone: '9876543204',
      gender: 'Male',
      age: 29,
      photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`,
      online: false
    },
    {
      id: 'user-custom-1',
      name: 'Test Consumer',
      email: 'user1@user.com',
      passwordHash: await hashPassword('user@123'),
      role: 'user',
      joinDate: '2023-05-23',
      status: 'active',
      avatar: 'TC',
      phone: '9876543211',
      gender: 'Male',
      age: 28,
      photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`,
      online: true
    }
  ];

  const SEED_QUERIES = [
    {
      id: 'q-1',
      query: "Can you provide details on the latest pricing for Alphonso Mangoes from Guntur?",
      userId: 'user-priya',
      userName: "Priya Sharma",
      userEmail: "priya.sharma@gmail.com",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      status: 'pending',
      mailed: true,
      adminEmail: 'admin@gmail.'
    },
    {
      id: 'q-2',
      query: "I tried calling Raju Kumar but his line was busy. Does he have a secondary number?",
      userId: 'user-priya',
      userName: "Priya Sharma",
      userEmail: "priya.sharma@gmail.com",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
      status: 'resolved',
      mailed: true,
      adminEmail: 'admin@gmail.'
    },
    {
      id: 'q-3',
      query: "How can I schedule a dispatch from Annapurna Devi's flower farm to Reliance Smart?",
      userId: 'user-kavya',
      userName: "Kavya Nair",
      userEmail: "kavya.nair@gmail.com",
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
      status: 'pending',
      mailed: true,
      adminEmail: 'admin@gmail.'
    },
    {
      id: 'q-4',
      query: "Is there any organic certification document available for Venkat Rao's Basmati Rice?",
      userId: 'user-arjun',
      userName: "Arjun Reddy",
      userEmail: "arjun.reddy@gmail.com",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
      status: 'resolved',
      mailed: true,
      adminEmail: 'admin@gmail.'
    }
  ];

  let users = getAllUsers();
  
  // Clean/update admin
  const adminIdx = users.findIndex(u => u.role === 'admin' && u.email === 'admin@gmail.');
  if (adminIdx !== -1) {
    users[adminIdx] = adminUser;
  } else {
    users.unshift(adminUser);
  }

  // Seed custom admin
  const customAdminIdx = users.findIndex(u => u.role === 'admin' && u.email === 'hemasundarsai@gmail.com');
  if (customAdminIdx !== -1) {
    users[customAdminIdx] = customAdminUser;
  } else {
    users.unshift(customAdminUser);
  }

  // Ensure mock users exist
  mockUsers.forEach(mu => {
    if (!users.some(u => u.email === mu.email)) {
      users.push(mu);
    }
  });

  saveUsers(users);

  const SEED_DEMANDS = [
    { id: 'demand-1', storeName: 'JioMart', itemName: 'Tomatoes', quantity: 500, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 'demand-2', storeName: 'D-Mart', itemName: 'Mangoes', quantity: 300, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 18).toISOString() },
    { id: 'demand-3', storeName: 'Reliance Smart', itemName: 'Potatoes', quantity: 450, status: 'assigned', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 'demand-4', storeName: 'Amazon Fresh', itemName: 'Onions', quantity: 200, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 6).toISOString() }
  ];

  const SEED_TASKS = [
    {
      id: 'task-1',
      assignedUser: 'user-custom-1', // maps to user1@user.com
      type: 'procurement',
      storeName: 'Reliance Smart',
      itemName: 'Potatoes',
      quantity: 450,
      farmer: { name: 'Raju Kumar', category: 'vegetables' },
      purchasePrice: 20,
      deliveryPrice: 30,
      deliveryCharges: 1500,
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      deadline: new Date(Date.now() + 3600000 * 48).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];

  if (getItem(FTM_KEYS.INITIALIZED)) return;

  setItem(FTM_KEYS.FARMERS, SEED_FARMERS);
  setItem(FTM_KEYS.STORES, SEED_STORES);
  setItem(FTM_KEYS.QUERIES, SEED_QUERIES);
  setItem(FTM_KEYS.REPORTS, SEED_REPORTS);
  setItem(FTM_KEYS.DEMANDS, SEED_DEMANDS);
  setItem(FTM_KEYS.TASKS, SEED_TASKS);
  setItem(FTM_KEYS.SUBMITTED_REPORTS, []);
  setItem(FTM_KEYS.INITIALIZED, true);
}

// ── User CRUD ────────────────────────────────────────────────
function getAllUsers() { return getItem(FTM_KEYS.USERS) || []; }
function saveUsers(users) { setItem(FTM_KEYS.USERS, users); }

const BACKEND_URL = 'https://farmmart-backend-y6sn.onrender.com';

async function createUser(name, email, password, phone = '', gender = '', age = '', photo = '', role = 'user') {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, phone, gender, age, photo, role })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, user: data.user };
    } else if (response.status === 400 || response.status === 401) {
      return { success: false, message: data.message || 'Signup failed.' };
    }
  } catch (err) {
    console.warn("Backend API not reachable, falling back to localStorage", err);
  }

  const users = getAllUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Email already registered.' };
  }
  const passwordHash = await hashPassword(password);
  
  // Default SVG avatar if photo is not provided
  let finalPhoto = photo;
  if (!finalPhoto) {
    if (gender.toLowerCase() === 'female') {
      finalPhoto = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%23f472b6"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%23db2777"/></svg>`;
    } else {
      finalPhoto = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`;
    }
  }

  const newUser = {
    id: (role === 'admin' ? 'admin-' : 'user-') + Date.now(),
    name,
    email,
    passwordHash,
    role,
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active',
    avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    phone,
    gender,
    age: parseInt(age) || 25,
    photo: finalPhoto,
    online: true // newly signed up user starts as online
  };
  users.push(newUser);
  saveUsers(users);
  return { success: true, user: newUser };
}

async function loginUser(email, password, role) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, role })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      const session = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        loginTime: Date.now(),
        token: data.token
      };
      setSession(session);
      return { success: true, user: session };
    } else if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { success: false, message: data.message || 'Login failed.' };
    }
  } catch (err) {
    console.warn("Backend API not reachable, falling back to localStorage", err);
  }

  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
  if (!user) return { success: false, message: 'Invalid email or password.' };
  if (user.status === 'inactive') return { success: false, message: 'Account is deactivated. Contact admin.' };
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { success: false, message: 'Invalid email or password.' };
  const session = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, loginTime: Date.now() };
  setSession(session);
  return { success: true, user: session };
}

function toggleUserStatus(userId) {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx].status = users[idx].status === 'active' ? 'inactive' : 'active';
  saveUsers(users);
  return true;
}

// ── Store CRUD ───────────────────────────────────────────────
function getAllStores() { return getItem(FTM_KEYS.STORES) || []; }
function saveStores(stores) { setItem(FTM_KEYS.STORES, stores); }

function addStore(store) {
  const stores = getAllStores();
  store.id = Date.now();
  store.orders = 0;
  store.joinDate = new Date().toISOString().split('T')[0];
  stores.push(store);
  saveStores(stores);
}

function deleteStore(id) {
  const stores = getAllStores().filter(s => s.id !== id);
  saveStores(stores);
}

// ── Farmer CRUD ──────────────────────────────────────────────
function getAllFarmers() { return getItem(FTM_KEYS.FARMERS) || []; }
function saveFarmers(farmers) { setItem(FTM_KEYS.FARMERS, farmers); }

function addFarmer(farmer) {
  const farmers = getAllFarmers();
  farmer.id = Date.now();
  farmer.joinDate = new Date().toISOString().split('T')[0];
  farmer.status = 'active';
  farmer.avatar = farmer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  farmers.push(farmer);
  saveFarmers(farmers);
}

function deleteFarmer(id) {
  const farmers = getAllFarmers().filter(f => f.id !== id);
  saveFarmers(farmers);
}

// ── Query CRUD ───────────────────────────────────────────────
function getAllQueries() { return getItem(FTM_KEYS.QUERIES) || []; }
function saveQueries(queries) { setItem(FTM_KEYS.QUERIES, queries); }

function addQuery(query, userSession) {
  const queries = getAllQueries();
  queries.unshift({
    id: 'q-' + Date.now(),
    query,
    userId: userSession.id || 'guest-' + Date.now(),
    userName: userSession.name || 'Guest User',
    userEmail: userSession.email || 'guest@example.com',
    timestamp: new Date().toISOString(),
    status: 'pending',
    mailed: true,
    adminEmail: 'admin@gmail.'
  });
  saveQueries(queries);
}


function resolveQuery(queryId) {
  const queries = getAllQueries();
  const idx = queries.findIndex(q => q.id === queryId);
  if (idx !== -1) { queries[idx].status = 'resolved'; saveQueries(queries); }
}

function resolveQueryWithEmail(queryId, subject, body) {
  const queries = getAllQueries();
  const idx = queries.findIndex(q => q.id === queryId);
  if (idx !== -1) {
    queries[idx].status = 'resolved';
    queries[idx].resolutionEmail = {
      subject,
      body,
      sentAt: new Date().toISOString()
    };
    queries[idx].emailRead = false;
    saveQueries(queries);
  }
}

function getPendingQueryCount() {
  return getAllQueries().filter(q => q.status === 'pending').length;
}

// ── Reports ──────────────────────────────────────────────────
function getReports() { return getItem(FTM_KEYS.REPORTS) || SEED_REPORTS; }

// ── Stats ────────────────────────────────────────────────────
function getDashboardStats() {
  const users = getAllUsers().filter(u => u.role === 'user');
  const farmers = getAllFarmers();
  const stores = getAllStores();
  const pendingQueries = getPendingQueryCount();
  return { users: users.length, farmers: farmers.length, stores: stores.length, pendingQueries };
}

// ── Demands API ──────────────────────────────────────────────
async function getDemands() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/demands`);
    const data = await response.json();
    if (response.ok && data.success) {
      return data.data;
    }
  } catch (err) {
    console.warn("Backend demands API not reachable, falling back to localStorage", err);
  }
  return getItem(FTM_KEYS.DEMANDS) || [];
}

async function createDemand(storeName, itemName, quantity) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/demands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName, itemName, quantity })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, data: data.data };
    }
  } catch (err) {
    console.warn("Backend demands API not reachable, falling back to localStorage", err);
  }

  const demands = getItem(FTM_KEYS.DEMANDS) || [];
  const newDemand = {
    id: 'demand-' + Date.now(),
    storeName,
    itemName,
    quantity: parseFloat(quantity),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  demands.push(newDemand);
  setItem(FTM_KEYS.DEMANDS, demands);
  return { success: true, data: newDemand };
}

async function updateDemand(id, status) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/demands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, data: data.data };
    }
  } catch (err) {
    console.warn("Backend demands API not reachable, falling back to localStorage", err);
  }

  const demands = getItem(FTM_KEYS.DEMANDS) || [];
  const idx = demands.findIndex(d => d.id === id);
  if (idx !== -1) {
    demands[idx].status = status;
    setItem(FTM_KEYS.DEMANDS, demands);
    return { success: true, data: demands[idx] };
  }
  return { success: false, message: 'Demand not found' };
}

// ── Tasks API ────────────────────────────────────────────────
async function getTasks(assignedUser = '') {
  try {
    const url = assignedUser ? `${BACKEND_URL}/api/tasks?assignedUser=${assignedUser}` : `${BACKEND_URL}/api/tasks`;
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok && data.success) {
      return data.data;
    }
  } catch (err) {
    console.warn("Backend tasks API not reachable, falling back to localStorage", err);
  }

  let tasks = getItem(FTM_KEYS.TASKS) || [];
  if (assignedUser) {
    tasks = tasks.filter(t => {
      const uId = (t.assignedUser && typeof t.assignedUser === 'object') ? t.assignedUser.id || t.assignedUser._id : t.assignedUser;
      return uId === assignedUser;
    });
  }
  return tasks;
}

async function createTask(taskData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, data: data.data };
    } else if (response.status === 400 || response.status === 404) {
      return { success: false, message: data.message };
    }
  } catch (err) {
    console.warn("Backend tasks API not reachable, falling back to localStorage", err);
  }

  const tasks = getItem(FTM_KEYS.TASKS) || [];
  const newTask = {
    id: 'task-' + Date.now(),
    assignedUser: taskData.assignedUser,
    type: taskData.type || 'procurement',
    storeName: taskData.storeName,
    itemName: taskData.itemName,
    quantity: parseFloat(taskData.quantity),
    farmer: taskData.farmer || { name: '', category: '' },
    purchasePrice: parseFloat(taskData.purchasePrice) || 0,
    deliveryPrice: parseFloat(taskData.deliveryPrice) || 0,
    deliveryCharges: parseFloat(taskData.deliveryCharges) || 0,
    paymentStatus: 'pending',
    deliveryStatus: 'pending',
    deadline: new Date(taskData.deadline).toISOString(),
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  setItem(FTM_KEYS.TASKS, tasks);

  // If this task was associated with a store demand, update the demand status
  if (taskData.demandId) {
    await updateDemand(taskData.demandId, 'assigned');
  }

  return { success: true, data: newTask };
}

async function updateTask(id, updateData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, data: data.data };
    }
  } catch (err) {
    console.warn("Backend tasks API not reachable, falling back to localStorage", err);
  }

  const tasks = getItem(FTM_KEYS.TASKS) || [];
  const idx = tasks.findIndex(t => t.id === id || t._id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...updateData };
    setItem(FTM_KEYS.TASKS, tasks);
    return { success: true, data: tasks[idx] };
  }
  return { success: false, message: 'Task not found' };
}

async function updateTaskPayment(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${id}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, data: data.data };
    }
  } catch (err) {
    console.warn("Backend tasks API not reachable, falling back to localStorage", err);
  }

  const tasks = getItem(FTM_KEYS.TASKS) || [];
  const idx = tasks.findIndex(t => t.id === id || t._id === id);
  if (idx !== -1) {
    tasks[idx].paymentStatus = 'paid';
    setItem(FTM_KEYS.TASKS, tasks);
    return { success: true, data: tasks[idx] };
  }
  return { success: false, message: 'Task not found' };
}

async function updateTaskDelivery(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${id}/delivery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, data: data.data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (err) {
    console.warn("Backend tasks API not reachable, falling back to localStorage", err);
  }

  const tasks = getItem(FTM_KEYS.TASKS) || [];
  const idx = tasks.findIndex(t => t.id === id || t._id === id);
  if (idx === -1) {
    return { success: false, message: 'Task not found' };
  }

  const task = tasks[idx];

  // 1. Enforce this task is paid first
  if (task.paymentStatus !== 'paid') {
    return {
      success: false,
      message: `Cannot deliver: Payment for "${task.itemName}" (${task.storeName}) must be cleared first.`
    };
  }

  // 2. Enforce that there are no older unpaid tasks for this user
  const uId = (task.assignedUser && typeof task.assignedUser === 'object') ? task.assignedUser.id || task.assignedUser._id : task.assignedUser;
  
  const olderUnpaid = tasks.find(t => {
    const tuId = (t.assignedUser && typeof t.assignedUser === 'object') ? t.assignedUser.id || t.assignedUser._id : t.assignedUser;
    return tuId === uId &&
           t.paymentStatus === 'pending' &&
           new Date(t.createdAt) < new Date(task.createdAt);
  });

  if (olderUnpaid) {
    return {
      success: false,
      message: `Cannot deliver: There is an older unpaid procurement for "${olderUnpaid.itemName}" (${olderUnpaid.storeName}) that must be cleared first.`
    };
  }

  task.deliveryStatus = 'delivered';
  setItem(FTM_KEYS.TASKS, tasks);
  return { success: true, data: task };
}

async function getTaskStats(assignedUser = '') {
  try {
    const url = assignedUser ? `${BACKEND_URL}/api/tasks/stats?assignedUser=${assignedUser}` : `${BACKEND_URL}/api/tasks/stats`;
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok && data.success) {
      return data.data;
    }
  } catch (err) {
    console.warn("Backend stats API not reachable, falling back to localStorage", err);
  }

  const tasks = await getTasks(assignedUser);
  const totalPendingPayments = tasks.filter(t => t.paymentStatus === 'pending').length;
  const totalPendingDeliveries = tasks.filter(t => t.deliveryStatus === 'pending').length;
  const totalCompleted = tasks.filter(t => t.deliveryStatus === 'delivered' && t.paymentStatus === 'paid').length;
  const totalTasks = tasks.length;
  const completionPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return {
    totalPendingPayments,
    totalPendingDeliveries,
    totalCompleted,
    totalTasks,
    completionPercent
  };
}

// ── Reports simulation ───────────────────────────────────────
function submitReport(report) {
  const reports = getItem(FTM_KEYS.SUBMITTED_REPORTS) || [];
  report.id = 'report-' + Date.now();
  report.timestamp = new Date().toISOString();
  reports.unshift(report);
  setItem(FTM_KEYS.SUBMITTED_REPORTS, reports);
  return true;
}

function getAllSubmittedReports() {
  return getItem(FTM_KEYS.SUBMITTED_REPORTS) || [];
}

// ── Profile and Password Management ─────────────────────────
async function updateUserProfile(userId, name, email, phone, gender, age, photo) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, name, email, phone, gender, age, photo })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      // Sync dynamic sessionStorage
      const session = getSession();
      if (session && (session.id === userId || session.email.toLowerCase() === email.toLowerCase())) {
        session.name = data.user.name;
        session.email = data.user.email;
        session.phone = data.user.phone || '';
        session.gender = data.user.gender || '';
        session.age = data.user.age || 25;
        session.photo = data.user.photo || '';
        session.avatar = data.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        setSession(session);
      }

      // Sync local storage fallback list
      const users = getAllUsers();
      const idx = users.findIndex(u => u.id === userId || u.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        users[idx].name = data.user.name;
        users[idx].email = data.user.email;
        users[idx].phone = data.user.phone || '';
        users[idx].gender = data.user.gender || '';
        users[idx].age = data.user.age || 25;
        users[idx].photo = data.user.photo || '';
        users[idx].avatar = data.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        saveUsers(users);
      }
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message || 'Profile update failed.' };
    }
  } catch (err) {
    console.warn("Backend API not reachable, falling back to localStorage", err);
  }

  // Local storage fallback
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return { success: false, message: 'User not found.' };
  }

  // Check email uniqueness if email is changed
  if (email && email.toLowerCase() !== users[idx].email.toLowerCase()) {
    const emailTaken = users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId);
    if (emailTaken) {
      return { success: false, message: 'Email address is already in use.' };
    }
    users[idx].email = email.toLowerCase();
  }

  if (name) users[idx].name = name;
  if (phone !== undefined) users[idx].phone = phone;
  if (gender !== undefined) users[idx].gender = gender;
  if (age !== undefined) users[idx].age = parseInt(age) || 25;
  if (photo !== undefined) users[idx].photo = photo;
  users[idx].avatar = users[idx].name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  saveUsers(users);

  // Sync sessionStorage
  const session = getSession();
  if (session && session.id === userId) {
    session.name = users[idx].name;
    session.email = users[idx].email;
    session.phone = users[idx].phone;
    session.gender = users[idx].gender;
    session.age = users[idx].age;
    session.photo = users[idx].photo;
    session.avatar = users[idx].avatar;
    setSession(session);
  }

  return { success: true, user: users[idx] };
}

async function updateUserPassword(userId, currentPassword, newPassword) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, currentPassword, newPassword })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.message || 'Password update failed.' };
    }
  } catch (err) {
    console.warn("Backend API not reachable, falling back to localStorage", err);
  }

  // Local storage fallback
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return { success: false, message: 'User not found.' };
  }

  const valid = await verifyPassword(currentPassword, users[idx].passwordHash);
  if (!valid) {
    return { success: false, message: 'Incorrect current password.' };
  }

  users[idx].passwordHash = await hashPassword(newPassword);
  saveUsers(users);

  return { success: true, message: 'Password updated successfully.' };
}

async function requestForgotPasswordCode(email) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, code: data.code, message: data.message };
    } else {
      return { success: false, message: data.message || 'Failed to send code.' };
    }
  } catch (err) {
    console.warn("Backend API not reachable, falling back to localStorage", err);
  }

  // Local storage fallback
  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { success: false, message: 'No user registered with this email.' };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = code;
  user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 mins
  saveUsers(users);

  console.log(`\n======================================================`);
  console.log(`[LOCAL SIMULATION] Reset code for ${email}: ${code}`);
  console.log(`======================================================\n`);

  return { success: true, code, message: 'Verification code simulated.' };
}

async function submitForgotPasswordReset(email, code, newPassword) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, code, newPassword })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.message || 'Failed to reset password.' };
    }
  } catch (err) {
    console.warn("Backend API not reachable, falling back to localStorage", err);
  }

  // Local storage fallback
  const users = getAllUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && u.resetCode === code);
  if (idx === -1) {
    return { success: false, message: 'Invalid verification code or email.' };
  }

  if (Date.now() > users[idx].resetCodeExpires) {
    return { success: false, message: 'Verification code has expired.' };
  }

  users[idx].passwordHash = await hashPassword(newPassword);
  users[idx].resetCode = '';
  users[idx].resetCodeExpires = null;
  saveUsers(users);

  return { success: true, message: 'Password has been reset successfully.' };
}
