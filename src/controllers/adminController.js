const CoachingEnrollment = require("../models/CoachingEnrollment");

/**
 * Fetch all confirmed enrollments with full details
 * Excludes appPassword for security
 */
exports.getAllConfirmedDetails = async (req, res) => {
  try {
    // 1. Filter by "confirmed" status
    // 2. .select("-appPassword") removes the password from the results
    // 3. .sort("-createdAt") puts the newest users at the top
    const confirmedUsers = await CoachingEnrollment.find({ status: "confirmed" })
      .select("-appPassword") 
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: confirmedUsers.length,
      users: confirmedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve enrollment details",
      error: error.message
    });
  }
};