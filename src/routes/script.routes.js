const express = require("express");
const { prepareScript } = require("../controllers/sopvideo.controller.js");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware.js");
const router = express.Router();

router.route("/").post(verifyJWT,authorizeRoles("owner"), prepareScript);

module.exports = router;
