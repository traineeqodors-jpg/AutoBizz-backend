const express = require('express');
const router = express.Router();
const {initiateCall,handleAIProcessing} = require('../controllers/voice.controller');



// Initial call entry
router.post('/', initiateCall);

// AI processing loop
router.post('/handle-ai', handleAIProcessing);





module.exports = router;
