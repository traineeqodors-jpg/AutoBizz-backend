const axios = require("axios");

async function sendAudioToSimli(audioBuffer, avatar_id) {
  if (!audioBuffer) throw new Error("No audio buffer provided");

  const audioBase64 = audioBuffer.toString("base64");

  try {
    const response = await axios.post(
      "https://api.simli.ai/static/audio",
      {
        faceId: avatar_id || process.env.SIMLI_FACE_ID,
        audioBase64,
        audioFormat: "mp3",
        audioSampleRate: 16000,
        audioChannelCount: 1,
        videoStartingFrame: 0,
      },
      {
        headers: {
          "x-simli-api-key": process.env.SIMLI_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    return response.data;
  } catch (err) {
    console.error("Simli Error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { sendAudioToSimli };
