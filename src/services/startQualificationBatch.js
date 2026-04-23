const db = require("../../db/models");
const Lead = db.Lead;

const startQualificationBatch = async (
  leadIds,
  orgId,
  io,
  client,
  BASE_URL,
) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  const socketDelay = () => new Promise((resolve) => setTimeout(resolve, 2000));

  const leads = await Lead.findAll({ where: { id: leadIds } });

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (!lead.phone || !phoneRegex.test(lead.phone.replace(/\s/g, ""))) {
      console.error(`Skipping ${lead.name}: Malformed number ${lead.phone}`);

      io.emit(`batch-update-${orgId}`, {
        message: `Skipping ${lead.name}: Invalid format`,
        status: "warning",
      });

      await socketDelay();
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 6000));

    try {
      const lookup = await client.lookups.v2.phoneNumbers(lead.phone).fetch();

      if (!lookup.valid) {
        throw new Error(
          "Number is technically valid but not reachable/active.",
        );
      }

      await client.calls.create({
        to: lead.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${BASE_URL}/api/voice?orgId=${orgId}&leadId=${lead.id}`,
        method: "POST",
        statusCallback: `${BASE_URL}/api/voice/callback?orgId=${orgId}&leadId=${lead.id}`,
        statusCallbackEvent: ["completed"],
      });

      io.emit(`batch-update-${orgId}`, {
        message: `Calling ${lead.name}...`,
        current: i + 1,
        total: leads.length,
        status: "processing",
      });
      await socketDelay();

      console.log("Working of calls");
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 21211)
        errorMessage = "Invalid 'To' Phone Number (Twilio Check).";
      if (err.code === 21614)
        errorMessage = "To number is not a valid mobile/landline.";
      if (err.code === 21408)
        errorMessage =
          "Permission denied for this country (check Geo-Permissions).";

      console.error(`Twilio Error [${lead.name}]:`, errorMessage);

      io.emit(`batch-update-${orgId}`, {
        message: `Error calling ${lead.name}: ${errorMessage}`,
        status: "error",
      });

      await socketDelay();
    }
  }

  io.emit(`batch-update-${orgId}`, {
    message: "Batch qualification finished!",
    status: "success",
  });
};

module.exports = { startQualificationBatch };
