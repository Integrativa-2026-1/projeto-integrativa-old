const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );

  const data = await res.json();
  console.log(data.models);
  return data.models;
}
// listModels().then(models => console.log(models));

const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
  systemInstruction: "You are a helpful assistant inside a WhatsApp bot. Respond naturally and briefly.",
});

async function askGemini(userMessage) {
  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    return null;
  }

  const result = await model.generateContent(userMessage.trim());
  return result.response.text();
}

module.exports = { askGemini };
