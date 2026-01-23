const CrashCourse = require("../models/CrashCourse");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo = async (req, res) => {
  res.json({
    package: {
      name: "⏰ 5 Months Online Crash Course Program starting from 1st Feb",
      price: process.env.CrashCourse_PRICE || 4999,
      originalPrice: 6999,
      description: "Prepare smart with live + recorded classes and 23,000+ PYQs."
    }
  });
};

exports.enrollAndCreateOrder = async (req, res) => {
  try {
    console.log("API hit of enrollAndCreateOrder!!!!!")
    const { fullName, fatherName, mobile, password, email } = req.body;
    const amount = process.env.CrashCourse_PRICE || 4999;

    // 1. Create Razorpay Order
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { purchaseType: "crash-course", userEmail: email }
    };

    const order = await razorpay.orders.create(options);

    // 2. Save Enrollment Data (Pending)
    const newEnrollment = new CrashCourse({
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