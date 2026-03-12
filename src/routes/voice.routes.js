const express = require('express');
const router = express.Router();
// 1. Import the Twilio SDK
const VoiceResponse = require('twilio').twiml.VoiceResponse;

/**
 * Route: /incoming-call/:orgId
 * Twilio hits this when someone dials your number.
 */
router.all('/incoming-call/:orgId', (req, res) => {
    const { orgId } = req.params;
    
    // 2. Initialize the Twilio Voice Response builder
    const response = new VoiceResponse();
    
    // 3. Add a greeting
    response.say('Connecting to AI support.');
    
    // 4. Build the Stream connection
    const connect = response.connect();
    const stream = connect.stream({
        url: `wss://${req.headers.host}`
    });

    // 5. Pass the organization ID as a custom parameter to the WebSocket
    stream.parameter({
        name: 'orgId',
        value: orgId
    });

    res.type('text/xml');
    // 6. Convert the object to the final TwiML XML string
    res.send(response.toString());
});

module.exports = router;
