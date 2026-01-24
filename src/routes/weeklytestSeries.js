const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getInfo_Online,getInfo_Offline, enrollAndCreateOrderOnline,enrollAndCreateOrderOffline } = require("../controllers/weeklyTestSeries");

router.get("/info-online", getInfo_Online);
router.get("/info-offline", getInfo_Offline);
router.post("/enroll-online", auth, enrollAndCreateOrderOnline);
router.post("/enroll-offline", auth, enrollAndCreateOrderOffline);

module.exports = router;