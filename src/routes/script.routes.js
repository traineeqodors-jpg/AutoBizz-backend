const express = require("express");
const { prepareScript } = require("../controllers/sopvideo.controller.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const router = express.Router();

router.route("/").post(verifyJWT("organization"), prepareScript);

module.exports = router;