const mongoose = require('mongoose');

const pyqsPurchaseSchema = new mongoose.Schema(
  {
    userFirebaseUid: { type: String },
    fullName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    fatherName: { type: String, required: true },
    mobile: { type: String, required: true },
    appPassword: { type: String, required: true }, // stored in plain text per request
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', index: true },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000), index: true }
  },
  { timestamps: true }
);

pyqsPurchaseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'pending' } });

module.exports = require('mongoose').model('PyqsPurchase', pyqsPurchaseSchema);
