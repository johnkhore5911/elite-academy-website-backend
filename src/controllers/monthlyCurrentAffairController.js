const Razorpay = require('razorpay');
const MonthlyCurrentAffair = require('../models/MonthlyCurrentAffair');
const MonthlyCurrentAffairPurchase = require('../models/MonthlyCurrentAffairPurchase');
const { PurchaseType } = require('../models/MonthlyCurrentAffairPurchase');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ Get all available monthly magazines
exports.getAllMagazines = async (req, res) => {
  try {
    const magazines = await MonthlyCurrentAffair.find({ 
      isActive: true 
    })
    .sort({ displayOrder: -1, month: -1 })
    .select('-__v');
    
    res.json({ magazines });
  } catch (error) {
    console.error('❌ Error fetching magazines:', error);
    res.status(500).json({ error: 'Failed to fetch magazines' });
  }
};

// ✅ Get info for a specific monthly magazine
exports.getMagazineInfo = async (req, res) => {
  try {
    const { month } = req.params;
    
    const magazine = await MonthlyCurrentAffair.findOne({ 
      month: month.toLowerCase(),
      isActive: true 
    });
    
    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found' });
    }

    res.json({ magazine });
  } catch (error) {
    console.error('❌ Error fetching magazine info:', error);
    res.status(500).json({ error: 'Failed to fetch magazine info' });
  }
};

// ✅ Create purchase for single monthly magazine
exports.createMagazinePurchase = async (req, res) => {
  try {
    const { month } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name || req.user.displayName;

    console.log(`Creating magazine purchase: ${month} for user ${userEmail}`);

    const magazine = await MonthlyCurrentAffair.findOne({ 
      month: month.toLowerCase(),
      isActive: true 
    });
    
    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found' });
    }

    // Check if user already purchased this magazine
    const existingPurchase = await MonthlyCurrentAffairPurchase.findOne({
      userId,
      month: month.toLowerCase(),
      purchaseType: PurchaseType.SINGLE,
      status: 'completed'
    });

    if (existingPurchase) {
      return res.status(400).json({ 
        error: 'You have already purchased this magazine',
        alreadyPurchased: true
      });
    }

    // Create Razorpay order
    const amount = magazine.price * 100;
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `monthly_magazine_${month}_${Date.now()}`,
      notes: {
        purchaseType: 'monthly_magazine',
        purchaseSubType: PurchaseType.SINGLE,
        month: month.toLowerCase(),
        userId: userId.toString(),
        userEmail,
        userName: userName || ''
      }
    });

    // Create purchase record
    const purchase = new MonthlyCurrentAffairPurchase({
      userId,
      userEmail,
      userName,
      purchaseType: PurchaseType.SINGLE,
      month: month.toLowerCase(),
      monthsIncluded: [month.toLowerCase()],
      orderId: order.id,
      amount: magazine.price,
      status: 'pending'
    });

    await purchase.save();

    console.log(`✅ Magazine order created: ${month} for ${userEmail}`);

    res.json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      magazineTitle: magazine.title,
      month: month.toLowerCase()
    });

  } catch (error) {
    console.error('❌ Error creating magazine purchase:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
};

// ✅ Create purchase for complete pack (all available magazines)
exports.createCompletePackPurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name || req.user.displayName;

    console.log(`Creating complete pack purchase for user ${userEmail}`);

    // Get all active magazines
    const magazines = await MonthlyCurrentAffair.find({ 
      isActive: true 
    }).sort({ displayOrder: -1, month: -1 });

    if (magazines.length === 0) {
      return res.status(404).json({ error: 'No magazines available' });
    }

    const monthsIncluded = magazines.map(m => m.month);
    const totalPrice = magazines.reduce((sum, mag) => sum + mag.price, 0);

    // Check if user already has complete pack
    const existingCompletePack = await MonthlyCurrentAffairPurchase.findOne({
      userId,
      purchaseType: PurchaseType.COMPLETE_PACK,
      status: 'completed'
    });

    if (existingCompletePack) {
      return res.status(400).json({ 
        error: 'You have already purchased the complete pack',
        alreadyPurchased: true
      });
    }

    // Check which magazines user already owns
    const existingPurchases = await MonthlyCurrentAffairPurchase.find({
      userId,
      month: { $in: monthsIncluded },
      purchaseType: PurchaseType.SINGLE,
      status: 'completed'
    });

    const ownedMonths = existingPurchases.map(p => p.month);
    const availableMonths = monthsIncluded.filter(month => !ownedMonths.includes(month));

    if (availableMonths.length === 0) {
      return res.status(400).json({ 
        error: 'You already own all available magazines',
        alreadyPurchased: true
      });
    }

    // Calculate price for remaining magazines
    const remainingMagazines = magazines.filter(mag => availableMonths.includes(mag.month));
    const remainingPrice = remainingMagazines.reduce((sum, mag) => sum + mag.price, 0);

    // Create Razorpay order
    const amount = remainingPrice * 100;
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `monthly_complete_pack_${Date.now()}`,
      notes: {
        purchaseType: 'monthly_magazine',
        purchaseSubType: PurchaseType.COMPLETE_PACK,
        monthsIncluded: availableMonths,
        userId: userId.toString(),
        userEmail,
        userName: userName || '',
        magazinesCount: availableMonths.length
      }
    });

    // Create purchase record
    const purchase = new MonthlyCurrentAffairPurchase({
      userId,
      userEmail,
      userName,
      purchaseType: PurchaseType.COMPLETE_PACK,
      month: null,
      monthsIncluded: availableMonths,
      orderId: order.id,
      amount: remainingPrice,
      status: 'pending'
    });

    await purchase.save();

    console.log(`✅ Complete pack order created for ${userEmail}, ${availableMonths.length} magazines`);

    res.json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      magazinesIncluded: availableMonths,
      magazinesCount: availableMonths.length
    });

  } catch (error) {
    console.error('❌ Error creating complete pack purchase:', error);
    res.status(500).json({ error: 'Failed to create complete pack purchase order' });
  }
};

// ✅ Get user's monthly magazine purchases
exports.getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.id;

    const purchases = await MonthlyCurrentAffairPurchase.find({ 
      userId, 
      status: 'completed' 
    }).sort({ createdAt: -1 });

    res.json({ purchases });
  } catch (error) {
    console.error('❌ Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
};

// ✅ Check if user has access to a specific magazine
exports.checkMagazineAccess = async (req, res) => {
  try {
    const { month } = req.params;
    const userId = req.user.id;

    const purchase = await MonthlyCurrentAffairPurchase.findOne({
      userId,
      $or: [
        { month: month.toLowerCase(), purchaseType: PurchaseType.SINGLE },
        { purchaseType: PurchaseType.COMPLETE_PACK, monthsIncluded: month.toLowerCase() }
      ],
      status: 'completed'
    });

    res.json({ hasAccess: !!purchase });
  } catch (error) {
    console.error('❌ Error checking magazine access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
};

// ✅ Get magazine drive link (for users who have access)
exports.getMagazineDriveLink = async (req, res) => {
  try {
    const { month } = req.params;
    const userId = req.user.id;

    // Check if user has access
    const purchase = await MonthlyCurrentAffairPurchase.findOne({
      userId,
      $or: [
        { month: month.toLowerCase(), purchaseType: PurchaseType.SINGLE },
        { purchaseType: PurchaseType.COMPLETE_PACK, monthsIncluded: month.toLowerCase() }
      ],
      status: 'completed'
    });

    if (!purchase) {
      return res.status(403).json({ error: 'Access denied. Please purchase this magazine first.' });
    }

    // Get magazine with drive link
    const magazine = await MonthlyCurrentAffair.findOne({ 
      month: month.toLowerCase(),
      isActive: true 
    }).select('driveLink title');

    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found' });
    }

    res.json({ 
      driveLink: magazine.driveLink,
      title: magazine.title
    });

  } catch (error) {
    console.error('❌ Error getting magazine drive link:', error);
    res.status(500).json({ error: 'Failed to get magazine link' });
  }
};

// module.exports = {
//   getAllMagazines,
//   getMagazineInfo,
//   createMagazinePurchase,
//   createCompletePackPurchase,
//   getMyPurchases,
//   checkMagazineAccess,
//   getMagazineDriveLink
// };
