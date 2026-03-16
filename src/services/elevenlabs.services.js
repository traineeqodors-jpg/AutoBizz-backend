const axios = require('axios');
const fs = require('fs');
const path = require('path');

const generateAudio = async (text) => {
  const apiKey = process.env.ELEVENLABS_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m0410nR7HfS2hf7pXf';

  if (!text) return null;

  try {
        const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/21m0410nR7HfS2hf7pXf`, // Added the $ sign
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer' 
      }
    );

    // FIXED PATH (Going up two levels to find public)
    const audioDir = path.join(__dirname, '../../public/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const fileName = `reply-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    // FIXED WRITE (Removed redundant 'binary' flag)
    fs.writeFileSync(filePath, Buffer.from(response.data));

    return fileName;
  } catch (error) {
    if (error.response) {
      console.error("ElevenLabs API Error:", error.response.status, error.response.statusText);
    } else {
      console.error("Connection Error:", error.message);
    }
    return null;
  }
};

module.exports = { generateAudio };
