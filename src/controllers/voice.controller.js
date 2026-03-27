const { email } = require("zod");
const db = require("../../db/models");
const { processVoiceAI } = require("../services/ai.services");
const safeLog = require("../services/leadAndCallLog.services");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  createGatherResponse,
  createPlayResponse,
} = require("../utils/twilML.utils");

const Lead = db.Lead;

const BASE_URL = process.env.BASE_URL;

const initiateCall = asyncHandler(async (req, res) => {
  const orgId = req.query.orgId || 1;
  const callerPhone = req.body.To; 

  console.log(callerPhone , "callerphone")
 
  let lead = await db.Lead.findOne({ where: { phone: callerPhone, orgId } });

  console.log(lead , "lead")

  if (!lead) {
   
    lead = await Lead.create({
      phone: callerPhone,
      email : "abc@gmail.com",
      name: "Inbound Caller",
      status: "new",
      orgId,
    });
  }

  const welcomeText = "Hello! Thanks for calling. How can I help you today?";

  
  const leadId = lead.id;

  await safeLog(req.body, welcomeText, "AI", orgId);

  // 3. Pass the leadId into the TwiML flow so it's remembered for the rest of the call
  res.type("text/xml").send(createGatherResponse(welcomeText, orgId, leadId));
});

const handleAIProcessing = async (req, res) => {
  const orgId = req.query.orgId || 1;
  const leadId = req.query.leadId;
  const { CallStatus, CallDuration, SpeechResult } = req.body;
  const pineconeIndex = req.app.locals.pineconeIndex;

  const finalData = { status: CallStatus || "in-progress" };
  if (CallStatus === "completed" && CallDuration) {
    finalData.duration = parseInt(CallDuration);
  }

  if (!SpeechResult) {
    const retryText = "I didn't catch that. Could you repeat it?";
    await safeLog(req.body, retryText, "AI", orgId, finalData);
    return res.type("text/xml").send(createGatherResponse(retryText, orgId));
  }

  try {
    
    await safeLog(req.body, SpeechResult, "User", orgId);

    // 2. AI Processing
    const { aiText, audioFile } = await processVoiceAI(
      SpeechResult,
      pineconeIndex,
      orgId,
      leadId,
    );

    // 3. Log AI Response in CallLog AND Lead Table
    await safeLog(req.body, aiText, "AI", orgId, finalData);

    const audioUrl = audioFile
      ? `${BASE_URL}/static/audio/${audioFile}?SkipAntiPhishing=true`
      : null;
    res.type("text/xml").send(createPlayResponse(audioUrl, aiText, orgId));
  } catch (error) {
    console.error("AI Processing Error:", error);
    res
      .type("text/xml")
      .send("<Response><Say>Error occurred.</Say><Hangup/></Response>");
  }
};



module.exports = { initiateCall, handleAIProcessing};
