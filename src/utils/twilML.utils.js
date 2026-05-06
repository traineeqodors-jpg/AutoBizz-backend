const VoiceResponse = require("twilio").twiml.VoiceResponse;

const BASE_URL = process.env.BASE_URL;

const createGatherResponse = (message, orgId, leadId) => {
  const twiml = new VoiceResponse();

  twiml
    .gather({
      input: "speech",
      action: `${BASE_URL}/api/voice/handle-ai?orgId=${orgId}&leadId=${leadId}`,
      method: "POST",
      speechTimeout: "auto",
    })
    .say(message);

  return twiml.toString();
};

const createPlayResponse = (audioUrl, fallbackText, orgId, leadId) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: "speech",
    action: `${BASE_URL}/api/voice/handle-ai?orgId=${orgId}&leadId=${leadId}`,
    method: "POST",
    speechTimeout: "auto",
  });

  if (audioUrl) {
    gather.play(audioUrl);
  } else {
    gather.say(fallbackText);
  }

  twiml.say("I didn't hear anything. Let's try again.");

  twiml.redirect(`${BASE_URL}/api/voice?orgId=${orgId}&leadId=${leadId}`);

  return twiml.toString();
};

module.exports = { createGatherResponse, createPlayResponse };
