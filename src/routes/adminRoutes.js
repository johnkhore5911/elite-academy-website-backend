const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth")
// Single route to get all details of all confirmed users (minus passwords)
router.get("/all-confirmed",auth, adminController.getAllConfirmedDetails);
router.get("/all-confirmed-crash-course",auth, adminController.getAllConfirmedDetailsCrashCourse);

module.exports = router;