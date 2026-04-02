const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { getAllMeetings, confirmMeeting } = require('../controllers/meeting.controller');
const router = express.Router();

router.get("/" , verifyJWT , getAllMeetings)
router.post("/confirm-meeting" , confirmMeeting)

module.exports = router