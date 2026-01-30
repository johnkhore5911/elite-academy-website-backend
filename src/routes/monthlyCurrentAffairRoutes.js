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

// User routes - authentication required
router.post('/purchase/complete-pack', auth, createCompletePackPurchase);
router.post('/purchase/:month', auth, createMagazinePurchase);
router.get('/my/purchases', auth, getMyPurchases);
router.get('/access/:month', auth, checkMagazineAccess);
router.get('/download/:month', auth, getMagazineDriveLink);

module.exports = router;
