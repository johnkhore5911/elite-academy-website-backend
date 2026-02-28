const multer = require("multer");
const path = require("path");

// Configure multer for memory storage (better for Cloudinary)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Resume file types: PDF, DOC, DOCX
const RESUME_MIMES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
];
const resumeFileFilter = (req, file, cb) => {
  if (RESUME_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Resume must be PDF, DOC or DOCX.'), false);
  }
};

const uploadResume = multer({
  storage: multer.memoryStorage(),
  fileFilter: resumeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
module.exports.uploadResume = uploadResume;
