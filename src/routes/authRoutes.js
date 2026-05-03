const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { syncUser, manualSignup, manualLogin, pyqsLogin } = require("../controllers/authController");

router.post("/sync", auth, syncUser);
router.post("/signup", manualSignup);
router.post("/login", manualLogin);
router.post("/pyqs-login", pyqsLogin);

module.exports = router;
