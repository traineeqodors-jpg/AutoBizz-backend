const express = require("express");
const {
  registerOrg,
  getAllOrgs,
  orgLogin,
  refreshAccessToken,
  getCurrentOrgDetails,
  editOrg,
  handleGoogleToken,
  queryForm,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/org.controller.js");
const {validate} = require("../middlewares/vailidation.middleware.js");
const registerSchema = require("../zodSchema/registerSchema.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const {  uploadImage } = require("../utils/multer.js");
const router = express.Router();

router.post("/register", validate(registerSchema), registerOrg);
router.post("/login", orgLogin);
router.post("/refresh-token", refreshAccessToken);
router.put("/", uploadImage.single("file") ,verifyJWT("organization"), editOrg);
router.get("/", getAllOrgs);
router.get("/orgDetails", verifyJWT("organization"), getCurrentOrgDetails);
router.post("/googleToken", verifyJWT("organization"), handleGoogleToken);


//Employee
router.get("/employee" , verifyJWT("organization") , getAllEmployees)
router.post("/employee" , verifyJWT("organization") , updateEmployee)
router.delete("/employee" , verifyJWT("organization") , deleteEmployee)

router.post("/queryForm" , queryForm);
 
module.exports = router
