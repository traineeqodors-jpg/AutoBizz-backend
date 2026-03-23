const express = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { addLead, getAllLeads, deleteLead } = require("../controllers/lead.controller");
const { uploads } = require("../utils/multer");
const { validateLeadsQuery } = require("../middlewares/vailidation.middleware");
const router = express.Router();
 
router.post("/", verifyJWT, uploads.single("file"), addLead);
router.get("/", verifyJWT, validateLeadsQuery,  getAllLeads);
router.delete("/" , verifyJWT , deleteLead)
 
module.exports = router;