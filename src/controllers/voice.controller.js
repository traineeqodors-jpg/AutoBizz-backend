// const { createOpenAiBridge } = require('../services/openai.services');
// const { streamVoice } = require('../services/elevenlabs.services');
// const { attachCallLogger } = require('../middlewares/callLogger.middleware');

// const handleVoiceStream = (twilioWs) => {
//     let streamSid = null;
//     let logger = null; // Holds our logging functions

//     // 1. Define Interruption Logic
//     const onUserInterruption = () => {
//         if (streamSid && twilioWs.readyState === 1) {
//             twilioWs.send(JSON.stringify({ event: 'clear', streamSid }));
//             console.log("⏹️ Twilio buffer cleared.");
//         }
//     };

//     // 2. Bridge OpenAI to ElevenLabs + Logger
//     const openAiWs = createOpenAiBridge(
//         // Callback: When AI Text is ready (TTS)
//         async (text) => {
//             if (logger) logger.logEvent('assistant', text); // ✍️ Log AI Response
//             if (streamSid && twilioWs.readyState === 1) { 
//                 await streamVoice(text, twilioWs, streamSid);
//             }
//         },
//         // Callback: When User Interrupts
//         onUserInterruption,
//         // Callback: When User Text is ready (STT)
//         (userText) => {
//             if (logger) logger.logEvent('user', userText); // ✍️ Log User Input
//         }
//     );

//     twilioWs.on('message', (data) => {
//         const msg = JSON.parse(data);
        
//         if (msg.event === 'start') {
//             streamSid = msg.start.streamSid;
            
//             // 🚀 3. Initialize Logger Middleware
//             // Pulling phone numbers from Twilio's start event
//             logger = attachCallLogger(twilioWs, 1, { // Replace '1' with dynamic Org ID
//                 callSid: msg.start.callSid,
//                 from: msg.start.customParameters?.from || "Unknown",
//                 to: msg.start.customParameters?.to || "Unknown"
//             });

//             console.log(`Stream started: ${streamSid}`);
//         }
        
//         if (msg.event === 'media' && openAiWs.readyState === 1) {
//             openAiWs.send(JSON.stringify({ 
//                 type: 'input_audio_buffer.append', 
//                 audio: msg.media.payload 
//             }));
//         }
//     });

//     twilioWs.on('close', () => {
//         console.log("Call ended, closing AI connection.");
//         openAiWs.close();
//         // Note: attachCallLogger handles the DB 'create' automatically on this event
//     });
// };

// module.exports = { handleVoiceStream };
