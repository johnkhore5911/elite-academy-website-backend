// src/controllers/authController.js

const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * POST /api/auth/sync
 * Syncs Firebase user to MongoDB
 */
const syncUser = async (req, res, next) => {
  try {
    // req.user is set by auth middleware (from Firebase token)
    const { id, email, name, role } = req.user;

    console.log('🔍 Syncing user with Firebase UID:', id);

    // 🔥 SAVE/UPDATE USER IN MONGODB - Using firebaseUid as unique identifier
    const user = await User.findOneAndUpdate(
      { firebaseUid: id }, // Find by Firebase UID (prevents duplicates!)
      {
        firebaseUid: id,
        email: email,
        name: name || email.split('@')[0], // Use email prefix if no name
        role: role || 'user', // Default to 'user'
        signupType: 'google',
      },
      {
        upsert: true, // Create if doesn't exist
        new: true,    // Return updated document
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    console.log('✅ User synced to MongoDB:', {
      mongoId: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: "User synced successfully",
      user: {
        id: user._id.toString(), // MongoDB ID
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Error syncing user:', err);
    next(err);
  }
};

/**
 * POST /api/auth/signup
 * Manual signup with email and password
 */
const manualSignup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      signupType: 'manual',
      role: 'user'
    });

    console.log('✅ User created manually:', {
      mongoId: user._id,
      email: user.email,
      name: user.name
    });

    res.status(201).json({
      success: true,
      message: "Signup successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Error in manual signup:', err);
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Manual login with email and password
 */
const manualLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if user has a password (manual signup)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account was created with Google. Please sign in with Google."
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log('✅ User logged in manually:', {
      mongoId: user._id,
      email: user.email,
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Error in manual login:', err);
    next(err);
  }
};

module.exports = {
  syncUser,
  manualSignup,
  manualLogin,
};
