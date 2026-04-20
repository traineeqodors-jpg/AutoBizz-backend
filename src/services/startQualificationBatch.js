const db = require("../../db/models");
const Lead = db.Lead;

const startQualificationBatch = async ({ leadIds, orgId, io }) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  const leads = await Lead.findAll({ where: { id: leadIds } });

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (!lead.phone || !phoneRegex.test(lead.phone.replace(/\s/g, ""))) {
      io.to(`user_${orgId}`).emit(`batch-update-${orgId}`, {
        message: `Skipping ${lead.name}: Invalid format`,
        status: "warning",
      });
      continue;
    }

    try {
      const lookup = await client.lookups.v2.phoneNumbers(lead.phone).fetch();

      if (!lookup.valid) {
        throw new Error("Number not reachable");
      }

      await client.calls.create({
        to: lead.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${BASE_URL}/api/voice?orgId=${orgId}&leadId=${lead.id}`,
      });

      io.to(`user_${orgId}`).emit(`batch-update-${orgId}`, {
        message: `Calling ${lead.name}...`,
        current: i + 1,
        total: leads.length,
        status: "processing",
      });
    } catch (err) {
      io.to(`user_${orgId}`).emit(`batch-update-${orgId}`, {
        message: `Error calling ${lead.name}: ${err.message}`,
        status: "error",
      });
    }
  }

  io.to(`user_${orgId}`).emit(`batch-update-${orgId}`, {
    message: "Batch qualification finished!",
    status: "success",
  });
};

module.exports = {
  startQualificationBatch,
};
