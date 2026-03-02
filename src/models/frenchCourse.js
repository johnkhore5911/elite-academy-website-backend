const mongoose = require("mongoose");

const frenchCourseSchema = new mongoose.Schema(
  {
    // Personal Info
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },

    // Course Plan
    plan: {
      type: String,
      enum: ["1month", "3month"],
      required: true
    },
    planLabel: { type: String, required: true }, // "1 Month" or "3 Months"

    // Payment Tracking
    amount: { type: Number, required: true }, // Store in main currency units (200 or 500)
    currency: { type: String, default: "USD" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String }, // Populated after webhook/verification
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ["pending", "paid", "confirmed", "failed"],
      default: "pending",
      index: true,
    },

    // Technical Expiry for pending payments (30 mins)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 mins
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index to automatically delete unpaid enrollments after 30 mins
frenchCourseSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("FrenchCourse", frenchCourseSchema);
