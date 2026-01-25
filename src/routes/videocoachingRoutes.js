// src/routes/coachingRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getLatestClass, createCoachingVideo,deleteCoachingVideo,updateCoachingVideo,getAllClasses } = require("../controllers/videocoachingController");

// Public route to get the video for the student dashboard
router.get("/latest", getLatestClass);

// Protected admin route to upload/set the video ID
router.post("/", auth, createCoachingVideo);
// router.delete("/:id", auth, deleteCoachingVideo); // New delete route
router.put("/update/:id", auth, updateCoachingVideo);   // NEW: Update Route
router.delete("/delete/:id", auth, deleteCoachingVideo); // NEW: Delete Route

router.get("/all", getAllClasses);

module.exports = router;