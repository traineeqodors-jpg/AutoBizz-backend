const WebSocket = require('ws');
const { queryRAG } = require('../../services/rag.services');

/**
 * Creates a bridge to OpenAI Realtime API
 * @param {Function} onAiTextReady - Callback for GPT's response text (for TTS)
 * @param {Function} onUserInterruption - Callback for VAD speech started
 * @param {Function} onUserTextReady - Callback for Whisper STT (for Logging)
 */
const createOpenAiBridge = (onAiTextReady, onUserInterruption, onUserTextReady) => {
    const ws = new WebSocket('wss://://api.openai.com', {
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1"
        }
    });

    ws.on('open', () => {
        // Initialize the session with RAG tools and STT enabled
        ws.send(JSON.stringify({
            type: 'session.update',
            session: {
                instructions: "You are a professional support agent. Use 'search_manual' for business info. Keep answers brief (1-2 sentences).",
                tools: [{
                    type: "function",
                    name: "search_manual",
                    description: "Queries the business manual for pricing and policies.",
                    parameters: { type: "object", properties: { query: { type: "string" } } }
                }],
                input_audio_transcription: { model: 'whisper-1' }, // Enables STT
                turn_detection: { type: 'server_vad' } // Enables Interruption Detection
            }
        }));
    });

    ws.on('message', async (data) => {
        const event = JSON.parse(data);

        // 1. HANDLE USER INTERRUPTION (VAD)
        if (event.type === 'input_audio_buffer.speech_started') {
            console.log(" OpenAI detected user speech.");
            onUserInterruption();
        }

        // 2. HANDLE USER TRANSCRIPTION (STT for Logging)
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
            console.log("👤 User said:", event.transcript);
            onUserTextReady(event.transcript);
        }

        // 3. HANDLE RAG TOOL CALLS
        if (event.type === 'response.done' && event.response.output) {
            const toolCall = event.response.output.find(o => o.type === 'tool_call');
            if (toolCall && toolCall.name === 'search_manual') {
                const { query } = JSON.parse(toolCall.arguments);
                const result = await queryRAG(query);
                
                ws.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: { type: 'function_call_output', call_id: toolCall.call_id, output: result }
                }));
                ws.send(JSON.stringify({ type: 'response.create' }));
            }
        }

        // 4. HANDLE AI RESPONSE TEXT (for ElevenLabs)
        if (event.type === 'response.audio_transcript.done') {
            console.log("🤖 AI said:", event.transcript);
            onAiTextReady(event.transcript);
        }
    });

    ws.on('error', (err) => console.error("❌ OpenAI WS Error:", err.message));

    return ws;
};

module.exports = { createOpenAiBridge };
