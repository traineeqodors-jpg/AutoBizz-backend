const express = require("express");
const router = express.Router();
const { 
  createEmployee, 
  setupEmployeePassword, 
  loginEmployee,
  logoutEmployee
} = require("../controllers/employee.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");


router.post("/create", verifyJWT("organization") , createEmployee);
router.post("/setup-password", setupEmployeePassword);

router.post("/login", loginEmployee);


router.post("/logout", verifyJWT("employee"), logoutEmployee);


module.exports = router;
