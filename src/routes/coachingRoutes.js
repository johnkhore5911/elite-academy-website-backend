const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getInfo, enrollAndCreateOrder,checkAccess,adminAddEnrollment,checkCrashCourseAccess,admincrashAddEnrollment,checkWeeklyAccess,adminweeklyAddEnrollment } = require("../controllers/coachingController");

router.get("/info", getInfo);
// We combine enrollment and purchase into one call for a better UX
router.post("/enroll", auth, enrollAndCreateOrder);

router.post("/admin/add-enrollment", auth, adminAddEnrollment);
router.post("/admin/crash-add-enrollment", auth, admincrashAddEnrollment);
router.post("/admin/weekly-add-enrollment", auth, adminweeklyAddEnrollment);
router.get("/check-access", checkAccess);
router.get("/check-crash-access", checkCrashCourseAccess);
router.get("/check-weekly-access", checkWeeklyAccess);


module.exports = router;