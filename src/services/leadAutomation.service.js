const { sendInterestEmail, generateLeadToken } = require("./emailServices");

const handleHighIntentLead = async (lead, org) => {
  if (!lead || !org) return;

  if (lead.confidence_score >= 80 && !lead.meeting_scheduled) {
    try {
      const token = generateLeadToken(lead.id);

      await sendInterestEmail(lead.email, token, org.businessName, org.email);

      console.log(`High intent flow triggered for lead ${lead.id}`);
    } catch (err) {
      console.error("Automation service failed:", err.message);
    }
  }
};

module.exports = { handleHighIntentLead };
