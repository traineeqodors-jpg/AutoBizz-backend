const db = require("../../db/models");

const logCallMiddleware = async (req, res, next) => {
  const { orgId } = req.query; 
  // Destructure CallDuration from req.body
  const { CallSid, From, To, SpeechResult, CallStatus, CallDuration } = req.body;

  if (CallSid) {
    const originalSend = res.send;

    res.send = function (body) {
      if (res.getHeader('Content-Type')?.includes('xml')) {
        console.log(` Outgoing TwiML: \n${body}`);
      }
      return originalSend.call(this, body);
    };

    try {
      const existingCall = await db.CallLog.findOne({ where: { callSid: CallSid } });
      let fullTranscript = existingCall ? existingCall.transcript : "";
      
      if (SpeechResult) {
        fullTranscript += (fullTranscript ? "\n" : "") + `User: ${SpeechResult}`;
      }

      // Prepare the update object
      const updateData = {
        callSid: CallSid,
        from: From || (existingCall ? existingCall.from : null),
        to: To || (existingCall ? existingCall.to : null),
        status: CallStatus || 'in-progress',
        transcript: fullTranscript,
        orgId: orgId ? parseInt(orgId) : (existingCall ? existingCall.orgId : 1)
      };

      // --- NEW: Add Duration if the call is finished ---
      if (CallStatus === 'completed' && CallDuration) {
        updateData.duration = parseInt(CallDuration); // Ensure your DB column is Integer
      }

      await db.CallLog.upsert(updateData);
      
    } catch (err) {
      console.error(" DB Log Error:", err.message);
    }
  }

  next();
};

module.exports = logCallMiddleware;
