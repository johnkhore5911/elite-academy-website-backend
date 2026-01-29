const mongoose = require('mongoose');

const monthlyCurrentAffairSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    unique: true, // e.g., "jan2026", "feb2026"
    lowercase: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  features: [{
    type: String,
    required: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  driveLink: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
monthlyCurrentAffairSchema.index({ month: 1 });
monthlyCurrentAffairSchema.index({ isActive: 1 });
monthlyCurrentAffairSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('MonthlyCurrentAffair', monthlyCurrentAffairSchema);
