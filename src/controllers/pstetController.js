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

    // 1. Create Razorpay Order
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { purchaseType: "pstet_ctet", userEmail: email }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new PstetEnrollment({
      userFirebaseUid: req.user.id,
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
