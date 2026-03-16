const { getRagResponse } = require('./rag.services');
const { generateAudio } = require('./elevenlabs.services');

const processVoiceAI = async (userSpeech, pineconeIndex, orgId) => {
  
  const aiText = await getRagResponse(userSpeech, pineconeIndex, orgId);

 
  const audioFile = await generateAudio(aiText);

  return { aiText, audioFile };
};

module.exports = { processVoiceAI };
