const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Token generation helper
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'farmers_to_mart_secure_token_secret_2026_jwt_auth_key';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

// Register User
// POST /api/auth/signup
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, gender, age, photo, role } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, password).' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create default SVG avatar based on gender if photo not provided
    let finalPhoto = photo;
    if (!finalPhoto) {
      if (gender && gender.toLowerCase() === 'female') {
        finalPhoto = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%23f472b6"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%23db2777"/></svg>`;
      } else {
        finalPhoto = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`;
      }
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      phone: phone || '',
      gender: gender || '',
      age: parseInt(age) || 25,
      photo: finalPhoto,
      online: true // signed up user is online
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        online: newUser.online,
        status: newUser.status
      }
    });

  } catch (error) {
    console.error(`Registration error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// Login User / Admin
// POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide email, password and role.' });
    }

    // Find user and explicitly select password field (which is normally hidden)
    const user = await User.findOne({ email: email.toLowerCase(), role }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check account status
    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Set user online status
    user.online = true;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        online: user.online,
        status: user.status
      }
    });

  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, email, phone, gender, age, photo } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If email is changing, check if it's already taken
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await User.findOne({ email: email.toLowerCase() });
      if (emailTaken) {
        return res.status(400).json({ success: false, message: 'Email address is already in use.' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = parseInt(age) || 25;
    if (photo !== undefined) user.photo = photo;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
        photo: user.photo,
        online: user.online,
        status: user.status
      }
    });
  } catch (error) {
    console.error(`Update profile error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error during profile update.' });
  }
};

// Change Password (from dashboard)
exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error(`Change password error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error during password update.' });
  }
};

// Forgot Password (request code)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email.' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    console.log(`\n======================================================`);
    console.log(`[MAIL SIMULATION] Reset code for ${email}: ${code}`);
    console.log(`======================================================\n`);

    return res.status(200).json({
      success: true,
      code, // return code so UI can show it for testing ease
      message: 'Verification code sent to your email.'
    });
  } catch (error) {
    console.error(`Forgot password error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error during forgot password.' });
  }
};

// Reset Password (verify code and update)
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), resetCode: code });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification code or email.' });
    }

    if (new Date() > user.resetCodeExpires) {
      return res.status(400).json({ success: false, message: 'Verification code has expired.' });
    }

    user.password = newPassword;
    user.resetCode = '';
    user.resetCodeExpires = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error(`Reset password error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
};

// Seed default Platform Admin account
exports.seedAdmin = async () => {
  try {
    // 1. Seed original default admin
    const adminEmail = 'admin@gmail.';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Platform Admin',
        email: adminEmail,
        password: 'admin',
        role: 'admin',
        phone: '9999999999',
        gender: 'Other',
        age: 30,
        photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23b8860b"/><circle cx="50" cy="40" r="20" fill="%23fff"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%23ddd"/></svg>`,
        online: false
      });
      console.log('Seeded platform admin successfully.');
    }

    // 2. Seed custom admin
    const customAdminEmail = 'hemasundarsai@gmail.com';
    const customAdminExists = await User.findOne({ email: customAdminEmail });
    if (!customAdminExists) {
      await User.create({
        name: 'Hema Sundar Sai',
        email: customAdminEmail,
        password: 'hemasundar',
        role: 'admin',
        phone: '9876543210',
        gender: 'Male',
        age: 26,
        photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23b8860b"/><circle cx="50" cy="40" r="20" fill="%23fff"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%23ddd"/></svg>`,
        online: false
      });
      console.log('Seeded custom admin successfully.');
    }

    // 3. Seed custom user
    const customUserEmail = 'user1@user.com';
    const customUserExists = await User.findOne({ email: customUserEmail });
    if (!customUserExists) {
      await User.create({
        name: 'Test Consumer',
        email: customUserEmail,
        password: 'user@123',
        role: 'user',
        phone: '9876543211',
        gender: 'Male',
        age: 28,
        photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`,
        online: false
      });
      console.log('Seeded custom user successfully.');
    }
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
  }
};
