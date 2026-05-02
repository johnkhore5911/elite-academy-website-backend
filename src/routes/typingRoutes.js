// src/routes/typingRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  getTypingInfo,
  createTypingPurchase,
  getMyTypingPurchases,
  checkTypingAccess,
} = require("../controllers/typingController");

// Get typing course info (public)
router.get("/info", getTypingInfo);

// Create typing purchase - allow guest checkout
router.post("/create-purchase", createTypingPurchase);

// Get my typing purchases (protected)
router.get("/my-purchases", auth, getMyTypingPurchases);

// Check typing access (protected)
router.get("/check-access", auth, checkTypingAccess);

module.exports = router;
