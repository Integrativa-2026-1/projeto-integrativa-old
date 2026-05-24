const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");

const AUTH_DIR = path.join(__dirname, "../auth");
const REPLY_TEXT = "Olá! Estou em desenvolvimento";

let latestQR = null;

function getLatestQR() {
  return latestQR;
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
    if (qr) {
      latestQR = qr;
      console.log("QR code disponível em /qr");
    }

    if (connection === "open") {
      latestQR = null;
      console.log("WhatsApp conectado.");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(`Conexão encerrada (código ${statusCode}). ${loggedOut ? "Sessão encerrada." : "Reconectando..."}`);
      if (!loggedOut) setTimeout(() => startWhatsApp(), 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      if (!from || from.endsWith("@broadcast")) continue;

      try {
        await sock.sendMessage(from, { text: REPLY_TEXT });
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
