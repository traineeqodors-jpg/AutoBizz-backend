const { processVoiceAI } = require('../services/ai.services');
const { createGatherResponse, createPlayResponse } = require('../utils/twilML.utils');

const BASE_URL = process.env.BASE_URL;

const initiateCall = (req, res) => {
  const orgId = req.query.orgId || 1;
  const twiml = createGatherResponse("Hello! How can I help you today?", orgId);
  res.type('text/xml').send(twiml);
};

const handleAIProcessing = async (req, res) => {
  const orgId = req.query.orgId || 1;
  const userSpeech = req.body.SpeechResult;
  
  // Get Pinecone from app locals (initialized in app.js)
  const pineconeIndex = req.app.locals.pineconeIndex;

  if (!userSpeech) {
    const retry = createGatherResponse("I didn't catch that. Could you repeat it?", orgId);
    return res.type('text/xml').send(retry);
  }

  try {
    // Pass userSpeech, pineconeIndex, and orgId (for namespace) to orchestrator
    const { aiText, audioFile } = await processVoiceAI(userSpeech, pineconeIndex, orgId);
    
    const audioUrl = audioFile ? `${BASE_URL}/static/audio/${audioFile}` : null;
    const twiml = createPlayResponse(audioUrl, aiText, orgId);

    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error("AI Processing Error:", error);
    res.type('text/xml').send("<Response><Say>An error occurred.</Say></Response>");
  }
};

module.exports = { initiateCall, handleAIProcessing };
