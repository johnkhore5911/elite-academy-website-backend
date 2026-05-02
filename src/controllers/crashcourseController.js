const CrashCourse = require("../models/CrashCourse");
const User = require("../models/User");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo = async (req, res) => {
  res.json({
    package: {
      name: "⏰ Online Crash Course Program",
      price: process.env.CrashCourse_PRICE || 5999,
      originalPrice: 12999,
      description: "Prepare smart with live + recorded classes and 23,000+ PYQs."
    }
  });
};

exports.enrollAndCreateOrder = async (req, res) => {
  try {
    console.log("API hit of enrollAndCreateOrder!!!!!")
    const { fullName, fatherName, mobile, password, email } = req.body;
    const amount = process.env.CrashCourse_PRICE || 5999;

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
      notes: { purchaseType: "crash-course", userEmail: email, userFirebaseUid }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new CrashCourse({
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