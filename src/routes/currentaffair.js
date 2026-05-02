const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getPDFInfo, createPurchase, getMyPurchases } = require("../controllers/currentaffairController");

// Public route
router.get("/info", getPDFInfo);

// Purchase route - allow guest checkout
router.post("/create-purchase", createPurchase);
router.get("/my-purchases", auth, getMyPurchases);

module.exports = router;

