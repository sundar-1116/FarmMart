const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Token generation helper - fails safely if secret is missing
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET configuration is missing');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Register User
// POST /api/auth/signup
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, gender, age, photo } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, password).' });
    }

    // Strengthen password policy check
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
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

    // Validate requested role: only allow 'buyer' or 'farmer' for public registration
    const { role } = req.body;
    if (role && !['buyer', 'farmer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid signup role. Only buyer or farmer roles are permitted.' });
    }

    const assignedRole = role || 'buyer';

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      phone: phone || '',
      gender: gender || '',
      age: parseInt(age) || 25,
      photo: finalPhoto,
      online: true
    });

    const token = generateToken(newUser._id);

    // Security Logging
    console.log(`[SECURITY] Successful signup for email: ${newUser.email} - Role assigned: ${newUser.role}`);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        photo: newUser.photo,
        online: newUser.online,
        status: newUser.status
      }
    });

  } catch (error) {
    next(error);
  }
};

// Login User / Admin
// POST /api/auth/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide email, password and role.' });
    }

    // Find user and explicitly select password field (which is normally hidden)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      // Security Logging for failed login
      console.warn(`[SECURITY] Failed login attempt for email: ${email} - Reason: User not found`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Role consistency check - verifies submitted role matches database role, never grants privileges based on request payload
    if (role && user.role !== role) {
      console.warn(`[SECURITY] Failed login attempt for email: ${email} - Reason: Role mismatch (submitted: ${role}, actual: ${user.role})`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check account status
    if (user.status === 'inactive') {
      console.warn(`[SECURITY] Forbidden login attempt for email: ${email} - Reason: Deactivated account`);
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Security Logging for failed login
      console.warn(`[SECURITY] Failed login attempt for email: ${email} - Reason: Incorrect password`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Set user online status
    user.online = true;
    await user.save();

    const token = generateToken(user._id);

    // Security Logging for successful login
    console.log(`[SECURITY] Successful login for email: ${user.email} - Role: ${user.role}`);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        online: user.online,
        status: user.status
      }
    });

  } catch (error) {
    next(error);
  }
};

// Update Profile (protected, req.user holds the authenticated identity)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, gender, age, photo } = req.body;

    // Resolve identity from authenticated session, not request body
    const userId = req.user.id;

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

    // Explicitly do NOT update user.role from body to prevent role elevation.
    // It remains exactly as stored in database.

    await user.save();

    console.log(`[SECURITY] User profile updated successfully for user ID: ${user._id}`);

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
    next(error);
  }
};

// Change Password (protected, req.user holds authenticated identity)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Strengthen password policy check
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    // Resolve identity from authenticated session, not request body
    const userId = req.user.id;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.warn(`[SECURITY] Unauthorized password change attempt for user ID: ${userId} - Reason: Incorrect current password`);
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    console.log(`[SECURITY] Password changed successfully for user ID: ${userId}`);

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Forgot Password (request code)
// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return 200/success anyway to prevent user enumeration attacks
      return res.status(200).json({
        success: true,
        message: 'If the email is registered, a reset code has been sent.'
      });
    }

    // Generate cryptographically secure 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();

    // Store only a secure SHA-256 hash of the code in the database
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    user.resetCode = hashedCode;
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Security Logging
    console.log(`[SECURITY] Password reset code generated and hashed for user: ${email}`);

    // In a real application, the code is sent to the user via email.
    // For this security milestone:
    // 1. DO NOT return the reset code in the API response.
    // 2. DO NOT print/log the reset code to the logs.
    // This is a documented milestone limitation (email integration in future milestone).

    return res.status(200).json({
      success: true,
      message: 'If the email is registered, a reset code has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password (verify code and update)
// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Strengthen password policy check
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Hash the input code before comparing with database record
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({ email: email.toLowerCase(), resetCode: hashedCode });
    if (!user) {
      console.warn(`[SECURITY] Password reset attempt failed for: ${email} - Reason: Invalid code`);
      return res.status(400).json({ success: false, message: 'Invalid verification code or email.' });
    }

    if (new Date() > user.resetCodeExpires) {
      console.warn(`[SECURITY] Password reset attempt failed for: ${email} - Reason: Expired code`);
      return res.status(400).json({ success: false, message: 'Verification code has expired.' });
    }

    // Update password, clear reset fields
    user.password = newPassword;
    user.resetCode = '';
    user.resetCodeExpires = null;
    await user.save();

    console.log(`[SECURITY] Password reset successfully completed for user: ${email}`);

    return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
};

// Seed default Platform Admin account using environment variables (no hardcoded passwords)
exports.seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Seeding skipped: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are not set.');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!adminExists) {
      await User.create({
        name: 'Platform Admin',
        email: adminEmail.toLowerCase(),
        password: adminPassword, // will be hashed automatically by userSchema pre-save hook
        role: 'admin',
        phone: '9999999999',
        gender: 'Other',
        age: 30,
        photo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23b8860b"/><circle cx="50" cy="40" r="20" fill="%23fff"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%23ddd"/></svg>`,
        online: false
      });
      console.log(`[SECURITY] Seeded platform admin: ${adminEmail.toLowerCase()}`);
    }
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
  }
};

// Get Profile details of authenticated user
// GET /api/auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
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
    next(error);
  }
};
