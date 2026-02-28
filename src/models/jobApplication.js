const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    // Personal Info
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },

    // Job Details
    role: { 
      type: String, 
      enum: ["data-entry", "teacher", "content-creator"], 
      required: true 
    },
    contract: { 
      type: String, 
      enum: ["6month", "9month", "12month"], 
      required: true 
    },
    interviewSlot: { type: String, required: true },
    
    // Resume - Store the URL/Path after uploading to S3/Cloudinary/Firebase
    resumeUrl: { type: String, required: true },

    // Payment Tracking (Crucial for International)
    amount: { type: Number, required: true }, // Store in subunits (e.g., 5000 for $50)
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

    // Technical Expiry for pending payments
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 mins
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index to automatically delete unpaid applications after 30 mins
jobApplicationSchema.index(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);