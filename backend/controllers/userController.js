const User = require('../models/User');
const mongoose = require('mongoose');

// GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('_id name email role photo phone gender age createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const user = await User.findById(id)
      .select('_id name email role photo phone gender age createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const { role } = req.body;
    if (!role || !['buyer', 'farmer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Role must be admin, buyer, or farmer' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Final admin protection
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Demotion denied: Cannot remove the final administrator'
        });
      }
    }

    // 2. Self-demotion protection
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Self-demotion denied: You cannot change your own administrative role'
      });
    }

    user.role = role;
    await user.save();

    // safe projected output
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      phone: user.phone,
      gender: user.gender,
      age: user.age,
      createdAt: user.createdAt
    };

    return res.status(200).json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
};
