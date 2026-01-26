// src/routes/coachingRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getLatestClass, createCoachingVideo,getAllClasses,deleteCoachingVideo,updateCoachingVideo } = require("../controllers/videocrashcoachingController");

// Public route to get the video for the student dashboard
router.get("/latest", getLatestClass);

// Protected admin route to upload/set the video ID
router.post("/", auth, createCoachingVideo);
// router.delete("/:id", auth, deleteCoachingVideo); // New delete route

router.get("/all", getAllClasses);

router.put("/update/:id", auth, updateCoachingVideo);
router.delete("/delete/:id", auth, deleteCoachingVideo);
module.exports = router;