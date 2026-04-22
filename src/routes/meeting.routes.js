const express = require("express");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const {
  getAllMeetings,
  confirmMeeting,
} = require("../controllers/meeting.controller");
const router = express.Router();

router.get("/",verifyJWT, authorizeRoles("owner", "sales"), getAllMeetings);
router.post("/confirm-meeting", confirmMeeting);

module.exports = router;
