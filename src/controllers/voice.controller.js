const { createOpenAiBridge } = require('../services/AI Customer Services/openai.services.js');
const { streamVoice } = require('../services/AI Customer Services/elevenlabs.services.js');
const { attachCallLogger } = require('../middlewares/callLogger.middleware');

const handleVoiceStream = (twilioWs) => {
    let streamSid = null;
    let logger = null;
    let organizationId = null; // Store the ID globally for this call

    const onUserInterruption = () => {
        if (streamSid && twilioWs.readyState === 1) {
            twilioWs.send(JSON.stringify({ event: 'clear', streamSid }));
        }
    };

    // 1. Initialize OpenAI Bridge
    const openAiWs = createOpenAiBridge(
        // On AI Text Ready (TTS)
        async (text) => {
            if (logger) logger.logEvent('assistant', text);
            if (streamSid) await streamVoice(text, twilioWs, streamSid);
        },
        // On Interruption
        onUserInterruption,
        // On User Text Ready (STT)
        (userText) => {
            if (logger) logger.logEvent('user', userText);
        },
        //  PASS THE ORGID TO RAG (If your RAG service needs it)
        
    );

    twilioWs.on('message', (data) => {
        const msg = JSON.parse(data);
        
        if (msg.event === 'start') {
            streamSid = msg.start.streamSid;
            
            //  EXTRACT THE ORGID FROM CUSTOM PARAMETERS
            // This matches the <Parameter name="orgId"> from your Routes
            organizationId = msg.start.customParameters?.orgId || "default";

            console.log(` Call Started for Org: ${organizationId} | Stream: ${streamSid}`);

            // 3. Initialize Logger with the extracted ID
            logger = attachCallLogger(twilioWs, organizationId, {
                callSid: msg.start.callSid,
                from: msg.start.customParameters?.from || "Unknown",
                to: msg.start.customParameters?.to || "Unknown"
            });
        }
        
        if (msg.event === 'media' && openAiWs.readyState === 1) {
            openAiWs.send(JSON.stringify({ 
                type: 'input_audio_buffer.append', 
                audio: msg.media.payload 
            }));
        }
    });

    twilioWs.on('close', () => {
        openAiWs.close();
    });
};

module.exports = { handleVoiceStream };
