const express = require("express");
const { testChat, testScore } = require("../controllers/testController");
const { verifyJWT } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/test-rag", verifyJWT, testChat);

// scoring simulation
router.post("/score", verifyJWT, testScore);

module.exports = router;
