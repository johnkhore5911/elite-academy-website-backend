const CoachingEnrollment = require("../models/CoachingEnrollment");
const CrashCoachingEnrollment = require("../models/CrashCourse");
const weeklytestSeries = require("../models/WeeklyTestSeries");
const User = require("../models/User");
const Razorpay = require("razorpay");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo = async (req, res) => {
  res.json({
    package: {
      name: "⏰ 5 Months Complete Online Coaching Program starting from 1st Feb",
      price: process.env.COACHING_PRICE || 4999,
      originalPrice: 9999,
      description: "Prepare smart with live + recorded classes and 23,000+ PYQs."
    }
  });
};

exports.enrollAndCreateOrder = async (req, res) => {
  try {
    const { fullName, fatherName, mobile, password, email } = req.body;
    const amount = process.env.COACHING_PRICE || 4999;

    // 1. Create Razorpay Order
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { purchaseType: "coaching", userEmail: email }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new CoachingEnrollment({
      userFirebaseUid: req.user.id,
      fullName,
      email,
      fatherName,
      mobile,
      appPassword: password,
      amount,
      razorpayOrderId: order.id,
      status: "pending"
    });

    await newEnrollment.save();



    res.status(201).json({
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating enrollment", error: error.message });
  }
};

exports.checkAccess = async (req, res) => {
  try {
    console.log("API hit of the checkAccess")
    const { email } = req.query;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({ 
        hasAccess: false, 
        message: "Email parameter is required" 
      });
    }

    // Find enrollment with confirmed status for the given email
    const confirmedEnrollment = await CoachingEnrollment.findOne({
      email: email,
      status: "confirmed"
    });

    // Return access status
    if (confirmedEnrollment) {
      return res.status(200).json({ 
        hasAccess: true,
        message: "Access granted"
      });
    } else {
      return res.status(200).json({ 
        hasAccess: false,
        message: "No confirmed enrollment found"
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      hasAccess: false,
      message: "Error checking access", 
      error: error.message 
    });
  }
};


exports.checkCrashCourseAccess = async (req, res) => {
  try {
    console.log("API hit of the checkAccess")
    const { email } = req.query;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({ 
        hasAccess: false, 
        message: "Email parameter is required" 
      });
    }

    // Find enrollment with confirmed status for the given email
    const confirmedEnrollment = await CrashCoachingEnrollment.findOne({
      email: email,
      status: "confirmed"
    });

    // Return access status
    if (confirmedEnrollment) {
      return res.status(200).json({ 
        hasAccess: true,
        message: "Access granted"
      });
    } else {
      return res.status(200).json({ 
        hasAccess: false,
        message: "No confirmed enrollment found"
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      hasAccess: false,
      message: "Error checking access", 
      error: error.message 
    });
  }
};


exports.adminAddEnrollment = async (req, res) => {
  try {
    const { fullName, fatherName, mobile, password, email, amount } = req.body;

    console.log("🔍 Admin adding enrollment for:", email);

    // Validation
    if (!fullName || !fatherName || !mobile || !password || !email) {
      return res.status(400).json({ 
        message: "All fields are required",
        required: ["fullName", "fatherName", "mobile", "password", "email"]
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Mobile validation (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ 
        message: "Invalid mobile number. Must be 10 digits starting with 6-9" 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    // Check if user already has confirmed enrollment
    const existingEnrollment = await CoachingEnrollment.findOne({
      email: email.toLowerCase(),
      status: "confirmed"
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        message: "User already has a confirmed enrollment",
        enrollmentMode: existingEnrollment.enrollmentMode
      });
    }

    // Check if user already exists in User collection
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log("✅ User already exists, using existing account");
    } else {
      // Create new manual user account
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: fullName,
        signupType: 'manual',
        role: 'user'
      });

      console.log("✅ New user account created:", {
        mongoId: user._id,
        email: user.email,
        name: user.name
      });
    }

    // Create enrollment directly as confirmed (admin mode)
    const newEnrollment = new CoachingEnrollment({
      userFirebaseUid: user._id.toString(),
      fullName,
      email: email.toLowerCase(),
      fatherName,
      mobile,
      appPassword: password,
      amount: amount || process.env.COACHING_PRICE || 4999,
      razorpayOrderId: `admin_${Date.now()}_${user._id}`, // Generate unique dummy order ID
      status: "confirmed",
      enrollmentMode: "admin",
      addedByAdmin: req.user.email,
      expiresAt: null
    });

    await newEnrollment.save();

    console.log(`✅ Admin ${req.user.email} added enrollment for ${email}`);

    res.status(201).json({
      success: true,
      message: "Student enrolled successfully by admin",
      enrollment: {
        id: newEnrollment._id,
        email: newEnrollment.email,
        fullName: newEnrollment.fullName,
        mobile: newEnrollment.mobile,
        status: newEnrollment.status,
        enrollmentMode: newEnrollment.enrollmentMode,
        addedBy: req.user.email,
        amount: newEnrollment.amount
      },
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        wasNewlyCreated: !existingEnrollment
      }
    });

  } catch (error) {
    console.error("❌ Error adding enrollment:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error adding enrollment", 
      error: error.message 
    });
  }
};



exports.admincrashAddEnrollment = async (req, res) => {
  try {
    const { fullName, fatherName, mobile, password, email, amount } = req.body;

    console.log("🔍 Admin adding enrollment for:", email);

    // Validation
    if (!fullName || !fatherName || !mobile || !password || !email) {
      return res.status(400).json({ 
        message: "All fields are required",
        required: ["fullName", "fatherName", "mobile", "password", "email"]
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Mobile validation (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ 
        message: "Invalid mobile number. Must be 10 digits starting with 6-9" 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    // Check if user already has confirmed enrollment
    const existingEnrollment = await CrashCoachingEnrollment.findOne({
      email: email.toLowerCase(),
      status: "confirmed"
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        message: "User already has a confirmed enrollment",
        enrollmentMode: existingEnrollment.enrollmentMode
      });
    }

    // Check if user already exists in User collection
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log("✅ User already exists, using existing account");
    } else {
      // Create new manual user account
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: fullName,
        signupType: 'manual',
        role: 'user'
      });

      console.log("✅ New user account created:", {
        mongoId: user._id,
        email: user.email,
        name: user.name
      });
    }

    // Create enrollment directly as confirmed (admin mode)
    const newEnrollment = new CrashCoachingEnrollment({
      userFirebaseUid: user._id.toString(),
      fullName,
      email: email.toLowerCase(),
      fatherName,
      mobile,
      appPassword: password,
      amount: amount || process.env.COACHING_PRICE || 4999,
      razorpayOrderId: `admin_${Date.now()}_${user._id}`, // Generate unique dummy order ID
      status: "confirmed",
      enrollmentMode: "admin",
      addedByAdmin: req.user.email,
      expiresAt: null
    });

    await newEnrollment.save();

    console.log(`✅ Admin ${req.user.email} added enrollment for ${email}`);

    res.status(201).json({
      success: true,
      message: "Student enrolled successfully by admin",
      enrollment: {
        id: newEnrollment._id,
        email: newEnrollment.email,
        fullName: newEnrollment.fullName,
        mobile: newEnrollment.mobile,
        status: newEnrollment.status,
        enrollmentMode: newEnrollment.enrollmentMode,
        addedBy: req.user.email,
        amount: newEnrollment.amount
      },
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        wasNewlyCreated: !existingEnrollment
      }
    });

  } catch (error) {
    console.error("❌ Error adding enrollment:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error adding enrollment", 
      error: error.message 
    });
  }
};


exports.admincrashAddEnrollment = async (req, res) => {
  try {
    const { fullName, fatherName, mobile, password, email, amount } = req.body;

    console.log("🔍 Admin adding enrollment for:", email);

    // Validation
    if (!fullName || !fatherName || !mobile || !password || !email) {
      return res.status(400).json({ 
        message: "All fields are required",
        required: ["fullName", "fatherName", "mobile", "password", "email"]
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Mobile validation (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ 
        message: "Invalid mobile number. Must be 10 digits starting with 6-9" 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    // Check if user already has confirmed enrollment
    const existingEnrollment = await CrashCoachingEnrollment.findOne({
      email: email.toLowerCase(),
      status: "confirmed"
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        message: "User already has a confirmed enrollment",
        enrollmentMode: existingEnrollment.enrollmentMode
      });
    }

    // Check if user already exists in User collection
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log("✅ User already exists, using existing account");
    } else {
      // Create new manual user account
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: fullName,
        signupType: 'manual',
        role: 'user'
      });

      console.log("✅ New user account created:", {
        mongoId: user._id,
        email: user.email,
        name: user.name
      });
    }

    // Create enrollment directly as confirmed (admin mode)
    const newEnrollment = new CrashCoachingEnrollment({
      userFirebaseUid: user._id.toString(),
      fullName,
      email: email.toLowerCase(),
      fatherName,
      mobile,
      appPassword: password,
      amount: amount || process.env.COACHING_PRICE || 4999,
      razorpayOrderId: `admin_${Date.now()}_${user._id}`, // Generate unique dummy order ID
      status: "confirmed",
      enrollmentMode: "admin",
      addedByAdmin: req.user.email,
      expiresAt: null
    });

    await newEnrollment.save();

    console.log(`✅ Admin ${req.user.email} added enrollment for ${email}`);

    res.status(201).json({
      success: true,
      message: "Student enrolled successfully by admin",
      enrollment: {
        id: newEnrollment._id,
        email: newEnrollment.email,
        fullName: newEnrollment.fullName,
        mobile: newEnrollment.mobile,
        status: newEnrollment.status,
        enrollmentMode: newEnrollment.enrollmentMode,
        addedBy: req.user.email,
        amount: newEnrollment.amount
      },
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        wasNewlyCreated: !existingEnrollment
      }
    });

  } catch (error) {
    console.error("❌ Error adding enrollment:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error adding enrollment", 
      error: error.message 
    });
  }
};

exports.adminweeklyAddEnrollment = async (req, res) => {
  try {
    const { fullName, fatherName, mobile, password, email, amount } = req.body;

    console.log("🔍 Admin adding enrollment for:", email);

    // Validation
    if (!fullName || !fatherName || !mobile || !password || !email) {
      return res.status(400).json({ 
        message: "All fields are required",
        required: ["fullName", "fatherName", "mobile", "password", "email"]
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Mobile validation (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ 
        message: "Invalid mobile number. Must be 10 digits starting with 6-9" 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    // Check if user already has confirmed enrollment
    const existingEnrollment = await weeklytestSeries.findOne({
      email: email.toLowerCase(),
      status: "confirmed"
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        message: "User already has a confirmed enrollment",
        enrollmentMode: existingEnrollment.enrollmentMode
      });
    }

    // Check if user already exists in User collection
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log("✅ User already exists, using existing account");
    } else {
      // Create new manual user account
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: fullName,
        signupType: 'manual',
        role: 'user'
      });

      console.log("✅ New user account created:", {
        mongoId: user._id,
        email: user.email,
        name: user.name
      });
    }

    // Create enrollment directly as confirmed (admin mode)
    const newEnrollment = new weeklytestSeries({
      userFirebaseUid: user._id.toString(),
      fullName,
      email: email.toLowerCase(),
      fatherName,
      mobile,
      appPassword: password,
      amount: amount,
      razorpayOrderId: `admin_${Date.now()}_${user._id}`, // Generate unique dummy order ID
      status: "confirmed",
      enrollmentMode: "admin",
      addedByAdmin: req.user.email,
      expiresAt: null
    });

    await newEnrollment.save();

    console.log(`✅ Admin ${req.user.email} added enrollment for ${email}`);

    res.status(201).json({
      success: true,
      message: "Student enrolled successfully by admin",
      enrollment: {
        id: newEnrollment._id,
        email: newEnrollment.email,
        fullName: newEnrollment.fullName,
        mobile: newEnrollment.mobile,
        status: newEnrollment.status,
        enrollmentMode: newEnrollment.enrollmentMode,
        addedBy: req.user.email,
        amount: newEnrollment.amount
      },
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        wasNewlyCreated: !existingEnrollment
      }
    });

  } catch (error) {
    console.error("❌ Error adding enrollment:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error adding enrollment", 
      error: error.message 
    });
  }
};



exports.checkWeeklyAccess = async (req, res) => {
  try {
    console.log("API hit of the checkAccess")
    const { email } = req.query;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({ 
        hasAccess: false, 
        message: "Email parameter is required" 
      });
    }

    // Find enrollment with confirmed status for the given email
    const confirmedEnrollment = await weeklytestSeries.findOne({
      email: email,
      status: "confirmed"
    });

    // Return access status
    if (confirmedEnrollment) {
      return res.status(200).json({ 
        hasAccess: true,
        message: "Access granted"
      });
    } else {
      return res.status(200).json({ 
        hasAccess: false,
        message: "No confirmed enrollment found"
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      hasAccess: false,
      message: "Error checking access", 
      error: error.message 
    });
  }
};