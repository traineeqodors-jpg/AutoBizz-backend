const express = require("express");
const router = express.Router();
const {
  createEmployee,
  setupEmployeePassword,
  loginEmployee,
} = require("../controllers/employee.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/vailidation.middleware");
const employeeSchema = require("../zodSchema/employeeSchema");
const setupPasswordSchema = require("../zodSchema/setupPasswordSchema");

router.post(
  "/create",
  verifyJWT("organization"),
  validate(employeeSchema),
  createEmployee,
);
router.post(
  "/setup-password",
  validate(setupPasswordSchema),
  setupEmployeePassword,
);

router.post("/login", loginEmployee);

module.exports = router;
