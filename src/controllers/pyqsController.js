const Razorpay = require('razorpay');
const PyqsPurchase = require('../models/PyqsPurchase');
const User = require('../models/User');
const { sendPyqsEmail } = require('../utils/email');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getInfo = async (req, res) => {
  try {
    const price = Number(process.env.PYQS_PRICE) || 499;
    res.json({ price });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching info' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { fullName, fatherName, email, mobile, password } = req.body;
    const amount = Number(process.env.PYQS_PRICE) || 499;

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `pyqs_${Date.now()}`,
      notes: { purchaseType: 'pyqs_book', userEmail: email }
    };

    const order = await razorpay.orders.create(options);

    const newPurchase = new PyqsPurchase({
      fullName,
      fatherName,
      email,
      mobile,
      appPassword: password,
      amount,
      razorpayOrderId: order.id,
      status: 'pending'
    });

    await newPurchase.save();

    res.status(201).json({ order, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Error creating pyqs order', err);
    res.status(500).json({ message: 'Error creating order' });
  }
};

exports.checkAccess = async (req, res) => {
  try {
    const { email } = req.query;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, hasAccess: false, message: 'email query is required' });
    }

    const purchase = await PyqsPurchase.findOne({
      email: normalizedEmail,
      status: 'confirmed'
    }).select('_id email status updatedAt');

    res.json({
      success: true,
      hasAccess: !!purchase,
      email: normalizedEmail
    });
  } catch (err) {
    console.error('Error checking pyqs access:', err);
    res.status(500).json({ success: false, hasAccess: false });
  }
};
