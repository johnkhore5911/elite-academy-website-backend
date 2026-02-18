const express = require("express");
const auth = require("../middleware/auth");
const { getInfo, enrollAndCreateOrder } = require("../controllers/exciseInspectorController");

const router = express.Router();

// Get Excise Inspector course info
router.get("/info", getInfo);

// Enroll and create order (protected)
router.post("/enroll", auth, enrollAndCreateOrder);

module.exports = router;