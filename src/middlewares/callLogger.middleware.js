const db = require("../../db/models");

const logCallMiddleware = async (req, res, next) => {
  const { orgId } = req.query; 
  const { CallSid, From, To, SpeechResult, CallStatus } = req.body;

  if (CallSid) {
    
    const originalSend = res.send;

    res.send = function (body) {
      
      if (res.getHeader('Content-Type')?.includes('xml')) {
        console.log(` Outgoing TwiML: \n${body}`);

       
      }
      return originalSend.call(this, body);
    };

    // --- 2. LOG THE INCOMING DATA (As before) ---
    try {
      const existingCall = await db.CallLog.findOne({ where: { callSid: CallSid } });
      let fullTranscript = existingCall ? existingCall.transcript : "";
      
      if (SpeechResult) {
        fullTranscript += (fullTranscript ? "\n" : "") + `User: ${SpeechResult}`;
      }

      await db.CallLog.upsert({
        callSid: CallSid,
        from: From || (existingCall ? existingCall.from : null),
        to: To || (existingCall ? existingCall.to : null),
        status: CallStatus || 'in-progress',
        transcript: fullTranscript,
        orgId: orgId ? parseInt(orgId) : (existingCall ? existingCall.orgId : 1)
      });
    } catch (err) {
      console.error(" DB Log Error:", err.message);
    }
  }

  next();
};

module.exports = logCallMiddleware;
