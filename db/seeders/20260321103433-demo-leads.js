'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const leads = [];
    
    const leadScenarios = [
      { sub: "AI Response Delay", msg: "I noticed a 3-second lag in the AI response during my last test call. How can we optimize the latency for a smoother conversation?" },
      { sub: "Pricing for Startups", msg: "We are a small team looking to handle 500 calls a month. Do you have a specialized plan for early-stage startups?" },
      { sub: "Pinecone Integration", msg: "I am having trouble syncing my custom PDF knowledge base with the Pinecone index. Can you provide the correct metadata format?" },
      { sub: "Twilio Webhook Error", msg: "My Twilio console is showing 11200 errors when hitting the handle-ai endpoint. Is there a specific header I need to set?" },
      { sub: "Multi-language Support", msg: "Does AutoBizz support Hindi or Spanish for the text-to-speech output? Our target audience is bilingual." },
      { sub: "Outbound Campaign", msg: "We want to use the platform for automated appointment reminders. Can we schedule outbound calls via the API?" },
      { sub: "Custom Voice Models", msg: "The current AI voice sounds a bit robotic. Can we integrate ElevenLabs or use a custom cloned voice for our brand?" },
      { sub: "CRM Sync Request", msg: "Is there a way to automatically push the call transcript and confidence score directly into our Salesforce or HubSpot CRM?" },
      { sub: "Security & Privacy", msg: "Where are the call recordings stored? We need to ensure GDPR compliance for our European clients." },
      { sub: "Demo Request", msg: "I saw the AutoBizz demo on LinkedIn. I'd like to see how the RAG system handles complex technical queries in real-time." }
    ];

    const names = ["Arjun Mehta", "Priya Sharma", "Rohan Gupta", "Sanya Malhotra", "Vikram Singh", "Anjali Rao", "Kabir Khan", "Neha Patel", "Aman Verma", "Sneha Reddy"];

    for (let i = 0; i < 100; i++) {
      const scenario = leadScenarios[i % leadScenarios.length];
      const name = names[i % names.length] + " " + (i + 1);

      leads.push({
        orgId: 12,
        name: name,
        phone: `+919081${Math.floor(100000 + Math.random() * 900000)}`,
        email: `lead${i + 1}@autobizz-client.com`,
        subject: scenario.sub,
        message: `${scenario.msg} (Ref ID: AB-${1000 + i})`,
        confidence_score: Math.floor(Math.random() * 40) + 60, // Scores between 60-100 for high quality
        createdAt: new Date(Date.now() - (i * 3600000)), // Each lead created 1 hour apart
        updatedAt: new Date()
      });
    }

    return queryInterface.bulkInsert('Leads', leads, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Leads', { orgId: 12 }, {});
  }
};
