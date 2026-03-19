const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { addLead } = require('../controllers/lead.controller');
const router = express.Router();

router.post("/" , verifyJWT , addLead)

module.exports = router