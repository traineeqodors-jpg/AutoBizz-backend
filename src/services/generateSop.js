// const { OpenAI } = require('openai');
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const pdf = require("pdf-parse")
// const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

// //app.use(fileupload())





/**
 * Fast Parallel API Route
 */
// app.post('/upload-pdf', upload.single('document'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });

//         // 1. Extract & Chunk
//         const { text: fullText } = await pdf(req.file.buffer);
//         const splitter = new RecursiveCharacterTextSplitter({ 
//             chunkSize: 12000, 
//             chunkOverlap: 1000 
//         });
//         const chunks = await splitter.splitText(fullText);

//         // 2. Fire all API calls at once (Parallel Processing)
//         // This cuts the total time down to the duration of the longest single chunk
//         const chunkPromises = chunks.map(chunk => getChunkDraft(chunk));
//         const finalSOPParts = await Promise.all(chunkPromises);

//         // 3. Return final combined JSON
//         res.status(200).json({ 
//             success: true, 
//             sop: finalSOPParts.join('\n\n---\n\n') 
//         });

//     } catch (error) {
//         console.error("SOP Parallel Error:", error);
//         res.status(500).json({ success: false, error: "Failed to generate SOP" });
//     }
// });


// async function getChunkDraft(chunk) {
//     const response = await openai.chat.completions.create({
//         model: "gpt-4o",
//         messages: [
//             { role: "system", content: "You are a professional SOP writer." },
//             { role: "user", content: getSOPPrompt(chunk) }
//         ],
//         temperature: 0.3,
//     });
//     return response.choices[0].message.content;
// }

// function getSOPPrompt(text) {
//     return `
//     ### INSTRUCTION ###
//     Analyze the provided technical text and draft a formal, high-quality Standard Operating Procedure (SOP). 
//     Your goal is to transform messy, extracted text into a clear, actionable guide for employees.

//     ### FORMATTING REQUIREMENTS ###
//     1. **Title**: Professional and descriptive.
//     2. **SOP ID & Version**: Placeholder [e.g., SOP-XXX, v1.0].
//     3. **Purpose**: 1-2 sentences explaining why this process exists.
//     4. **Scope**: Define who this applies to and when it should be used.
//     5. **Responsibilities**: Bulleted list of roles involved (e.g., Technician, Supervisor).
//     6. **Definitions**: Explain any technical jargon or acronyms found in the text.
//     7. **Procedure (The Core)**: 
//        - Use a numbered list for sequential steps.
//        - Start every step with a strong **action verb** (e.g., "Connect," "Verify," "Input").
//        - Use bolding for key UI elements or physical components.
//     8. **Safety/Compliance**: Highlight critical warnings or regulatory requirements.
//     9. **Troubleshooting**: A brief table of common issues and solutions if applicable.

//     ### STYLE GUIDELINES ###
//     - Use "Active Voice" only.
//     - Keep sentences short and concise.
//     - Use a professional, objective tone.

//     ### INPUT DATA ###
//     """
//     ${text}
//     """
    
//     ### FINAL CHECK ###
//     Review your draft. Ensure no critical steps from the input are missing and that the logic follows a chronological order.
//     `;
// }


// //Sample Route

// // Note the 'upload.single' middleware here
// app.post('/upload-pdf', upload.single('document'), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).send({ error: 'No PDF file uploaded.' });
//         }

//         // 1. Extract text from the Multer buffer
//         const parsedPdf = await pdf(req.file.buffer);
//         const fullText = parsedPdf.text;

//         // 2. Set headers for SSE (Streaming)
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');

//         // 3. Chunk text for Medium PDF handling
//         const splitter = new RecursiveCharacterTextSplitter({
//             chunkSize: 12000, 
//             chunkOverlap: 1000
//         });
//         const chunks = await splitter.splitText(fullText);

//         // 4. Process chunks and stream
//         for (let i = 0; i < chunks.length; i++) {
//             const stream = await openai.chat.completions.create({
//                 model: "gpt-4o",
//                 messages: [
//                     { role: "system", content: "You are a professional SOP writer." },
//                     { role: "user", content: getSOPPrompt(chunks[i]) }
//                 ],
//                 stream: true,
//             });

//             for await (const part of stream) {
//                 const text = part.choices?.delta?.content || "";
//                 if (text) {
//                     // Send data in SSE format
//                     res.write(`data: ${JSON.stringify({ text })}\n\n`);
//                 }
//             }
//         }

//         res.write('data: [DONE]\n\n');
//         res.end();

//     } catch (error) {
//         console.error("SOP Generation Error:", error);
//         if (!res.headersSent) {
//             res.status(500).send({ error: "Failed to process PDF" });
//         } else {
//             res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
//             res.end();
//         }
//     }
// });
