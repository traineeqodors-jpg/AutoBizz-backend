const express = require('express');
const { generateSOPVideo } = require('../controllers/sopvideo.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const router = express.Router();


router.route("/").post(verifyJWT, generateSOPVideo);

module.exports = router