const ExciseInspectorEnrollment = require("../models/ExciseInspectorEnrollment");
const User = require("../models/User");
const Razorpay = require("razorpay");
const { sendExciseInspectorEmail } = require("../utils/email");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo = async (req, res) => {
  console.log("getInfo api hit!!")
  res.json({
    package: {
      name: "🎯 Excise Inspector Exam - Complete Strategy Session",
      price: process.env.EXCISE_INSPECTOR_PRICE || 99,
      originalPrice: 299,
      description: "Live strategy session on 1st March (Sunday) with complete roadmap to crack the Excise Inspector exam."
    }
  });
};

exports.enrollAndCreateOrder = async (req, res) => {
  try {
    const { fullName, mobile, email } = req.body;
    const amount = process.env.EXCISE_INSPECTOR_PRICE || 99;
    console.log("enrollAndCreateOrder api hit!!")
    // 1. Create Razorpay Order
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { purchaseType: "excise-inspector", userEmail: email }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new ExciseInspectorEnrollment({
      userFirebaseUid: req.user.id,
      fullName,
      email,
      mobile,
      amount,
      razorpayOrderId: order.id,
      status: "pending"
    });

    await newEnrollment.save();
    console.log("enrollment saved!!")

    res.status(201).json({
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating enrollment", error: error.message });
  }
};
