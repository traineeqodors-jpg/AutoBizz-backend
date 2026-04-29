const { getRagResponse } = require("./rag.services");
const { generateAudio } = require("./elevenlabs.services");

const processVoiceAI = async (userSpeech, pineconeIndex, orgId, leadId) => {
  const aiText = await getRagResponse(userSpeech, pineconeIndex, orgId, leadId);

  const audioFile = await generateAudio(aiText);

  return { aiText, audioFile };
};

module.exports = { processVoiceAI };
