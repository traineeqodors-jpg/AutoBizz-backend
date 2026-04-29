const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_KEY,
});

const generateAudio = async (text) => {
  if (!text) return null;

  // add natural pauses
  const speechText = text.replace(/\n/g, "... ");

  // "rCmVtv8cYU60uhlsOo1M"
  try {
    const response = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
      outputFormat: "mp3_44100_128",
      text: speechText,
      modelId: "eleven_turbo_v2_5",
      voice_settings: {
        stability: 0.25,
        similarity_boost: 0.7,
        style: 0.8,
        use_speaker_boost: true,
      },
    });

    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const fileName = `reply-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);
    const fileStream = fs.createWriteStream(filePath);

    const audioStream = Readable.from(response);

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

module.exports = { generateAudio };
