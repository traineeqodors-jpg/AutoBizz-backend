// utils/transcript.js

const db = require("../../db/models");
const CallLog = db.CallLog;

const appendToTranscript = async (leadId, orgId, role, text) => {
  const formatted = `\n${role}: ${text}`;

  const [log, created] = await CallLog.findOrCreate({
    where: { leadId, orgId },
    defaults: {
      transcript: formatted.trim(),
      status: "in-progress",
    },
  });

  if (!created) {
    await CallLog.update(
      {
        transcript: db.sequelize.literal(
          `COALESCE(transcript, '') || ${db.sequelize.escape(formatted)}`,
        ),
      },
      { where: { leadId, orgId } },
    );
  }
};

module.exports = { appendToTranscript };
