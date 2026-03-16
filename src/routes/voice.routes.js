const express = require('express');
const router = express.Router();
const {initiateCall,handleAIProcessing} = require('../controllers/voice.controller');
const logCallMiddleware = require('../middlewares/callLogger.middleware');


// Initial call entry
router.post('/', logCallMiddleware, initiateCall);

// AI processing loop
router.post('/handle-ai', logCallMiddleware, handleAIProcessing);





module.exports = router;
