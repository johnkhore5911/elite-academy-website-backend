const express = require("express");
const router = express.Router();
const { getCourseInfo, createCourseOrder } = require("../controllers/frenchCourseController");

// GET /api/french-course/info - Get course pricing info
router.get("/info", getCourseInfo);

// POST /api/french-course/create-order - Create enrollment and Razorpay order
router.post("/create-order", createCourseOrder);

module.exports = router;
