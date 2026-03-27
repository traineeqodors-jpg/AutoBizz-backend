require('dotenv').config()
const db = require('../../db/models');
const Lead = db.Lead


async function testHook() {
  try {
    // 1. Find a specific lead
    const leadId = 716; 
    const lead = await Lead.findByPk(leadId);
    
    if (!lead) return;

    console.log(`Current Score for ${lead.name}:`, lead.confidence_score);
    
    // 2. FORCE a change (if it's already 95, change it to 96)
    const newScore = lead.confidence_score === 95 ? 96 : 95;

    console.log(`Updating score to: ${newScore}...`);

    // 3. Use the MODEL update for the most reliable hook trigger
    await Lead.update(
      { confidence_score: newScore }, 
      { 
        where: { id: leadId },
        individualHooks: true // This is mandatory for Lead.update
      }
    );

  } catch (err) {
    console.error("Script Error:", err);
  }
}

testHook();
