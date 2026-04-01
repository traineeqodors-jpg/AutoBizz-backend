const express = require("express");
const {
  registerOrg,
  getAllOrgs,
  userLogin,
  orgLogin,
  orgLogout,
  refreshAccessToken,
  getCurrentOrgDetails,
  editOrg,
  me,
  handleGoogleToken,
} = require("../controllers/org.controller.js");
const { validate } = require("../middlewares/vailidation.middleware.js");
const registerSchema = require("../zodSchema/registerSchema.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { uploads, uploadImage } = require("../utils/multer.js");
const router = express.Router();

router.post("/register", validate(registerSchema), registerOrg);
router.post("/login", orgLogin);
router.put("/", uploadImage.single("file"), verifyJWT, editOrg);
router.post("/logout", verifyJWT, orgLogout);
router.get("/orgDetails", verifyJWT, getCurrentOrgDetails);
router.post("/googleToken", verifyJWT, handleGoogleToken);

router.get("/me", verifyJWT, me);

module.exports = router;
