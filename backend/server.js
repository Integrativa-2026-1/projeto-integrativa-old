const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { ensureTable } = require("./db");
const { startWhatsApp } = require("./whatsapp");
const router = require("./router");

const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await ensureTable();
  startWhatsApp();
});
