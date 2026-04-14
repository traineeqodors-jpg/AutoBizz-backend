const express = require("express");
const { 
    allowOwnerOrEmployee, 
    authorizeRoles,
    verifyJWT
} = require("../middlewares/auth.middleware");
const { 
    addLead, 
    getAllLeads, 
    deleteLead 
} = require("../controllers/lead.controller");
const { uploadCsv } = require("../utils/multer");
const { validateLeadsQuery } = require("../middlewares/vailidation.middleware");

const router = express.Router();

/**
 * CASE 1: Adding a Lead
 * Accessible by: Owner OR Employee with role 'sales'
 */
router.post(
    "/", 
    allowOwnerOrEmployee, 
    authorizeRoles("sales"), 
    uploadCsv.single("file"), 
    addLead
);

/**
 * CASE 2: Getting all Leads
 * Accessible by: Owner OR Any Employee (regardless of role)
 */
router.get(
    "/", 
    allowOwnerOrEmployee,
     authorizeRoles("sales"), 
    validateLeadsQuery, 
    getAllLeads
);

/**
 * CASE 3: Deleting a Lead
 * Accessible by: ONLY the Owner
 * (If you want 'admin' employees to delete too, change to authorizeRoles("admin"))
 */
router.delete(
    "/:id", 
    verifyJWT("organization"),  
    deleteLead
);

module.exports = router;