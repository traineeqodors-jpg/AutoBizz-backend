const db = require('../../db/models');
const Lead = db.Lead

const { Ollama } = require("ollama");
const ollama = new Ollama();

async function getLeadAnalysis(leads) {
  const results = [];

  for (const lead of leads) {
    const prompt = `
      Analyze this Sales Lead and return ONLY JSON.
      
      LEAD DATA:
      - Name: ${lead.name || 'Unknown'}
      - Message: "${lead.message}"

      RULES:
      1. Score 0-100 based on intent to buy.
      2. If message is < 3 words or "test", Score = 0, Verdict = SPAM.
      3. Reasoning must be 1 sentence only.
      4. No conversational filler.

      OUTPUT FORMAT:
      {
        "id": ${lead.id},
        "score": number,
        "verdict": "HOT" | "WARM" | "COLD" | "SPAM",
        "reasoning": "string (max 15 words)",
        "recommended_action": "string (max 10 words)"
      }
    `;

    try {
      const response = await ollama.generate({
        model: 'llama3', 
        prompt: prompt,
        format: 'json',
        stream: false
      });

      const analysis = JSON.parse(response.response);
      results.push(analysis);

    } catch (error) {
      results.push({ id: lead.id, score: 0, verdict: "ERROR" });
    }
  }
  return results;
}

module.exports = {  getLeadAnalysis}
