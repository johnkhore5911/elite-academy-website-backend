const Inquiry = require("../models/Inquiry");

// Create a new inquiry
const createInquiry = async (req, res) => {
  try {
    const { name, mobile, email, exam } = req.body;

    // Validation
    if (!name || !mobile || !email || !exam) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, mobile, email, exam",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Mobile validation (basic)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number",
      });
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      name: name.trim(),
      mobile: mobile.replace(/\D/g, ''), // Remove non-digits
      email: email.toLowerCase().trim(),
      exam: exam.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully!",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    
    // Handle duplicate email or mobile
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered. Please use a different ${field} or contact us directly.`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit inquiry. Please try again.",
    });
  }
};

// Get all inquiries (for admin)
const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
    });
  }
};

// Update inquiry status
const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "contacted", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inquiry status updated successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inquiry status",
    });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  updateInquiryStatus,
};
