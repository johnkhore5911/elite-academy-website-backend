const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { syncUser, manualSignup, manualLogin } = require("../controllers/authController");

router.post("/sync", auth, syncUser);
router.post("/signup", manualSignup);
router.post("/login", manualLogin);

module.exports = router;
