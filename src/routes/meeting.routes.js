const express = require('express');
const { verifyJWT, allowOwnerOrEmployee } = require('../middlewares/auth.middleware');
const { getAllMeetings, confirmMeeting } = require('../controllers/meeting.controller');
const router = express.Router();

router.get("/" , allowOwnerOrEmployee , getAllMeetings)
router.post("/confirm-meeting" , confirmMeeting)

module.exports = router