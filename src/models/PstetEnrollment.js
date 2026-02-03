const mongoose = require("mongoose");

const PstetEnrollmentSchema = new mongoose.Schema(
  {
    userFirebaseUid: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    fatherName: { type: String, required: true },
    mobile: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 mins to pay
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index to clean up failed/pending attempts
PstetEnrollmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "pending" } });

module.exports = mongoose.model("PstetEnrollment", PstetEnrollmentSchema);
