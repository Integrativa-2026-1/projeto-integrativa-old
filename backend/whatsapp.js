const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");

const { findUser } = require("./db");
const { getCourses, formatCourseList } = require("./google");
const { askGemini } = require("./gemini");

const AUTH_DIR = path.join(__dirname, "../auth");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const LOGIN_COMPLETED = /^login\s+completed$/i;

let latestQR = null;
function getLatestQR() { return latestQR; }

async function handleMessage(sock, from, text) {
  if (!text) return;

  const user = await findUser(from).catch(() => null);

  if (LOGIN_COMPLETED.test(text)) {
    if (!user?.google_access_token) {
      const loginUrl = `${BASE_URL}/auth/google/start?sessionId=${encodeURIComponent(from)}`;
      return sock.sendMessage(from, {
        text: `It looks like your account isn't linked yet. Please log in first:\n\n${loginUrl}`,
      });
    }
    try {
      const courses = await getCourses(user.google_access_token, user.google_refresh_token);
      return sock.sendMessage(from, { text: formatCourseList(courses) });
    } catch (err) {
      console.error("Classroom error:", err.message);
      return sock.sendMessage(from, { text: "Failed to retrieve your courses. Please try again later." });
    }
  }

  if (!user?.google_access_token) {
    const loginUrl = `${BASE_URL}/auth/google/start?sessionId=${encodeURIComponent(from)}`;
    return sock.sendMessage(from, {
      text: `To submit your assignments using WhatsApp Assistant, please log in with your Google account.\n\n${loginUrl}`,
    });
  }

  const reply = await askGemini(text);
  if (reply) await sock.sendMessage(from, { text: reply });
}

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) { latestQR = qr; console.log("QR code disponível em /qr"); }
    if (connection === "open") { latestQR = null; console.log("WhatsApp conectado."); }
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(`Conexão encerrada (${statusCode}). ${loggedOut ? "Sessão encerrada." : "Reconectando..."}`);
      if (!loggedOut) setTimeout(() => startWhatsApp(), 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const from = msg.key.remoteJid;
      if (!from || from.endsWith("@broadcast")) continue;
      const text = msg.message?.conversation?.trim() ||
                   msg.message?.extendedTextMessage?.text?.trim();
      try {
        await handleMessage(sock, from, text);
      } catch (err) {
        console.error("Erro ao responder mensagem:", err.message);
      }
    }
  });
}

async function disconnectWhatsApp() {
  latestQR = null;
  await fs.promises.rm(AUTH_DIR, { recursive: true, force: true });
  console.log("Sessão WhatsApp removida.");
}

module.exports = { startWhatsApp, disconnectWhatsApp, getLatestQR };
