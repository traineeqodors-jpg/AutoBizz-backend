require('dotenv').config()
const db = require('../../db/models');
const Lead = db.Lead


async function testHook() {
  try {
   
    const leadId = 1352; 
    const lead = await Lead.findByPk(leadId);
    
    if (!lead) return console.log("Lead not found in database.");

    console.log(`Current Score for ${lead.name}:`, lead.confidence_score);
    
    
    const newScore = lead.confidence_score === 95 ? 96 : 95;

    console.log(`Updating score to: ${newScore}...`);

    
    await Lead.update(
      { confidence_score: newScore }, 
      { 
        where: { id: leadId },
        individualHooks: true 
      }
    );

    console.log("Update sent. Check your SERVER console now.");
  } catch (err) {
    console.error("Script Error:", err);
  }
}

testHook();
