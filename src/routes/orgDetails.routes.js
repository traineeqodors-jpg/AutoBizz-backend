const express = require("express");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const {
  getOrganizationDetails,
  addOrganizationDetails,
  editOrganizationDetails,
} = require("../controllers/orgDetails.controller");
const router = express.Router();

router.get(
  "/",
  verifyJWT,
  getOrganizationDetails,
);
router.post("/", verifyJWT, authorizeRoles("owner"), addOrganizationDetails);
router.put("/", verifyJWT, authorizeRoles("owner"), editOrganizationDetails);

module.exports = router;
