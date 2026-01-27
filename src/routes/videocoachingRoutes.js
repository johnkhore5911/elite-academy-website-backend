// // src/routes/coachingRoutes.js
// const express = require("express");
// const router = express.Router();
// const auth = require("../middleware/auth");
// const { getLatestClass, createCoachingVideo,deleteCoachingVideo,updateCoachingVideo,getAllClasses } = require("../controllers/videocoachingController");

// // Public route to get the video for the student dashboard
// router.get("/latest", getLatestClass);

// // Protected admin route to upload/set the video ID
// router.post("/", auth, createCoachingVideo);
// // router.delete("/:id", auth, deleteCoachingVideo); // New delete route
// router.put("/update/:id", auth, updateCoachingVideo);   // NEW: Update Route
// router.delete("/delete/:id", auth, deleteCoachingVideo); // NEW: Delete Route

// router.get("/all", getAllClasses);

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Assuming this checks for Admin
const { 
    getLatestLiveClass,
    createCoachingVideo, 
    getAllClasses, 
    updateLecture, 
    deleteLecture 
} = require("../controllers/videocoachingController");

// Student & Admin: Get lectures (can use ?subject=Maths in URL)
router.get("/", getAllClasses);

// Student & Admin: Get latest live class with Google Meet link
router.get("/latest-live", getLatestLiveClass);

// Admin Only: CRUD
router.post("/", auth, createCoachingVideo);
router.put("/:id", auth, updateLecture);
router.delete("/:id", auth, deleteLecture);

module.exports = router;