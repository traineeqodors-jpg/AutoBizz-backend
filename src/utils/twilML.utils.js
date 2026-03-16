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
  if (audioUrl) {
    twiml.play(audioUrl);
  } else {
    twiml.say(fallbackText);
  }
  twiml.redirect(`/api//voice?orgId=${orgId}`); // Loop with orgId
  return twiml.toString();
};

module.exports = { createGatherResponse, createPlayResponse };
