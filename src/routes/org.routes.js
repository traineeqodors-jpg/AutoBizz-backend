const express = require("express");
const {
  registerOrg,
  orgLogin,
  editOrg,
  handleGoogleToken,
  queryForm,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/org.controller.js");
const { validate } = require("../middlewares/vailidation.middleware.js");
const registerSchema = require("../zodSchema/registerSchema.js");
const {
  verifyJWT,
  authorizeRoles,
} = require("../middlewares/auth.middleware.js");
const { uploadImage } = require("../utils/multer.js");
const loginSchema = require("../zodSchema/loginSchema.js");
const contactUsSchema = require("../zodSchema/contactUsSchema.js");
const { updateOrgSchema } = require("../zodSchema/updateOrgSchema.js");
const router = express.Router();

router.post("/register", validate(registerSchema), registerOrg);
router.post("/login", validate(loginSchema), orgLogin);
router.put("/", uploadImage.single("file"), verifyJWT, validate(updateOrgSchema), editOrg);
router.post("/googleToken", verifyJWT, handleGoogleToken);

//Employee
router.get("/employee", verifyJWT, authorizeRoles("owner"), getAllEmployees);
router.post("/employee", verifyJWT, authorizeRoles("owner"), updateEmployee);
router.delete("/employee", verifyJWT, authorizeRoles("owner"), deleteEmployee);

router.post("/queryForm", validate(contactUsSchema), queryForm);

module.exports = router;
