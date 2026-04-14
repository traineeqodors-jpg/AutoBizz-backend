const express = require("express");
const {
  verifyJWT,
  allowOwnerOrEmployee,
} = require("../middlewares/auth.middleware");
const {
  getOrganizationDetails,
  addOrganizationDetails,
  editOrganizationDetails,
} = require("../controllers/orgDetails.controller");
const router = express.Router();

router.get("/", allowOwnerOrEmployee, getOrganizationDetails);
router.post("/", verifyJWT("organization"), addOrganizationDetails);
router.put("/", verifyJWT("organization"), editOrganizationDetails);

module.exports = router;
