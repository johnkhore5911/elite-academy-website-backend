const MonthlyCurrentAffair = require('../models/MonthlyCurrentAffair');
const MonthlyCurrentAffairPurchase = require('../models/MonthlyCurrentAffairPurchase');

// ✅ Admin: Create new monthly magazine
exports.createMagazine = async (req, res) => {
  try {
    const { month, title, features, price, driveLink, isActive = true, displayOrder = 0 } = req.body;

    // Validate required fields
    if (!month || !title || !features || !Array.isArray(features) || !price || !driveLink) {
      return res.status(400).json({ 
        error: 'Missing required fields: month, title, features (array), price, driveLink' 
      });
    }

    // Check if magazine with this month already exists
    const existingMagazine = await MonthlyCurrentAffair.findOne({ 
      month: month.toLowerCase() 
    });

    if (existingMagazine) {
      return res.status(400).json({ 
        error: 'Magazine for this month already exists' 
      });
    }

    // Create new magazine
    const magazine = new MonthlyCurrentAffair({
      month: month.toLowerCase(),
      title: title.trim(),
      features: features.map(f => f.trim()).filter(f => f),
      price: Number(price),
      driveLink: driveLink.trim(),
      isActive,
      displayOrder: Number(displayOrder)
    });

    await magazine.save();

    console.log(`✅ Admin created magazine: ${month} - ${title}`);

    res.status(201).json({ 
      message: 'Magazine created successfully',
      magazine 
    });

  } catch (error) {
    console.error('❌ Error creating magazine:', error);
    res.status(500).json({ error: 'Failed to create magazine' });
  }
};

// ✅ Admin: Update existing magazine
exports.updateMagazine = async (req, res) => {
  try {
    const { month } = req.params;
    const { title, features, price, driveLink, isActive, displayOrder } = req.body;

    const magazine = await MonthlyCurrentAffair.findOne({ 
      month: month.toLowerCase() 
    });

    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found' });
    }

    // Update fields
    if (title !== undefined) magazine.title = title.trim();
    if (features !== undefined) {
      if (!Array.isArray(features)) {
        return res.status(400).json({ error: 'Features must be an array' });
      }
      magazine.features = features.map(f => f.trim()).filter(f => f);
    }
    if (price !== undefined) magazine.price = Number(price);
    if (driveLink !== undefined) magazine.driveLink = driveLink.trim();
    if (isActive !== undefined) magazine.isActive = Boolean(isActive);
    if (displayOrder !== undefined) magazine.displayOrder = Number(displayOrder);

    await magazine.save();

    console.log(`✅ Admin updated magazine: ${month}`);

    res.json({ 
      message: 'Magazine updated successfully',
      magazine 
    });

  } catch (error) {
    console.error('❌ Error updating magazine:', error);
    res.status(500).json({ error: 'Failed to update magazine' });
  }
};

// ✅ Admin: Delete magazine
exports.deleteMagazine = async (req, res) => {
  try {
    const { month } = req.params;

    const magazine = await MonthlyCurrentAffair.findOne({ 
      month: month.toLowerCase() 
    });

    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found' });
    }

    // Check if there are any purchases for this magazine
    const purchaseCount = await MonthlyCurrentAffairPurchase.countDocuments({
      $or: [
        { month: month.toLowerCase() },
        { monthsIncluded: month.toLowerCase() }
      ],
      status: 'completed'
    });

    if (purchaseCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete magazine. ${purchaseCount} users have purchased this magazine. Consider deactivating it instead.` 
      });
    }

    await MonthlyCurrentAffair.deleteOne({ month: month.toLowerCase() });

    console.log(`✅ Admin deleted magazine: ${month}`);

    res.json({ message: 'Magazine deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting magazine:', error);
    res.status(500).json({ error: 'Failed to delete magazine' });
  }
};

// ✅ Admin: Get all magazines (including inactive)
exports.getAllMagazinesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const magazines = await MonthlyCurrentAffair.find(filter)
      .sort({ displayOrder: -1, month: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await MonthlyCurrentAffair.countDocuments(filter);

    res.json({ 
      magazines,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalMagazines: total,
        limit: Number(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin magazines:', error);
    res.status(500).json({ error: 'Failed to fetch magazines' });
  }
};

// ✅ Admin: Get single magazine details
exports.getMagazineAdmin = async (req, res) => {
  try {
    const { month } = req.params;

    const magazine = await MonthlyCurrentAffair.findOne({ 
      month: month.toLowerCase() 
    });

    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found' });
    }

    // Get purchase statistics
    const stats = await MonthlyCurrentAffairPurchase.aggregate([
      {
        $match: {
          $or: [
            { month: month.toLowerCase() },
            { monthsIncluded: month.toLowerCase() }
          ],
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$purchaseType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    res.json({ 
      magazine,
      stats: {
        totalPurchases: stats.reduce((sum, s) => sum + s.count, 0),
        totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
        breakdown: stats
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin magazine:', error);
    res.status(500).json({ error: 'Failed to fetch magazine' });
  }
};

// ✅ Admin: Get all purchases
exports.getAllPurchasesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, purchaseType, month } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (purchaseType) filter.purchaseType = purchaseType;
    if (month) {
      filter.$or = [
        { month: month.toLowerCase() },
        { monthsIncluded: month.toLowerCase() }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const purchases = await MonthlyCurrentAffairPurchase.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await MonthlyCurrentAffairPurchase.countDocuments(filter);

    res.json({ 
      purchases,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalPurchases: total,
        limit: Number(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
};

// ✅ Admin: Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total magazines
    const totalMagazines = await MonthlyCurrentAffair.countDocuments();
    const activeMagazines = await MonthlyCurrentAffair.countDocuments({ isActive: true });

    // Total purchases and revenue
    const purchaseStats = await MonthlyCurrentAffairPurchase.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          singlePurchases: {
            $sum: { $cond: [{ $eq: ['$purchaseType', 'single'] }, 1, 0] }
          },
          packPurchases: {
            $sum: { $cond: [{ $eq: ['$purchaseType', 'complete-pack'] }, 1, 0] }
          }
        }
      }
    ]);

    // Recent purchases
    const recentPurchases = await MonthlyCurrentAffairPurchase.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('userId userEmail userName purchaseType month monthsIncluded amount createdAt');

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await MonthlyCurrentAffairPurchase.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          purchases: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    const stats = purchaseStats[0] || {
      totalPurchases: 0,
      totalRevenue: 0,
      singlePurchases: 0,
      packPurchases: 0
    };

    res.json({
      overview: {
        totalMagazines,
        activeMagazines,
        totalPurchases: stats.totalPurchases,
        totalRevenue: stats.totalRevenue,
        singlePurchases: stats.singlePurchases,
        packPurchases: stats.packPurchases
      },
      recentPurchases,
      monthlyRevenue
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// module.exports = {
//   createMagazine,
//   updateMagazine,
//   deleteMagazine,
//   getAllMagazinesAdmin,
//   getMagazineAdmin,
//   getAllPurchasesAdmin,
//   getDashboardStats
// };
