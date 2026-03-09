const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: "YOUR_OPENAI_API_KEY", 
});

const summarizePdf = async (filePath) =>   {
  try {
    
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "user_data",
    });

    // 2. Generate the summary using a model with file support
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Please provide a concise summary of this PDF." },
            { 
              type: "input_file", 
              file_id: file.id 
            },
          ],
        },
      ],
    });

    console.log("Summary:", response.choices[0].message.content);
    return response
  } catch (error) {
    console.error("Error summarizing PDF:", error);
  }
}

module.exports = summarizePdf;
