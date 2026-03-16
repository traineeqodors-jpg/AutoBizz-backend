const VoiceResponse = require('twilio').twiml.VoiceResponse;

const createGatherResponse = (message, orgId) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: `/api/handle-ai?orgId=${orgId}`, // Preserve orgId
    speechTimeout: 'auto',
  });
  gather.say(message);
  return twiml.toString();
};

const createPlayResponse = (audioUrl, fallbackText, orgId) => {
  const twiml = new VoiceResponse();
  
  // 1. AI speaks
  if (audioUrl) {
    twiml.play(audioUrl);
  } else {
    twiml.say(fallbackText);
  }

  // 2. WAIT for User to speak (The Conversation Loop)
  const gather = twiml.gather({
    input: 'speech',
    action: `/api/voice/handle-ai?orgId=${orgId}`, // Send next speech back to AI
    speechTimeout: 'auto',
    method: 'POST'
  });

  // 3. Fallback: If user stays silent, redirect to prompt them again
  twiml.redirect(`/api/voice?orgId=${orgId}`); 

  return twiml.toString();
};

module.exports = { createGatherResponse, createPlayResponse };



