const express = require('express');
const { 
  allowOwnerOrEmployee, 
  authorizeRoles 
} = require('../middlewares/auth.middleware');
const { 
  getAllCallLogs, 
  getIndividualCallLogs, 
  deleteCallLog 
} = require('../controllers/callLog.controller');

const router = express.Router();

/**
 * Shared Access: Both Owner and any Employee can view all call logs
 */
router.get("/", allowOwnerOrEmployee, getAllCallLogs);

/**
 * Shared Access: Viewing a specific log
 * Added allowOwnerOrEmployee to ensure the requester is authenticated
 */
router.get("/:id", allowOwnerOrEmployee, getIndividualCallLogs);

/**
 * Restricted Access: Only Owner can delete call logs
 * (If you want 'admin' employees to delete too, add authorizeRoles("admin"))
 */
router.delete("/:id", allowOwnerOrEmployee, authorizeRoles(), deleteCallLog);

module.exports = router;