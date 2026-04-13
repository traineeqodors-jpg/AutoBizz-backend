const { Ollama } = require("ollama");
const ollama = new Ollama();

const getRagResponse = async (query, pineconeIndex, orgId) => {
  const embeddedQuery = await ollama.embed({
    model: "nomic-embed-text",
    input: query,
  });

  

  const index = pineconeIndex;
  const queryResponse = await index.namespace(String(orgId)).query({
    vector: embeddedQuery.embeddings[0],
    topK: 3,
    includeMetadata: true,
  });


  
  const contexts = queryResponse.matches
    .map((m) => m.metadata.chunk_text)
    .join("\n\n");


   
  // 1. ADD HUMAN EMOTION INSTRUCTIONS
   const systemPrompt = `You are a natural human assistant. 
STRICT RULES:
1. Use ONLY the provided Context to answer. 
2. If the answer is not in the Context, ONLY say: "I'm sorry, I don't have that information."
3. Your response MUST be 2 lines or fewer. No exceptions.
4. Speak directly. Do NOT use prefixes like "Based on the context" or "Answer:".
5. Keep it conversational but extremely brief.`;


 const response = await ollama.chat({
    model: "deepseek-v3.2:cloud",
    messages: [
      { role: "system", content: systemPrompt },
    
      { role: "user", content: `Context: ${contexts}\n\nQuestion: ${query}\n\nConstraint: Answer in 15 words or less.` },
    ],
    
    options: {
      num_predict: 20, 
      temperature: 0.3, 
    }

  });

  let cleanContent = response?.message?.content || "";
  cleanContent = cleanContent.replace(/^(Response|Answer|Assistant):\s*/i, "");
  return cleanContent;
};


const calculateLeadScore = async (transcript) => {
 const systemPrompt = `
You are an expert B2B lead-scoring model.

Analyze the full conversation between the prospect and the sales rep.
Assign a single integer score from 0 to 100 representing how qualified and likely the lead is to buy.

Use this rubric:
- Interest (0-40): responsiveness, engagement, asking questions, requesting pricing/demo, intent to continue.
- Need (0-35): clear pain point, urgency, business problem, fit for the product, value of solving it.
- Budget (0-25): explicit budget, willingness to pay, price acceptance, purchasing authority, approved funding.

Scoring rules:
- Be conservative when evidence is missing or ambiguous.
- Do not infer budget unless it is clearly stated or strongly implied.
- Do not reward politeness, small talk, or generic curiosity.
- Score higher only when there is strong evidence across all three factors.
- Use the prospect’s messages more than the salesperson’s.
- If the lead is unqualified, unresponsive, or shows no buying intent, score low.
- Round to the nearest whole number.

Score bands:
- 0-20: cold / unqualified
- 21-40: weak signal
- 41-60: moderate
- 61-80: strong
- 81-100: very strong / hot

Output rules:
- Return ONLY the numeric score.
- No words.
- No JSON.
- No punctuation or symbols.
`;

  try {

    const response = await ollama.chat({
      model: "deepseek-v3.2:cloud", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript:\n${transcript}` },
      ]
    });

    const content = response.message.content.trim();
    
  
    const match = content.match(/\d+/); 
    const rawScore = match ? match[0] : "0";

   
    const finalScore = Math.round(Number(rawScore));

    return { 
      score: isNaN(finalScore) ? 0 : finalScore 
    };

  } catch (error) {
    console.error("Scoring Error:", error.message);
    return { score: 0 };
  }
};

module.exports = { getRagResponse , calculateLeadScore };
