const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getInfo_Online,
  getInfo_Offline,
  enrollAndCreateOrderOnline,
  enrollAndCreateOrderOffline
} = require("../controllers/sectionalTestSeriesController");

// Public routes - Get pricing info
router.get("/info/online", getInfo_Online);
router.get("/info/offline", getInfo_Offline);

// Protected routes - Create enrollment and order
router.post("/enroll/online", auth, enrollAndCreateOrderOnline);
router.post("/enroll/offline", auth, enrollAndCreateOrderOffline);

module.exports = router;
