const mongoose = require("mongoose");

const coachingSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: ["Maths", "Reasoning", "English", "Punjabi GK", "Punjabi Grammar", "General Knowledge", "Computer", "Current Affairs", "General Studies"]
  },
  subSubject: {
    type: String,
    enum: ["Polity", "Economics", "Geography", "Environment", "Science", "Modern-History", "Ancient-History", "Medieval-History", null],
    default: null
  },
  title: { type: String, required: true },
  description: { type: String },
  videoId: { type: String },      // YouTube Recording
  meetingLink: { type: String },  // Google Meet Live
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("Coaching", coachingSchema);