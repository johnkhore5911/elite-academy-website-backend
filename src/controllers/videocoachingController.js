// src/controllers/coachingController.js
const Coaching = require("../models/CoachingVideo");

/**
 * GET /api/coaching/latest
 * Returns the most recently created video for the live class
 */
const getLatestClass = async (req, res, next) => {
  try {
    const latestClass = await Coaching.findOne({ isActive: true })
      .sort({ createdAt: -1 }); // Get the newest one first

    if (!latestClass) {
      return res.status(404).json({ message: "No live classes found" });
    }

    res.json(latestClass);
  } catch (err) {
    next(err);
  }
};

const getAllClasses = async (req, res, next) => {
  try {
    console.log("api called!!!!")
    // Fetch all active videos, newest first
    const classes = await Coaching.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) {
    next(err);
  }
};
/**
 * POST /api/coaching
 * Admin only - Create a new coaching video entry
 */
const createCoachingVideo = async (req, res, next) => {
  try {
    const { title, description, videoId } = req.body;
    
    const newVideo = new Coaching({
      title,
      description,
      videoId
    });

    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (err) {
    next(err);
  }
};


const deleteCoachingVideo = async (req, res, next) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    // Verify admin role (consistent with your slotController logic)
    if (role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete videos" });
    }

    const video = await Coaching.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({ success: true, message: "Coaching video deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLatestClass,
  createCoachingVideo,
  deleteCoachingVideo,
  getAllClasses
};