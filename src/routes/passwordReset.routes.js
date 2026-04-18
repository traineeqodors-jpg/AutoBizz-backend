const express = require("express");
const {
  resetPassword,
  forgotPassword,
  updatePassword,
} = require("../controllers/passwordReset.controller");
const {
  allowOwnerOrEmployee,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/resetPassword", forgotPassword);

router.post("/resetPassword/:token", resetPassword);

router.post(
  "/updatePassword",
  allowOwnerOrEmployee,
  authorizeRoles("sales"),
  updatePassword,
);

module.exports = router;
