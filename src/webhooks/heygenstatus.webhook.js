const express = require("express");
const { getVideoStatus } = require("../controllers/heygenstatus.controller");
const router = express.Router();

router.options("/webhooks/heygen", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");
  res.sendStatus(200);
});

router.route("/").post(getVideoStatus);

module.exports = router;