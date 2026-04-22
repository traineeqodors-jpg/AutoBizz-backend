const express = require("express");
const {
  resetPassword,
  forgotPassword,
  updatePassword,
} = require("../controllers/passwordReset.controller");
const { authorizeRoles, verifyJWT } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/resetPassword", forgotPassword);

router.post("/resetPassword/:token", resetPassword);

router.post(
  "/updatePassword",
  verifyJWT,
  updatePassword,
);

module.exports = router;
