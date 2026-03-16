const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { getAllCallLogs, getIndividualCallLogs, deleteCallLog } = require('../controllers/callLog.controller');
const router = express.Router();

router.get("/" , verifyJWT , getAllCallLogs)
router.get("/:id" , getIndividualCallLogs)
router.delete("/:id" , verifyJWT , deleteCallLog)

module.exports = router