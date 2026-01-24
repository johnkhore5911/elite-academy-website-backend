const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getInfo, enrollAndCreateOrder,checkAccess,adminAddEnrollment } = require("../controllers/coachingController");

router.get("/info", getInfo);
// We combine enrollment and purchase into one call for a better UX
router.post("/enroll", auth, enrollAndCreateOrder);

router.post("/admin/add-enrollment", auth, adminAddEnrollment);
router.get("/check-access", checkAccess);

module.exports = router;