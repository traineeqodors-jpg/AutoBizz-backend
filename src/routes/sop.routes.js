const express = require("express");
const {
  generateSOPVideo,
  getAllVideos,
  deleteVideo,
  testDownload,
  editVideoTitle,
} = require("../controllers/sopvideo.controller");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware");
const router = express.Router();

router
  .route("/generateSOP")
  .post(verifyJWT, authorizeRoles("owner"), generateSOPVideo);

router
  .route("/getAllSopVideos")
  .get(verifyJWT, authorizeRoles("employee", "owner", "sales"), getAllVideos);

router
  .route("/:videoId")
  .put(verifyJWT, authorizeRoles("owner"), editVideoTitle);

router.route("/downloadVideo").post(testDownload);

router
  .route("/:videoId")
  .delete(verifyJWT, authorizeRoles("owner"), deleteVideo);

module.exports = router;
