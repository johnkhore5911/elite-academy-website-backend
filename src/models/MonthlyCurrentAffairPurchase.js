const mongoose = require('mongoose');

const PurchaseType = {
  SINGLE: 'single',                    // Individual monthly magazine
  COMPLETE_PACK: 'complete-pack'       // Full year pack
};

const monthlyCurrentAffairPurchaseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String
  },
  
  // Purchase type
  purchaseType: {
    type: String,
    enum: Object.values(PurchaseType),
    required: true
  },
  
  // For single magazine purchases
  month: {
    type: String,
    required: function() {
      return this.purchaseType === PurchaseType.SINGLE;
    }
  },
  
  // For bundle purchases - array of months
  monthsIncluded: [{
    type: String
  }],
  
  // Payment details
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  emailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
monthlyCurrentAffairPurchaseSchema.index({ userId: 1, month: 1 });
monthlyCurrentAffairPurchaseSchema.index({ userId: 1, purchaseType: 1 });
monthlyCurrentAffairPurchaseSchema.index({ orderId: 1 });
monthlyCurrentAffairPurchaseSchema.index({ status: 1 });

module.exports = mongoose.model('MonthlyCurrentAffairPurchase', monthlyCurrentAffairPurchaseSchema);
module.exports.PurchaseType = PurchaseType;
