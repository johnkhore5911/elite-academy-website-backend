const express = require('express');
const auth = require("../middleware/auth");

const {
  createMagazine,
  updateMagazine,
  deleteMagazine,
  getAllMagazinesAdmin,
  getMagazineAdmin,
  getAllPurchasesAdmin,
  getDashboardStats
} = require('../controllers/adminMonthlyCurrentAffairController');

const router = express.Router();


// Magazine management
router.post('/magazines',auth, createMagazine);
router.get('/magazines',auth, getAllMagazinesAdmin);
router.get('/magazines/:month',auth, getMagazineAdmin);
router.put('/magazines/:month',auth, updateMagazine);
router.delete('/magazines/:month',auth, deleteMagazine);

// Purchase management
router.get('/purchases',auth, getAllPurchasesAdmin);

// Dashboard
router.get('/dashboard/stats',auth, getDashboardStats);

module.exports = router;
