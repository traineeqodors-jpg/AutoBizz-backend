const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { getAllMeetings } = require('../controllers/meeting.controller');
const router = express.Router();
router.get("/" , verifyJWT , getAllMeetings)

module.exports = router