const SectionalTestSeries = require("../models/SectionalTestSeries");
const User = require("../models/User");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo_Online = async (req, res) => {
  res.json({
    package: {
      name: "📝 Sectional Test Series - Online Mode",
      price: process.env.SECTIONAL_TEST_PRICE_ONLINE || 3000,
      originalPrice: 5000,
      duration: "3 Months",
      startDate: "7th March 2026",
      description: "Monday-Thursday: Sectional Tests | Friday: Full Mock Test. Complete coverage of all Punjab Government Exams. 3 Months starting from 7th March 2026.",
      features: [
        "3 Months Duration (Starting 7th March 2026)",
        "Monday-Thursday: Subject-wise Sectional Tests",
        "Friday: Full-Length Mock Tests",
        "Covers all Punjab Government Exams",
        "Detailed performance analytics",
        "All India ranking",
        "Solution PDFs for every test"
      ]
    }
  });
};

exports.getInfo_Offline = async (req, res) => {            
  res.json({
    package: {
      name: "📝 Sectional Test Series - Offline Mode",
      duration: "3 Months",
      startDate: "7th March 2026",
      description: "Monday-Thursday: Sectional Tests | Friday: Full Mock Test. Visit our institute to give tests. Call 7696954686 to register.",
      features: [
        "3 Months Duration (Starting 7th March 2026)",
        "Monday-Thursday: Subject-wise Sectional Tests",
        "Friday: Full-Length Mock Tests",
        "Covers all Punjab Government Exams",
        "Give tests at our institute",
        "Instant result & analysis",
        "Solution PDFs for every test"
      ],
      contact: "7696954686",
      address: "Elite Academy, SCO-144 Sector 24D Chandigarh"
    }
  });
};

exports.enrollAndCreateOrderOnline = async (req, res) => {
  try {
    console.log("API hit of enrollAndCreateOrderOnline - Sectional Test Series");
    const { fullName, fatherName, mobile, password, email } = req.body;
    const amount = process.env.SECTIONAL_TEST_PRICE_ONLINE || 3000;

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
      receipt: `rcpt_sectional_${Date.now()}`,
      notes: { purchaseType: "sectional-testseries-online", userEmail: email, userFirebaseUid }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new SectionalTestSeries({
      userFirebaseUid,
      fullName,
      email,
      fatherName,
      mobile,
      appPassword: password,
      amount,
      mode: "online",
      razorpayOrderId: order.id,
      status: "pending"
    });

    await newEnrollment.save();

    res.status(201).json({
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating online sectional test enrollment:", error);
    res.status(500).json({ message: "Error creating enrollment", error: error.message });
  }
};

exports.enrollAndCreateOrderOffline = async (req, res) => {
  try {
    console.log("API hit of enrollAndCreateOrderOffline - Sectional Test Series");
    const { fullName, fatherName, mobile, password, email } = req.body;
    const amount = process.env.SECTIONAL_TEST_PRICE_OFFLINE || 3000;

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
      receipt: `rcpt_sectional_${Date.now()}`,
      notes: { purchaseType: "sectional-testseries-offline", userEmail: email, userFirebaseUid }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new SectionalTestSeries({
      userFirebaseUid,
      fullName,
      email,
      fatherName,
      mobile,
      appPassword: password,
      amount,
      mode: "offline",
      razorpayOrderId: order.id,
      status: "pending"
    });

    await newEnrollment.save();

    res.status(201).json({
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating offline sectional test enrollment:", error);
    res.status(500).json({ message: "Error creating enrollment", error: error.message });
  }
};
