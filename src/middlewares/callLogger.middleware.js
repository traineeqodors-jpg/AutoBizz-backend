const db = require("../../db/models"); // Ensure this path points to your Sequelize index
const CallLog = db.CallLog 

const logCallMiddleware = async (req, res, next) => {
  const { orgId } = req.query; 
  const { CallSid, From, To, SpeechResult, CallStatus } = req.body;

  // 1. Log to terminal for debugging
  if (CallSid) {
    console.log(`📞 Call Step Detected: ${CallSid} | Status: ${CallStatus || 'active'}`);
    if (SpeechResult) console.log(`📝 Transcript Received: "${SpeechResult}"`);

    try {
      // 2. Use db.CallLog (The correct reference)
      await db.CallLog.upsert({
        callSid: CallSid,
        from: From,
        to: To,
        status: CallStatus || 'in-progress',
        transcript: SpeechResult || '', // This will update the transcript as the call flows
        orgId: orgId ? parseInt(orgId) : 1 
      });
      console.log("✅ Database Updated Successfully");
    } catch (err) {
      console.error("❌ DB Log Error:", err.message);
    }
  }

  next();
};

module.exports = logCallMiddleware;
