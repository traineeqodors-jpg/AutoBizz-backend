require("dotenv").config()
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function buyAndConfigureNumber() {
  try {
    
    const localNumbers = await client.availablePhoneNumbers('US')
      .local
      .list({ limit: 1 });

    if (localNumbers.length === 0) {
      console.log('No numbers found.');
      return;
    }

    const selectedNumber = localNumbers[0].phoneNumber;

    // Step 2: Purchase the number
    const purchasedNumber = await client.incomingPhoneNumbers
      .create({
        phoneNumber: selectedNumber,
        
        voiceUrl: `${process.env.BASE_URL}/api/voice?orgId=12`,
        voiceMethod: 'POST'
      });

    console.log(`Purchased & Configured: ${purchasedNumber.sid}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

buyAndConfigureNumber();
