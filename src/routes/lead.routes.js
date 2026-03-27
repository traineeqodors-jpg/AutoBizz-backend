const express = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const {
  addLead,
  getAllLeads,
  deleteLead,
  startQualificationBatch,
  finalizeCallAndScore,
  addLeadForm,
} = require("../controllers/lead.controller");
const { uploads, uploadCsv } = require("../utils/multer");
const { validateLeadsQuery } = require("../middlewares/vailidation.middleware");
const router = express.Router();

router.post("/", verifyJWT, uploadCsv.single("file"), addLead);
router.post("/form", addLeadForm);
router.get("/", verifyJWT, validateLeadsQuery, getAllLeads);
router.delete("/:id", verifyJWT, deleteLead);

module.exports = router;
