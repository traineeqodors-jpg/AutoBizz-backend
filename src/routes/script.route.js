const express = require("express");
const { prepareScript } = require("../controllers/sopvideo.controller.js");
const router = express.Router();

router.route("/").get(prepareScript);

module.exports = router;
