const { Router } = require("express");
const QRCode = require("qrcode");

const { getAuthUrl, handleOAuthCallback } = require("./google");
const { disconnectWhatsApp, startWhatsApp, getLatestQR } = require("./whatsapp");
const { successHtml, qrHtml, qrUnavailableHtml } = require("./views");

const router = Router();

const WA_NUMBER = "554999421983";
const WA_REDIRECT = `https://wa.me/${WA_NUMBER}?text=login%20completed`;

// ── Google OAuth ──────────────────────────────────────────────
router.get("/auth/google/start", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).send("Missing sessionId");
  res.redirect(getAuthUrl(sessionId));
});

router.get("/auth/success", async (req, res) => {
  const { code, state: jid } = req.query;

  if (code && jid) {
    try {
      await handleOAuthCallback(code, jid);
      console.log("Tokens salvos para", jid);
    } catch (err) {
      console.error("OAuth error:", err.message);
      return res.status(500).send("Authentication failed.");
    }
  }

  res.send(successHtml(WA_REDIRECT));
});

// ── WhatsApp session ──────────────────────────────────────────
router.post("/disconnect", async (_, res) => {
  try {
    await disconnectWhatsApp();
    startWhatsApp();
    res.json({ ok: true, message: "Sessão encerrada. Novo QR disponível em /qr em instantes." });
  } catch (err) {
    console.error("Erro ao desconectar:", err.message);
    res.status(500).json({ ok: false, message: "Erro ao desconectar." });
  }
});

router.get("/qr", async (_, res) => {
  const qr = getLatestQR();
  if (!qr) return res.send(qrUnavailableHtml());
  const dataURL = await QRCode.toDataURL(qr);
  res.send(qrHtml(dataURL));
});

module.exports = router;
