const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const { Readable } = require("stream");
const fs = require('fs');
const path = require('path');

const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_KEY,
});

const generateAudio = async (text) => {
    if (!text) return null;

    try {
        // 1. Using Turbo v2.5 for Ultra-Low Latency (Fixes Twilio Timeouts)
        const response = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
            outputFormat: "mp3_44100_128",
            text: text, 
            modelId: "eleven_turbo_v2_5", // ⚡ Changed from multilingual_v2
            voice_settings: {
                stability: 0.40,       
                similarity_boost: 0.80,
                style: 0.35,            
                use_speaker_boost: true
            }
        });

        const audioDir = path.join(process.cwd(), 'public', 'audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        const fileName = `reply-${Date.now()}.mp3`;
        const filePath = path.join(audioDir, fileName);
        const fileStream = fs.createWriteStream(filePath);
        
        // Convert response to a readable stream
        const audioStream = Readable.from(response);

        return new Promise((resolve, reject) => {
            audioStream.pipe(fileStream);
            fileStream.on('finish', () => {
                console.log(`⚡ Turbo Audio saved: ${fileName}`);
                
                // 💡 Background Clean-up: Delete files older than 5 minutes
                cleanOldAudio(audioDir);
                
                resolve(fileName);
            });
            fileStream.on('error', (err) => {
                console.error("Stream Pipe Error:", err);
                reject(null);
            });
        });

    } catch (error) {
        console.error("ElevenLabs SDK Error:", error);
        return null;
    }
};

// Simple helper to delete old files and save disk space
const cleanOldAudio = (dir) => {
    fs.readdir(dir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stat) => {
                if (!err && (now - stat.mtimeMs) > 300000) { // 5 minutes
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
};

module.exports = { generateAudio };
