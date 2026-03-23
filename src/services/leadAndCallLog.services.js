const db = require("../../db/models");
const CallLog = db.CallLog




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

 
};


module.exports = safeLog