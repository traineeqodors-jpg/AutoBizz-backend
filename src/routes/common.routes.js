const express = require("express");
const { me, logout } = require("../controllers/common.controller");
const { authorizeRoles, verifyJWT } = require("../middlewares/auth.middleware");
const router = express.Router();

router.get("/me", verifyJWT, authorizeRoles("employee", "owner", "sales"), me);
router.post(
  "/logout",
  verifyJWT,
  authorizeRoles("employee", "owner", "sales"),
  logout,
);

module.exports = router;
