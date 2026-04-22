const express = require("express");
const { authorizeRoles, verifyJWT } = require("../middlewares/auth.middleware");
const {
  getAllCallLogs,
  getIndividualCallLogs,
  deleteCallLog,
} = require("../controllers/callLog.controller");

const router = express.Router();

/**
 * Shared Access: Both Owner and any Employee can view all call logs
 */
router.get("/",verifyJWT, authorizeRoles( "owner", "sales"), getAllCallLogs);

/**
 * Shared Access: Viewing a specific log
 * Added authorizeRoles("employee", "owner", "sales") to ensure the requester is authenticated
 */
router.get(
  "/:id",
  verifyJWT,
  authorizeRoles("owner", "sales"),
  getIndividualCallLogs,
);

/**
 * Restricted Access: Only Owner can delete call logs
 * (If you want 'admin' employees to delete too, add authorizeRoles("admin"))
 */
router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("owner"),
  deleteCallLog,
);

module.exports = router;
