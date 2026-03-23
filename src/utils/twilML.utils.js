const VoiceResponse = require('twilio').twiml.VoiceResponse;

const createGatherResponse = (message, orgId) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: `/api/voice/handle-ai?orgId=${orgId}`, // Preserve orgId
    speechTimeout: 'auto',
  });
  gather.say(message);
  return twiml.toString();
};

const createPlayResponse = (audioUrl, fallbackText, orgId) => {
  const twiml = new VoiceResponse();
  
 
  const gather = twiml.gather({
    input: 'speech',
    action: `/api/voice/handle-ai?orgId=${orgId}`,
    speechTimeout: 'auto',
    method: 'POST'
  });

  if (audioUrl) {
    gather.play(audioUrl); 
  } else {
    gather.say(fallbackText);
  }

  
  twiml.redirect(`/api/voice?orgId=${orgId}`); 

  return twiml.toString();
};


module.exports = { createGatherResponse, createPlayResponse };



