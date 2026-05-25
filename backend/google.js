const { google } = require("googleapis");
const { salvarTokensGoogle } = require("./banco");

const ESCOPOS = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me",
];

function criarClienteOAuth() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function obterUrlAutenticacao(sessionId) {
  return criarClienteOAuth().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ESCOPOS,
    state: sessionId,
  });
}

async function tratarRetornoOAuth(code, jid) {
  const { tokens } = await criarClienteOAuth().getToken(code);
  // Salva no banco de dados com a nossa nova função em português
  await salvarTokensGoogle(jid, tokens.access_token, tokens.refresh_token);
}

async function obterCursos(accessToken, refreshToken) {
  const auth = criarClienteOAuth();
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const { data } = await google
    .classroom({ version: "v1", auth })
    .courses.list({ courseStates: ["ACTIVE"], pageSize: 20 });

  return data.courses || [];
}

function formatarListaCursos(courses) {
  if (!courses.length) {
    return "Nenhuma disciplina ativa encontrada no Google Classroom.";
  }
  return (
    "Suas turmas sincronizadas:\n\n" +
    courses.map((c, i) => `${i + 1}️⃣ ${c.name}`).join("\n")
  );
}

module.exports = {
  criarClienteOAuth,
  obterUrlAutenticacao,
  tratarRetornoOAuth,
  obterCursos,
  formatarListaCursos,
};
