const PstetEnrollment = require("../models/PstetEnrollment");
const User = require("../models/User");
const Razorpay = require("razorpay");
const { sendPstetEmail } = require("../utils/email");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo = async (req, res) => {
  res.json({
    package: {
      name: "🎯 PSTET & CTET 1 Month Crash Course starting from 5th Feb",
      price: process.env.PSTET_PRICE || 2999,
      originalPrice: 5999,
      description: "Complete syllabus coverage with live classes on Zoom till exam."
    }
  });
};

exports.enrollAndCreateOrder = async (req, res) => {
  try {
    const { fullName, fatherName, mobile, email } = req.body;
    const amount = process.env.PSTET_PRICE || 2999;

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
      notes: { purchaseType: "pstet_ctet", userEmail: email, userFirebaseUid }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new PstetEnrollment({
      userFirebaseUid,
      fullName,
      email,
      fatherName,
      mobile,
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
