const express = require('express');
const router = express.Router();
const {initiateCall,handleAIProcessing} = require('../controllers/voice.controller');
const { startQualificationBatch, finalizeCallAndScore } = require('../controllers/lead.controller');



// Initial call entry
router.post('/', initiateCall);

// AI processing loop
router.post('/handle-ai', handleAIProcessing);


router.post("/callback", finalizeCallAndScore);


router.post('/batch-qualify', startQualificationBatch); 










module.exports = router;
