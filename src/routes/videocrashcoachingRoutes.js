// src/routes/videocrashcoachingRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Assuming this checks for Admin
const { 
    getLatestLiveClass,
    createCoachingVideo, 
    getAllClasses, 
    updateLecture, 
    deleteLecture 
} = require("../controllers/videocrashcoachingController");

// Student & Admin: Get lectures (can use ?subject=Maths in URL)
router.get("/", getAllClasses);

// Student & Admin: Get latest live class with Google Meet link
router.get("/latest-live", getLatestLiveClass);

// Admin Only: CRUD
router.post("/", auth, createCoachingVideo);
router.put("/:id", auth, updateLecture);
router.delete("/:id", auth, deleteLecture);

module.exports = router;