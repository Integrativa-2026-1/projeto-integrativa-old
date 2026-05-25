const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { iniciarWhatsApp } = require("./whatsapp");
const rotas = require("./rotas");

const app = express();
app.use(cors());
app.use(express.json());

// Suporte para interpretar corpos de formulários HTML tradicionais (urlencoded)
app.use(express.urlencoded({ extended: true }));

// Vincula todas as rotas do projeto
app.use(rotas);

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, async () => {
  console.log(`[Servidor] Servidor rodando com sucesso na porta ${PORTA}`);
  
  // Inicializa o socket do bot do WhatsApp
  iniciarWhatsApp();
});
