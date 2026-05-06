const express = require("express");
const { me, logout } = require("../controllers/common.controller");
const { authorizeRoles, verifyJWT } = require("../middlewares/auth.middleware");
const router = express.Router();

router.get("/me", verifyJWT, me);
router.post("/logout", verifyJWT, logout);

module.exports = router;
