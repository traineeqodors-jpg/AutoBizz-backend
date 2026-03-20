const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { addLead, scoreLead } = require('../controllers/lead.controller');
const router = express.Router();

router.post("/" , verifyJWT , addLead)
router.get("/score" , verifyJWT , scoreLead)

module.exports = router