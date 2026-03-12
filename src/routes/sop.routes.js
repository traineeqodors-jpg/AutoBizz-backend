const express = require('express');
const { generateSOPVideo } = require('../controllers/sopvideo.controller');
const router = express.Router();


router.route('/').post(generateSOPVideo);

module.exports = router