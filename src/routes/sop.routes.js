const express = require('express');
const { generateSOPVideo, getAllVideos, deleteVideo, testDownload } = require('../controllers/sopvideo.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const router = express.Router();


router.route("/generateSOP").post(verifyJWT, generateSOPVideo);
router.route("/getAllSopVideos").get(verifyJWT, getAllVideos);
router.route("/dowloadVideo").post(testDownload);
router.route("/:videoId").delete(verifyJWT, deleteVideo);

module.exports = router