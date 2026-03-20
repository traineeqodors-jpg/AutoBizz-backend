const db = require('../../db/models');
const Lead = db.Lead

const { Ollama } = require("ollama");
const ollama = new Ollama();

async function getLeadAnalysis(leads) {
  const results = [];

  for (const lead of leads) {
    const isCall = lead.message?.includes('[call]');
  const prompt = `
  ### ROLE
  You are an expert Sales Development Representative (SDR) specializing in Lead Qualification.
  
  ### INPUT DATA
  Lead ID: ${lead.id}
  Name: ${lead.name || 'Unknown'}
  Subject: ${lead.subject || 'N/A'}
  Message Content: "${lead.message}"
  Lead Type: ${isCall ? 'PHONE CALL TRANSCRIPT' : 'WEB FORM SUBMISSION'}

### SCORING ALGORITHM (MAX 100 POINTS - 10 POINTS PER CATEGORY)
1.  **PAIN CLARITY**: Does the user name a specific technical or business problem? (0-10)
2.  **URGENCY**: Mention of deadlines, "ASAP," or "losing money/time"? (0-10)
3.  **SPECIFICITY**: Do they name a product, SKU, or specific feature? (0-10)
4.  **AUTHORITY**: Corporate email or mentions of "we," "team," or "company"? (0-10)
5.  **TIMELINE**: Is there a stated launch date or project start? (0-10)
6.  **DECISION CRITERIA**: Are they asking about pricing, security, or integrations? (0-10)
7.  **QUANTIFIABILITY**: Do they mention numbers (e.g., "50 users," "10k records")? (0-10)
8.  **INTENT STRENGTH**: "I want to buy" vs. "I am just looking"? (0-10)
9.  **ENGAGEMENT QUALITY**: Is the grammar/structure professional or gibberish/spam? (0-10)
10. **CALL-TO-ACTION**: Did they request a meeting, demo, or specific callback? (0-10)
  ### MANDATORY PENALTIES (AUTO-FAIL)
  - If message is < 3 words (e.g., "hi", "hello", "test"): Set score to 0-5.
  - If message is vague/generic (e.g., "info please", "send details"): Max score 20.
  - If [call] and no callback number or request is present: Max score 15.

  ### OUTPUT INSTRUCTIONS
  Return ONLY a JSON object with this structure. No conversational filler.
  {
    "id": ${lead.id},
    "name" : ${lead.name || 'Unknown'}
    "score": number,
    "verdict": "HOT" | "WARM" | "COLD" | "SPAM",
    "is_potential_buyer": boolean,
    "is_spam": boolean,
    "analysis": {
      "need_identified": boolean,
      "urgency_level": "High" | "Medium" | "Low",
      "intent_summary": "string"
    },
    "reasoning": "Explain the score based on the algorithm above.",
    "recommended_action": "Specific next step for the sales team."
  }
`;


    try {
      const response = await ollama.generate({
        model: 'tinyllama:1.1b',
        prompt: prompt,
        format: 'json',
        stream: false
      });

      // Parse the AI response and add it to our results array
      const analysis = JSON.parse(response.response);
      results.push(analysis);

    } catch (error) {
      results.push({ id: lead.id, error: "Failed to analyze lead" });
    }
  }

  return results; // This returns the final data for your use
}

module.exports = {  getLeadAnalysis}
