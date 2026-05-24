const express = require("express");
const cors = require("cors");
const path = require("path");
const QRCode = require("qrcode");
require("dotenv").config();

const usersRoutes = require("./routes/users");
const { startWhatsApp, disconnectWhatsApp, getLatestQR } = require("./whatsapp");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", usersRoutes);

app.post("/disconnect", async (_, res) => {
  try {
    await disconnectWhatsApp();
    startWhatsApp();
    res.json({ ok: true, message: "Sessão encerrada. Novo QR disponível em /qr em instantes." });
  } catch (err) {
    console.error("Erro ao desconectar:", err.message);
    res.status(500).json({ ok: false, message: "Erro ao desconectar." });
  }
});

app.get("/qr", async (_, res) => {
  const qr = getLatestQR();

  if (!qr) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
          <p>QR code não disponível. O WhatsApp já está conectado ou ainda está inicializando.</p>
        </body>
      </html>
    `);
  }

  const dataURL = await QRCode.toDataURL(qr);

  res.send(`
    <!DOCTYPE html>
    <html>
      <body style="background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <img src="${dataURL}" style="width:300px;height:300px;" />
      </body>
    </html>
  `);
});

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.use((_, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  startWhatsApp();
});