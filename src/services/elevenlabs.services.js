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
       
        
        const response = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
            outputFormat: "mp3_44100_128",
            text: text, 
            modelId: "eleven_multilingual_v2",
            // 2. CRITICAL FOR EMOTION:
            voice_settings: {
                stability: 0.35,       
                similarity_boost: 0.80,
                style: 0.45,            
                use_speaker_boost: true
            }
        });

        const audioStream = Readable.from(response);
        const audioDir = path.join(process.cwd(), 'public', 'audio');
        
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        const fileName = `reply-${Date.now()}.mp3`;
        const filePath = path.join(audioDir, fileName);
        const fileStream = fs.createWriteStream(filePath);
        
        return new Promise((resolve, reject) => {
            audioStream.pipe(fileStream);
            fileStream.on('finish', () => {
                console.log(`Human-like Audio saved: ${fileName}`);
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

module.exports = { generateAudio };
