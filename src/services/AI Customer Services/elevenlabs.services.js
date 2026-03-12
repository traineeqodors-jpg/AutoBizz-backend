// const { ElevenLabsClient } = require("elevenlabs");

// const elevenlabs = new ElevenLabsClient({
//     apiKey: process.env.ELEVENLABS_API_KEY,
// });

// /**
//  * Converts text to speech and streams it to Twilio
//  * @param {string} text - The AI generated response
//  * @param {object} twilioWs - The active Twilio WebSocket
//  * @param {string} streamSid - The unique ID for the current call
//  */
// const streamVoice = async (text, twilioWs, streamSid) => {
//     try {
//         const audioStream = await elevenlabs.generate({
//             voice: process.env.ELEVENLABS_VOICE_ID || "Rachel", 
//             model_id: "eleven_turbo_v2_5", // Lowest latency model
//             text: text,
//             output_format: "ulaw_8000", // CRITICAL: Twilio required format
//         });

//         // Pipe audio chunks from ElevenLabs to Twilio
//         for await (const chunk of audioStream) {
//             // Check if connection is still open before sending
//             if (twilioWs.readyState === 1) { 
//                 twilioWs.send(JSON.stringify({
//                     event: 'media',
//                     streamSid: streamSid,
//                     media: {
//                         payload: chunk.toString('base64')
//                     }
//                 }));
//             }
//         }
//     } catch (error) {
//         console.error("❌ ElevenLabs Error:", error.message);
//     }
// };

// module.exports = { streamVoice };
