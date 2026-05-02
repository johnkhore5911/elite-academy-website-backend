const express = require('express');
const {
  getAllMagazines,
  getMagazineInfo,
  createMagazinePurchase,
  createCompletePackPurchase,
  getMyPurchases,
  checkMagazineAccess,
  getMagazineDriveLink
} = require('../controllers/monthlyCurrentAffairController');
const auth = require("../middleware/auth");

const router = express.Router();

// Public routes - no authentication required
router.get('/', getAllMagazines);
router.get('/:month', getMagazineInfo);

// User routes - public purchase flow, auth only for account-specific access endpoints
router.post('/purchase/complete-pack', createCompletePackPurchase);
router.post('/purchase/:month', createMagazinePurchase);
router.get('/my/purchases', auth, getMyPurchases);
router.get('/access/:month', auth, checkMagazineAccess);
router.get('/download/:month', auth, getMagazineDriveLink);

module.exports = router;
