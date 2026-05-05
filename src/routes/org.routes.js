const express = require("express");

const { validate } = require("../middlewares/vailidation.middleware.js");
const {
  verifyJWT,
  authorizeRoles,
} = require("../middlewares/auth.middleware.js");

const {
  registerOrg,
  orgLogin,
  editOrg,
  handleGoogleToken,
  queryForm,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  updateOnboarding,
} = require("../controllers/org.controller.js");

const registerSchema = require("../zodSchema/registerSchema.js");
const loginSchema = require("../zodSchema/loginSchema.js");
const contactUsSchema = require("../zodSchema/contactUsSchema.js");
const { updateOrgSchema } = require("../zodSchema/updateOrgSchema.js");

const { uploadImage } = require("../utils/multer.js");

const router = express.Router();

// Register Organizaion
router.post("/register", validate(registerSchema), registerOrg);

// Login Organization
router.post("/login", validate(loginSchema), orgLogin);

// Update Org Details
router.put(
  "/",
  verifyJWT,
  uploadImage.single("file"),
  validate(updateOrgSchema),
  editOrg,
);

// Google Login
router.post("/googleToken", verifyJWT, handleGoogleToken);

// Update OnBoarding
router.put("/updateonboard", verifyJWT, updateOnboarding);

//Employee

// Get All Employees Data
router.get("/employee", verifyJWT, authorizeRoles("owner"), getAllEmployees);

// Update Employee
router.post("/employee", verifyJWT, authorizeRoles("owner"), updateEmployee);

// Delete Employe
router.delete("/employee", verifyJWT, authorizeRoles("owner"), deleteEmployee);

// Contact-Us
router.post("/queryForm", validate(contactUsSchema), queryForm);

module.exports = router;
