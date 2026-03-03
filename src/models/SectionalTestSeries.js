const mongoose = require("mongoose");

const SectionalTestSeriesSchema = new mongoose.Schema(
  {
    userFirebaseUid: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    fatherName: { type: String, required: true },
    mobile: { type: String, required: true },
    // Storing plain text as requested, though encryption is usually recommended
    appPassword: { type: String, required: true }, 
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    mode: {
      type: String,
      enum: ["online", "offline"],
      required: true
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 mins to pay
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index to clean up failed/pending attempts
SectionalTestSeriesSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "pending" } });

module.exports = mongoose.model("SectionalTestSeries", SectionalTestSeriesSchema);
