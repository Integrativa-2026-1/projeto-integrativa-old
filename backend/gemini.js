const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo padrão para o chat assistente conversacional geral
const modeloConversacional = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
  systemInstruction: "Você é um assistente acadêmico útil dentro de um bot do WhatsApp. Responda de forma natural, amigável e breve em português.",
});

/**
 * Envia uma pergunta geral de conversação acadêmica para o Gemini.
 * @param {string} mensagemUsuario 
 * @returns {Promise<string|null>} Resposta da IA
 */
async function perguntarGemini(mensagemUsuario) {
  if (!mensagemUsuario || typeof mensagemUsuario !== "string" || !mensagemUsuario.trim()) {
    return null;
  }

  try {
    const resultado = await modeloConversacional.generateContent(mensagemUsuario.trim());
    return resultado.response.text();
  } catch (erro) {
    console.error("Erro ao comunicar com o Gemini (conversacional):", erro.message);
    return "Desculpe, ocorreu um erro ao processar sua resposta. Pode tentar novamente?";
  }
}

/**
 * Classifica semanticamente a escolha de plataforma educacional do usuário usando Gemini.
 * Retorna exatamente o formato JSON solicitado: { "platform": "AVA" | "GOOGLE" | "UNKNOWN" }
 * @param {string} mensagemUsuario 
 * @returns {Promise<Object>} Resposta contendo a plataforma classificada
 */
async function classificarPlataforma(mensagemUsuario) {
  if (!mensagemUsuario || typeof mensagemUsuario !== "string" || !mensagemUsuario.trim()) {
    return { platform: "UNKNOWN" };
  }

  const promptDeClassificacao = `You are a strict classification system.

Your task is to classify the user's message into one of the following options:

- "AVA"
- "GOOGLE"
- "UNKNOWN"

Rules:
- "AVA" means the user selected or refers to AVA, Moodle, or virtual learning environment.
- "GOOGLE" means the user selected or refers to Google Classroom or Google.
- If the message is unclear, ambiguous, or unrelated, return "UNKNOWN".
- Do NOT explain anything.
- Do NOT add extra text.
- Return ONLY valid JSON.

User message:
"${mensagemUsuario.trim()}"

Return format:
{
  "platform": "AVA" | "GOOGLE" | "UNKNOWN"
}`;

  try {
    // Configura o modelo específico para garantir o retorno no formato JSON estruturado
    const modeloClassificador = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const resultado = await modeloClassificador.generateContent(promptDeClassificacao);
    const textoResposta = resultado.response.text().trim();
    console.log("[Gemini Classificador] Resposta bruta da IA:", textoResposta);

    const jsonResposta = JSON.parse(textoResposta);
    return {
      platform: jsonResposta.platform || "UNKNOWN"
    };
  } catch (erro) {
    console.error("[Gemini Classificador] Falha na classificação ou no parse:", erro.message);
    
    // Fallback manual robusto via Regex caso a IA falhe por limite ou conectividade
    const textoFormatado = mensagemUsuario.toLowerCase();
    if (textoFormatado.includes("ava") || textoFormatado.includes("moodle") || textoFormatado.includes("virtual")) {
      return { platform: "AVA" };
    }
    if (textoFormatado.includes("google") || textoFormatado.includes("classroom") || textoFormatado.includes("sala de aula")) {
      return { platform: "GOOGLE" };
    }
    return { platform: "UNKNOWN" };
  }
}

module.exports = {
  perguntarGemini,
  classificarPlataforma,
};
