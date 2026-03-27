const localtunnel = require('localtunnel');
const twilio = require('twilio');
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
let globalTunnelUrl = "";


(async () => {
  const tunnel = await localtunnel({ port: 5000 });
  globalTunnelUrl = tunnel.url;
  console.log(`Public Webhook Active: ${globalTunnelUrl}`);
  
  tunnel.on('close', () => { console.log("xf Tunnel Closed"); });
})();


const generateSupportNumber = asyncHandler(async (req, res) => {
  const { orgId } = req.body;

  if (!globalTunnelUrl) {
    throw new Error("Tunnel not ready yet. Please try again in a moment.");
  }

  // A. Find an available number (US Local as example)
  const available = await client.availablePhoneNumbers('US').local.list({ limit: 1 });
  if (available.length === 0) throw new Error("No numbers available");

  const selectedNumber = available[0].phoneNumber;

  // B. Purchase and Configure Webhooks Programmatically
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: selectedNumber,
    friendlyName: `Org ${orgId} Support Line`,
    // Use the dynamic tunnel URL for the webhooks
    voiceUrl: `${globalTunnelUrl}/api/voice/initiate?orgId=${orgId}`,
    statusCallback: `${globalTunnelUrl}/api/voice/callback?orgId=${orgId}`,
    statusCallbackMethod: 'POST'
  });

  return res.status(200).json(
    new ApiResponse(200, {
      phoneNumber: purchased.phoneNumber,
      sid: purchased.sid,
      webhook: purchased.voiceUrl
    }, "Support Number Generated Successfully")
  );
});

module.exports = { generateSupportNumber };
