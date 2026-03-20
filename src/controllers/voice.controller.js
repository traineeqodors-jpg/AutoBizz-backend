const db = require('../../db/models');
const { processVoiceAI } = require('../services/ai.services');
const safeLog = require('../services/leadAndCallLog.services');
const { createGatherResponse, createPlayResponse } = require('../utils/twilML.utils');

const CallLog = db.CallLog;
const Lead = db.Lead;
const BASE_URL = process.env.BASE_URL;


const initiateCall = async (req, res) => {
  const orgId = req.query.orgId || 1;
  const welcomeText = "Hello! How can I help you today?";
  
  await safeLog(req.body, welcomeText, 'AI', orgId);

  res.type('text/xml').send(createGatherResponse(welcomeText, orgId));
};

const handleAIProcessing = async (req, res) => {
  const orgId = req.query.orgId || 1;
  const { CallSid, CallStatus, CallDuration, SpeechResult, From } = req.body;
  const pineconeIndex = req.app.locals.pineconeIndex;

  const finalData = { status: CallStatus || "in-progress" };
  if (CallStatus === 'completed' && CallDuration) {
    finalData.duration = parseInt(CallDuration);
  }

  if (!SpeechResult) {
    const retryText = "I didn't catch that. Could you repeat it?";
    await safeLog(req.body, retryText, 'AI', orgId, finalData);
    return res.type('text/xml').send(createGatherResponse(retryText, orgId));
  }

  try {
    // 1. Log User Speech in CallLog AND Lead Table
    await safeLog(req.body, SpeechResult, 'User', orgId);

    // 2. AI Processing
    const { aiText, audioFile } = await processVoiceAI(SpeechResult, pineconeIndex, orgId);

    // 3. Log AI Response in CallLog AND Lead Table
    await safeLog(req.body, aiText, 'AI', orgId, finalData);

    const audioUrl = audioFile ? `${BASE_URL}/static/audio/${audioFile}` : null;
    res.type('text/xml').send(createPlayResponse(audioUrl, aiText, orgId));

  } catch (error) {
    console.error("AI Processing Error:", error);
    res.type('text/xml').send("<Response><Say>Error occurred.</Say><Hangup/></Response>");
  }
};

module.exports = { initiateCall, handleAIProcessing };
