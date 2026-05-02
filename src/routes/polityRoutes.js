const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getPolityInfo, createPurchase, getMyPurchases } = require("../controllers/polityController");

// Public route
router.get("/info", getPolityInfo);

// Purchase route - allow guest checkout with name/email
router.post("/create-purchase", createPurchase);
router.get("/my-purchases", auth, getMyPurchases);

module.exports = router;
