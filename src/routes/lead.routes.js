const express = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { addLead, getAllLeads, deleteLead, startQualificationBatch, finalizeCallAndScore } = require("../controllers/lead.controller");
const { uploads, uploadCsv } = require("../utils/multer");
const { validateLeadsQuery } = require("../middlewares/vailidation.middleware");
const router = express.Router();
 
router.post("/", verifyJWT, uploadCsv.single("file"), addLead);
router.get("/", verifyJWT, validateLeadsQuery,  getAllLeads);
router.delete("/:id" , verifyJWT , deleteLead)


 
module.exports = router;