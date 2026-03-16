const db = require('../../db/models');
const { processVoiceAI } = require('../services/ai.services');
const { createGatherResponse, createPlayResponse } = require('../utils/twilML.utils');
db.CallLog = db.CallLog

const BASE_URL = process.env.BASE_URL;

const initiateCall = (req, res) => {
  const orgId = req.query.orgId || 1;
  const twiml = createGatherResponse("Hello! How can I help you today?", orgId);
  res.type('text/xml').send(twiml);
};

const handleAIProcessing = async (req, res) => {
  const orgId = req.query.orgId || 1;
  console.log("req body" ,req.body)
    const { CallSid , CallStatus , CallDuration} = req.body;
  const userSpeech = req.body.SpeechResult;
  
  
  const pineconeIndex = req.app.locals.pineconeIndex;

  if (!userSpeech) {
    const retry = createGatherResponse("I didn't catch that. Could you repeat it?", orgId);
    return res.type('text/xml').send(retry);
  }

  try {
   
    const { aiText, audioFile } = await processVoiceAI(userSpeech, pineconeIndex, orgId);
    console.log("AI Text" , aiText)

    const existingLog = await db.CallLog.findOne({ where: { callSid: CallSid } });

     await db.CallLog.update(
      { 
        transcript: db.sequelize.literal(`transcript || ${db.sequelize.escape('\nAI: ' + aiText)}`),
        status: CallStatus || "in-progress",
        duration: CallDuration ? parseInt(CallDuration) : existingLog.duration 

      },
      { where: { callSid: CallSid } }
    );

    console.log(`Database updated for CallSid: ${CallSid}`);
    
    const audioUrl = audioFile ? `${BASE_URL}static/audio/${audioFile}` : null;
    const twiml = createPlayResponse(audioUrl, aiText, orgId);

    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error("AI Processing Error:", error);
    res.type('text/xml').send("<Response><Say>An error occurred.</Say></Response>");
  }
};

module.exports = { initiateCall, handleAIProcessing };
