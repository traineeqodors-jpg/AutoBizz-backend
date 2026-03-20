const express = require('express');
const { generateSOPVideo, getAllVideos } = require('../controllers/sopvideo.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const router = express.Router();


router.route("/generateSOP").post(verifyJWT, generateSOPVideo);
router.route("/getAllSopVideos").get(verifyJWT, getAllVideos);

module.exports = router