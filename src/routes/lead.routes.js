const express = require("express");
const { authorizeRoles, verifyJWT } = require("../middlewares/auth.middleware");
const {
  addLead,
  getAllLeads,
  deleteLead,
  callSelectedLead,
} = require("../controllers/lead.controller");
const { uploadCsv } = require("../utils/multer");
const {
  validateLeadsQuery,
  validate,
} = require("../middlewares/vailidation.middleware");
const { leadSchema } = require("../zodSchema/leadSchema");

const router = express.Router();

/**
 * CASE 1: Adding a Lead
 * Accessible by: Owner OR Employee with role 'sales'
 */
router.post(
  "/",
  verifyJWT,
  authorizeRoles("sales", "owner"),
  uploadCsv.single("file"),
  validate(leadSchema),
  addLead,
);

/**
 * CASE 2: Getting all Leads
 * Accessible by: Owner OR Any Employee (regardless of role)
 */
router.get(
  "/",
  verifyJWT,
  authorizeRoles("owner", "sales"),
  validateLeadsQuery,
  getAllLeads,
);

router.post(
  "/call",
  verifyJWT,
  authorizeRoles("owner", "sales"),
  callSelectedLead,
);

/**
 * CASE 3: Deleting a Lead
 * Accessible by: ONLY the Owner
 * (If you want 'admin' employees to delete too, change to authorizeRoles("admin"))
 */
router.delete("/:id", verifyJWT, authorizeRoles("owner", "sales"), deleteLead);

module.exports = router;
