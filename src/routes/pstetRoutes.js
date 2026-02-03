const express = require("express");
const auth = require("../middleware/auth");
const { getInfo, enrollAndCreateOrder } = require("../controllers/pstetController");

const router = express.Router();

// Get PSTET course info
router.get("/info", getInfo);

// Enroll and create order (protected)
router.post("/enroll", auth, enrollAndCreateOrder);

module.exports = router;
