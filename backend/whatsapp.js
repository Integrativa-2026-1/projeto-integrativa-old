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

let latestQR = null;
let activeSock = null;
let isStarting = false;

function getLatestQR() {
  return latestQR;
}

async function startWhatsApp() {
  if (isStarting) return;
  isStarting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
    });

    activeSock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        latestQR = qr;
        console.log("QR code disponível em /qr");
      }

      if (connection === "open") {
        latestQR = null;
        isStarting = false;
        console.log("WhatsApp conectado.");
      }

      if (connection === "close") {
        activeSock = null;
        isStarting = false;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log("Conexão encerrada. Reconectando:", shouldReconnect);

        if (shouldReconnect) {
          setTimeout(() => startWhatsApp(), 3000);
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;
        if (msg.key.remoteJid === "status@broadcast") continue;

        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: "Olá! Estou em desenvolvimento",
          });
        } catch (err) {
          console.error("Erro ao enviar mensagem:", err.message);
        }
      }
    });
  } catch (err) {
    isStarting = false;
    console.error("Erro ao iniciar WhatsApp:", err.message);
    setTimeout(() => startWhatsApp(), 5000);
  }
}

async function disconnectWhatsApp() {
  latestQR = null;

  if (activeSock) {
    try {
      await activeSock.logout();
    } catch (_) {}

    try {
      activeSock.end();
    } catch (_) {}

    activeSock = null;
  }

  isStarting = false;

  try {
    await fs.promises.rm(AUTH_DIR, { recursive: true, force: true });
    console.log("Sessão WhatsApp removida.");
  } catch (err) {
    console.error("Erro ao remover pasta auth:", err.message);
  }
}

module.exports = { startWhatsApp, disconnectWhatsApp, getLatestQR };
