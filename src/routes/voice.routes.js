// const express = require('express');
// const router = express.Router();

// // This matches the URL you put in the Twilio Console
// // e.g., https://your-domain.com
// router.all('/incoming-call', (req, res) => {
//     res.type('text/xml');
    
//     // TwiML tells Twilio to start streaming audio to our WebSocket
//     res.send(`
//         <Response>
//             <Say>Connecting to AI support.</Say>
//             <Connect>
//                 <Stream url="wss://${req.headers.host}" />
//             </Connect>
//         </Response>
//     `);
// });

// module.exports = router;
