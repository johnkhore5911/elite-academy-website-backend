// src/models/Coaching.js
const mongoose = require("mongoose");

const crashcoachingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Live Class", // Optional title
    },
    description: {
      type: String,
      trim: true, // Optional description
    },
    videoId: {
      type: String,
      required: true, // The YouTube ID is mandatory
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Useful to toggle visibility without deleting
    },
  },
  { 
    // This automatically creates 'createdAt' and 'updatedAt' fields
    timestamps: true 
  }
);

module.exports = mongoose.model("CrashCoaching", crashcoachingSchema);