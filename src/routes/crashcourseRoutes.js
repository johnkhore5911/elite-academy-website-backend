const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getInfo, enrollAndCreateOrder } = require("../controllers/crashcourseController.js");

router.get("/info", getInfo);
// We combine enrollment and purchase into one call for a better UX
router.post("/enroll", enrollAndCreateOrder);

module.exports = router;