const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const { asyncHandler } = require("../../utils/asyncHandler");

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Converts text to speech using the new stream method
 * @param {string} text - The AI generated response
 * @param {object} twilioWs - The active Twilio WebSocket
 * @param {string} streamSid - The unique ID for the current call
 */

const streamVoice = asyncHandler(async (text, twilioWs, streamSid) => {
    // New SDK method: textToSpeech.stream(voiceId, options)
    const audioStream = await elevenlabs.textToSpeech.stream(
        process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM", // Use explicit Voice ID
        {
            model_id: "eleven_turbo_v2_5", 
            text: text,
            output_format: "ulaw_8000", // Required for Twilio telephony
        }
    );

    // The stream returned is an async iterable
    for await (const chunk of audioStream) {
        if (twilioWs.readyState === 1) { // 1 = OPEN
            twilioWs.send(JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                media: {
                    payload: chunk.toString('base64')
                }
            }));
        }
    }
});

module.exports = { streamVoice };
