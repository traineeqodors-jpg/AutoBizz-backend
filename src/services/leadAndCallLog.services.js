const db = require("../../db/models");
const CallLog = db.CallLog;

const safeLog = async (reqBody, text, role, orgId, leadId, extraData = {}) => {
  const { CallSid, From, To } = reqBody;
  const formattedText = `\n${role}: ${text}`;

  const [log, created] = await CallLog.findOrCreate({
    where: { callSid: CallSid },
    defaults: {
      from: From,
      to: To,
      orgId: parseInt(orgId),
      leadId: leadId, 
      status: 'in-progress',
      transcript: formattedText.trim()
    }
  });

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

module.exports = safeLog;
