const WeeklyTestSeries = require("../models/WeeklyTestSeries");
const User = require("../models/User");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo_Online = async (req, res) => {
  res.json({
    package: {
      name: "⏰ Total 12 Mock test series every sunday starting from 1st Feb till 1st May",
      price: process.env.WeeklyTest_PRICE_Online || 899,
      originalPrice: 599,
      description: "Stay exam-ready with weekly full-length mock tests, detailed performance analytics."
    }
  });
};

exports.getInfo_Offline = async (req, res) => {
  res.json({
    package: {
      name: "⏰ Total 12 Mock test series every sunday starting from 1st Feb till 1st May",
      price: process.env.WeeklyTest_PRICE_Offline || 899,
      originalPrice: 799,
      description: "Stay exam-ready with weekly full-length mock tests, detailed performance analytics."
    }
  });
};

exports.enrollAndCreateOrderOnline = async (req, res) => {
  try {
    console.log("API hit of enrollAndCreateOrder!!!!!")
    const { fullName, fatherName, mobile, password, email } = req.body;
    const amount = process.env.WeeklyTest_PRICE_Online || 1299;

    // Determine user association (support unauthenticated requests)
    let userFirebaseUid = null;
    if (req.user && req.user.id) {
      userFirebaseUid = req.user.id;
    } else if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) userFirebaseUid = existingUser._id.toString();
    }

    // 1. Create Razorpay Order (include userFirebaseUid in notes)
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { purchaseType: "weekly-testseries-online", userEmail: email, userFirebaseUid }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new WeeklyTestSeries({
      userFirebaseUid,
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


exports.enrollAndCreateOrderOffline = async (req, res) => {
  try {
    console.log("API hit of enrollAndCreateOrder!!!!!")
    const { fullName, fatherName, mobile, password, email } = req.body;
    const amount = process.env.WeeklyTest_PRICE_Offline || 1299;

    // Determine user association (support unauthenticated requests)
    let userFirebaseUid = null;
    if (req.user && req.user.id) {
      userFirebaseUid = req.user.id;
    } else if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) userFirebaseUid = existingUser._id.toString();
    }

    // 1. Create Razorpay Order (include userFirebaseUid in notes)
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { purchaseType: "weekly-testseries-offline", userEmail: email, userFirebaseUid }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new WeeklyTestSeries({
      userFirebaseUid,
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