// // src/controllers/coachingController.js
// const Coaching = require("../models/CoachingVideo");

// /**
//  * GET /api/coaching/latest
//  * Returns the most recently created video for the live class
//  */
// const getLatestClass = async (req, res, next) => {
//   try {
//     const latestClass = await Coaching.findOne({ isActive: true })
//       .sort({ createdAt: -1 }); // Get the newest one first

//     if (!latestClass) {
//       return res.status(404).json({ message: "No live classes found" });
//     }

//     res.json(latestClass);
//   } catch (err) {
//     next(err);
//   }
// };

// const getAllClasses = async (req, res, next) => {
//   try {
//     console.log("api called!!!!")
//     // Fetch all active videos, newest first
//     const classes = await Coaching.find({ isActive: true }).sort({ createdAt: -1 });
//     res.json(classes);
//   } catch (err) {
//     next(err);
//   }
// };
// /**
//  * POST /api/coaching
//  * Admin only - Create a new coaching video entry
//  */
// const createCoachingVideo = async (req, res, next) => {
//   try {
//     const { title, description, videoId } = req.body;
    
//     const newVideo = new Coaching({
//       title,
//       description,
//       videoId
//     });

//     await newVideo.save();
//     res.status(201).json(newVideo);
//   } catch (err) {
//     next(err);
//   }
// };


// const updateCoachingVideo = async (req, res, next) => {
//   try {
//     const { role } = req.user;
//     const { id } = req.params;
//     const { title, description, videoId, isActive } = req.body;

//     if (role !== "admin") {
//       return res.status(403).json({ error: "Only admin can update videos" });
//     }

//     const updatedVideo = await Coaching.findByIdAndUpdate(
//       id,
//       { title, description, videoId, isActive },
//       { new: true } // returns the updated document
//     );

//     if (!updatedVideo) {
//       return res.status(404).json({ error: "Video not found" });
//     }

//     res.json(updatedVideo);
//   } catch (err) {
//     next(err);
//   }
// };

// const deleteCoachingVideo = async (req, res, next) => {
//   try {
//     const { role } = req.user;
//     const { id } = req.params;

//     if (role !== "admin") {
//       return res.status(403).json({ error: "Only admin can delete videos" });
//     }

//     const video = await Coaching.findByIdAndDelete(id);

//     if (!video) {
//       return res.status(404).json({ error: "Video not found" });
//     }

//     res.json({ success: true, message: "Coaching video deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };
// module.exports = {
//   getLatestClass,
//   createCoachingVideo,
//   deleteCoachingVideo,
//   getAllClasses,
//   updateCoachingVideo
// };

const Coaching = require("../models/CoachingVideo");

// GET /api/videocoaching/latest-live
// Returns the most recent class with a Google Meet link (for live class page)
const getLatestLiveClass = async (req, res, next) => {
  try {
    const latestClass = await Coaching.findOne({ 
      isActive: true,
      meetingLink: { $exists: true, $ne: null, $ne: "" }
    })
    .sort({ createdAt: -1 });

    if (!latestClass) {
      return res.status(404).json({ message: "No live classes found" });
    }

    res.json(latestClass);
  } catch (err) {
    next(err);
  }
};

// GET /api/videocoaching/all?subject=Maths
const getAllClasses = async (req, res, next) => {
  try {
    const { subject, subSubject } = req.query; // IMPORTANT: use req.query
    let filter = { isActive: true };

    if (subject) filter.subject = subject;
    if (subSubject) filter.subSubject = subSubject;

    const classes = await Coaching.find(filter).sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) {
    next(err);
  }
};

// POST /api/videocoaching/
const createCoachingVideo = async (req, res, next) => {
  try {
    let { subject, subSubject, title, description, videoId, meetingLink } = req.body;
    
    // CLEANUP: Convert empty strings to null so they don't break the Enum validation
    if (!subSubject || subSubject.trim() === "") {
      subSubject = null;
    }

    const newVideo = new Coaching({
      subject,
      subSubject,
      title,
      description,
      videoId,
      meetingLink,
    });

    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (err) {
    next(err); // This will now avoid the Enum validation error
  }
};
// Update lecture (e.g., adding YouTube link after class ends or toggling isActive)
const updateLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedLecture = await Coaching.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedLecture) return res.status(404).json({ error: "Not found" });
    res.json(updatedLecture);
  } catch (err) {
    next(err);
  }
};

const deleteLecture = async (req, res, next) => {
  try {
    await Coaching.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLatestLiveClass, createCoachingVideo, getAllClasses, updateLecture, deleteLecture };