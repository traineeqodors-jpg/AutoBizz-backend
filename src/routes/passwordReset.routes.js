const express = require("express");
const { resetPassword, forgotPassword } = require("../controllers/passwordReset.controller");
const router = express.Router();


router.post("/resetPassword" , forgotPassword);
router.post("/resetPassword/:token" , resetPassword);

module.exports = router
