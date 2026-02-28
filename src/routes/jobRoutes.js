const express = require("express");
const router = express.Router();
const { getJobInfo, createJobOrder } = require("../controllers/jobController");
const { uploadResume } = require("../middleware/mutler");

router.get("/info", getJobInfo);
router.post("/create-order", uploadResume.single("resume"), createJobOrder);

module.exports = router;