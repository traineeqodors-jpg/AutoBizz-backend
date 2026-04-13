const express = require('express');
const { generateSOPVideo, getAllVideos, deleteVideo, testDownload } = require('../controllers/sopvideo.controller');
const { verifyJWT, allowOwnerOrEmployee, authorizeRoles } = require('../middlewares/auth.middleware');
const router = express.Router();


router.route("/generateSOP").post(verifyJWT("organization"), generateSOPVideo);
router.route("/getAllSopVideos").get(allowOwnerOrEmployee, authorizeRoles("sales", "employee"),  getAllVideos);
router.route("/dowloadVideo").post(testDownload);
router.route("/:videoId").delete(verifyJWT("organization"), deleteVideo);

module.exports = router