const express = require("express");

const { verifyJWT } = require("../middlewares/auth.middleware");

const {
  resetPassword,
  forgotPassword,
  updatePassword,
} = require("../controllers/passwordReset.controller");

const router = express.Router();

// Forget Password
router.post("/resetPassword", forgotPassword);

// Reset Password
router.post("/resetPassword/:token", resetPassword);

// Update Password
router.post("/updatePassword", verifyJWT, updatePassword);

module.exports = router;
