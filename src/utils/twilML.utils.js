const VoiceResponse = require('twilio').twiml.VoiceResponse;

// ADD leadId parameter
const createGatherResponse = (message, orgId, leadId) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    // 💡 Added leadId to action URL
    action: `/api/voice/handle-ai?orgId=${orgId}&leadId=${leadId}`,
    speechTimeout: 'auto',
  });
  gather.say(message);
  return twiml.toString();
};

const createPlayResponse = (audioUrl, fallbackText, orgId, leadId) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: `/api/voice/handle-ai?orgId=${orgId}&leadId=${leadId}`,
    speechTimeout: 'auto',
    method: 'POST'
  });

  if (audioUrl) {
    gather.play(audioUrl); 
  } else {
    gather.say(fallbackText);
  }

  // 💡 Added leadId to redirect
  twiml.redirect(`/api/voice?orgId=${orgId}&leadId=${leadId}`); 

  return twiml.toString();
};

module.exports = { createGatherResponse, createPlayResponse };
