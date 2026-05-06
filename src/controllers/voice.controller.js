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
  const from = req.body.From;

  let lead = await db.Lead.findOne({ where: { phone: callerPhone, orgId } });

  if (!lead) {
    lead = await Lead.create({
      phone: from,
      email: `dummy${from}@gmail.com`,
      name: "Inbound Caller",
      status: "new",
      orgId,
    });
  }

  const welcomeText = "Hello! How can I help you today?";
  const leadId = lead.id;

  console.log("sending lead id : ", leadId);

  await safeLog(req.body, welcomeText, "AI", orgId, leadId);

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
    await safeLog(req.body, retryText, "AI", orgId, leadId, finalData);
    return res
      .type("text/xml")
      .send(createGatherResponse(retryText, orgId, leadId));
  }

  try {
    await safeLog(req.body, SpeechResult, "User", orgId, leadId);

    const { aiText, audioFile } = await processVoiceAI(
      SpeechResult,
      pineconeIndex,
      orgId,
      leadId,
    );

    await safeLog(req.body, aiText, "AI", orgId, leadId, finalData);

    const audioUrl = audioFile
      ? `${BASE_URL}/static/audio/${audioFile}?SkipAntiPhishing=true`
      : null;
    res
      .type("text/xml")
      .send(createPlayResponse(audioUrl, aiText, orgId, leadId));
  } catch (error) {
    console.error("AI Processing Error:", error);
    res
      .type("text/xml")
      .send("<Response><Say>Error occurred.</Say><Hangup/></Response>");
  }
};

module.exports = { initiateCall, handleAIProcessing };
