const db = require("../../db/models");
const Lead = db.Lead
const CallLog = db.CallLog


/**
 * NEW: Lead Sync Helper (Stage 6)
 * Creates or Updates a Lead based on the Phone Number
 */
const syncLead = async (from, text, role, orgId) => {
  if (!from) return; // Skip if no phone number (e.g. testing)

  const formattedMsg = `\n[Call ${role}]: ${text}`;
  
  // findOrCreate lead by phone number
  const [lead, created] = await Lead.findOrCreate({
    where: { phone: from },
    defaults: {
      name: "Unknown Caller", // Placeholder for Stage 6 enrichment later
      message: formattedMsg.trim(),
      orgId: parseInt(orgId),
      confidence_score: 10
    }
  });

  if (!created) {
    await lead.update({
      message: db.sequelize.literal(`COALESCE(message, '') || ${db.sequelize.escape(formattedMsg)}`),
      confidence_score: (lead.confidence_score || 0) + 2 // Small boost for returning calls
    });
  }
};

/**
 * Updated SafeLog to handle CallLogs
 */
const safeLog = async (reqBody, text, role, orgId, extraData = {}) => {
  const { CallSid, From, To } = reqBody;
  const formattedText = `\n${role}: ${text}`;

  await CallLog.findOrCreate({
    where: { callSid: CallSid },
    defaults: {
      from: From, to: To, orgId: parseInt(orgId),
      status: 'in-progress',
      transcript: formattedText.trim()
    }
  });

  await CallLog.update(
    {
      ...extraData,
      transcript: db.sequelize.literal(`COALESCE(transcript, '') || ${db.sequelize.escape(formattedText)}`)
    },
    { where: { callSid: CallSid } }
  );

  // TRIGGER LEAD SYNC: Connect Call to Lead Table
  await syncLead(From, text, role, orgId);
};


module.exports = safeLog;