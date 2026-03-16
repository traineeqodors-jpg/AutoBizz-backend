const twilio = require('twilio');

// Initialize with your ENV variables
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const triggerAICall = async (toPhoneNumber, orgId) => {
  try {
    const call = await client.calls.create({
      // 1. Where Twilio goes for AI logic after the user answers
      url: `${process.env.BASE_URL}api/voice?orgId=${orgId}`,
      
      // 2. The recipient (must be a Verified Caller ID if on Trial)
      to: toPhoneNumber,
      
      // 3. Your purchased Twilio US Number
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log(`🚀 Call started! SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error("❌ Twilio SDK Error:", error.message);
    throw error;
  }
};

module.exports = { triggerAICall };
