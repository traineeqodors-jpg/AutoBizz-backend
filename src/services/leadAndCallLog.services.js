const db = require("../../db/models");
const CallLog = db.CallLog
const Lead = db.Lead

const syncLead = async (from, text, role, orgId) => {
  if (!from) return;
  const formattedMsg = `\n[${role}]: ${text}`;
  
  const [lead, created] = await Lead.findOrCreate({
    where: { phone: from },
    defaults: {
      name: "Unknown",
      message: formattedMsg.trim(),
      orgId: parseInt(orgId),
      confidence_score: 10
    }
  });

  if (!created) {
    await lead.update({
      message: db.sequelize.literal(`COALESCE(message, '') || ${db.sequelize.escape(formattedMsg)}`),
      // We will run the AI Scorer separately at the end of the call to avoid lag
      confidence_score: (lead.confidence_score || 0) + 1 
    });
  }
  return lead;
};

const safeLog = async (reqBody, text, role, orgId, extraData = {}) => {
  const { CallSid, From, To } = reqBody;
  const formattedText = `\n${role}: ${text}`;

  // Use upsert or find then update logic to avoid double appending
  const [log, created] = await CallLog.findOrCreate({
    where: { callSid: CallSid },
    defaults: {
      from: From, to: To, orgId: parseInt(orgId),
      status: 'in-progress',
      transcript: formattedText.trim()
    }
  });

  // If it wasn't just created, append the text safely
  if (!created) {
    await CallLog.update(
      {
        ...extraData,
        transcript: db.sequelize.literal(`COALESCE(transcript, '') || ${db.sequelize.escape(formattedText)}`)
      },
      { where: { callSid: CallSid } }
    );
  }

  return await syncLead(From, text, role, orgId);
};


module.exports = safeLog