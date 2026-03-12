const db = require("../../db/models");
db.CallLog = db.CallLog
/**
 * Call Logger Middleware
 * Captures metadata and transcript, then saves to DB on close.
 */
const attachCallLogger = (twilioWs, orgId, initialData) => {
    // 1. Initialize the live data object
    const callData = {
        callSid: initialData.callSid,
        from: initialData.from,
        to: initialData.to,
        status: 'in-progress',
        transcript: [],
        startTime: Date.now(),
        organizationId: orgId
    };

    // 2. Return helper functions to update the log during the call
    const logEvent = (role, text) => {
        callData.transcript.push({ role, text, time: new Date() });
    };

    // 3. Attach the "Auto-Save" logic to the WebSocket close event
    twilioWs.on('close', async () => {
        const duration = Math.floor((Date.now() - callData.startTime) / 1000);
        
        try {
            await CallLog.create({
                callSid: callData.callSid,
                from: callData.from,
                to: callData.to,
                duration: duration,
                status: 'completed',
                transcript: JSON.stringify(callData.transcript),
                organizationId: callData.organizationId
            });
            console.log(`\n✅ Call Logged to DB: ${callData.callSid} (${duration}s)`);
        } catch (err) {
            console.error("❌ Middleware DB Error:", err.message);
        }
    });

    return { logEvent };
};

module.exports = { attachCallLogger };
