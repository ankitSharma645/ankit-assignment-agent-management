const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/authMiddleware");
const { validateRegister, validateLogin } = require("../middleware/validators");
const authController = require("../controller/authController");

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/me", auth, authController.getMe);
router.get("/logout", authController.logout);

module.exports = router;
