// src/routes/coachingRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getLatestClass, createCoachingVideo,deleteCoachingVideo,getAllClasses } = require("../controllers/videocoachingController");

// Public route to get the video for the student dashboard
router.get("/latest",auth, getLatestClass);

// Protected admin route to upload/set the video ID
router.post("/", auth, createCoachingVideo);
// router.delete("/:id", auth, deleteCoachingVideo); // New delete route

router.get("/all", auth, getAllClasses);

module.exports = router;