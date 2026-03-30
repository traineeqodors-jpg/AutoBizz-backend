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


router.get("/test-full-batch", async (req, res) => {
  const io = req.app.get("io");
  const orgId = req.query.orgId || 12;
  const totalLeads = 5;

  res.send(`Started FULL Simulation for Org: ${orgId}. Watch your frontend!`);

  console.log(`🧪 Starting Full Socket Simulation for Org: ${orgId}`);

  for (let i = 1; i <= totalLeads; i++) {
  
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const batchKey = `batch-update-${orgId}`;
    const scoreKey = `lead-scored-${orgId}`;
    
    // 2. Emit Lead Scored (Trigger individual UI/Table update)
    console.log(` Lead #${i} Scored`);
    io.emit(scoreKey, {
      leadId: i, // Passing the ID helps the frontend identify which row changed
      score: Math.floor(Math.random() * 100), // Simulated random score
      status: "scored"
    });

    // 3. Emit Batch Progress (Update the Toast/Progress Bar)
    console.log(` Emitting Progress: ${i}/${totalLeads}`);
    io.emit(batchKey, {
      message: `Lead #${i} has been scored successfully!`,
      current: i,
      total: totalLeads,
      status: "processing",
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 4. Send Final Completion Signal
  io.emit(`batch-update-${orgId}`, {
    message: "Simulation Finished! All leads processed.",
    status: "completed",
  });

  console.log(` Simulation for Org ${orgId} Done.`);
});








module.exports = router;
