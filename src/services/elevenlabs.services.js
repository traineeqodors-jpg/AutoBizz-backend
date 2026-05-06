const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const { default: axios } = require("axios");

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_KEY,
});

const generateAudio = async (text) => {
  if (!text) return null;

  // add natural pauses
  const speechText = text.replace(/\n/g, "... ");

  try {
    // const response = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
    //   outputFormat: "mp3_22050_32",
    //   text: speechText,
    //   modelId: "eleven_flash_v2",
    //   voice_settings: {
    //     stability: 0.25,
    //     similarity_boost: 0.7,
    //     style: 0.8,
    //     use_speaker_boost: true,
    //   },
    // });

    const response = await axios.post(
      "https://api.cartesia.ai/tts/bytes",
      {
        model_id: "sonic-3.5",
        transcript: speechText,
        voice: { mode: "id", id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4" },
        output_format: {
          container: "mp3",
          encoding: "pcm_f32le",
          sample_rate: 16000,
          bit_rate: 32000,
        },
        language: "en",
        save: false,
        generation_config: {
          volume: 1,
          speed: 1,
          emotion: "neutral",
        },
      },
      {
        headers: {
          "Cartesia-Version": "2026-03-01",
          Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      },
    );

    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const fileName = `reply-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);
    const fileStream = fs.createWriteStream(filePath);

    const audioStream = response.data;

    return new Promise((resolve, reject) => {
      audioStream.pipe(fileStream);

      fileStream.on("finish", () => {
        console.log(`⚡ Turbo Audio saved: ${fileName}`);
        cleanOldAudio(audioDir);
        resolve(fileName);
      });
      fileStream.on("error", (err) => {
        console.error("Stream Pipe Error:", err);
        reject(null);
      });
    });
  } catch (error) {
    console.error("ElevenLabs SDK Error:", error);
    return null;
  }
};

const cleanOldAudio = (dir) => {
  fs.readdir(dir, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stat) => {
        if (!err && now - stat.mtimeMs > 300000) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
};

const createTTSAudio = async (text, voice_id) => {
  if (!text) return null;

  const speechText = text.replace(/\n/g, "... ");

  try {
    const response = await axios.post(
      "https://api.cartesia.ai/tts/bytes",
      {
        model_id: "sonic-3.5",
        transcript: speechText,
        voice: {
          mode: "id",
          id: voice_id || process.env.CARTESIA_VOICE_ID,
        },
        output_format: {
          container: "mp3",
          encoding: "pcm_f32le",
          sample_rate: 22050,
          bit_rate: 64000,
        },
        language: "en",
        generation_config: {
          volume: 1,
          speed: 1,
          emotion: "neutral",
        },
      },
      {
        headers: {
          "Cartesia-Version": "2026-03-01",
          Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      },
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error("Cartesia TTS Error:", error.response?.data || error.message);
    return null;
  }
};
module.exports = { generateAudio, createTTSAudio };
