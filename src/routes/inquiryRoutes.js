const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getAllInquiries,
  updateInquiryStatus,
} = require("../controllers/inquiryController");

// POST /api/inquiry - Create new inquiry (public)
router.post("/", createInquiry);

// GET /api/inquiry - Get all inquiries (admin)
router.get("/", getAllInquiries);

// PATCH /api/inquiry/:id/status - Update inquiry status (admin)
router.patch("/:id/status", updateInquiryStatus);

module.exports = router;
