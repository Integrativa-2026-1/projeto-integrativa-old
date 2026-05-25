const { Router } = require("express");
const QRCode = require("qrcode");

const { obterUrlAutenticacao, tratarRetornoOAuth } = require("./google");
const { desconectarWhatsApp, iniciarWhatsApp, obterQrCodeMaisRecente } = require("./whatsapp");
const { htmlSucesso, htmlQrCode, htmlQrIndisponivel, htmlAutenticacaoAva } = require("./paginas");
const { salvarCredenciaisAva } = require("./banco");

const rotas = Router();

const NUMERO_WHATSAPP_BOT = "554999421983";
const REDIRECIONAR_WHATSAPP = `https://wa.me/${NUMERO_WHATSAPP_BOT}?text=login%20completed`;

// ── Google OAuth (Google Classroom) ──────────────────────────────────────────────
rotas.get("/auth/google/start", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).send("Faltando o parâmetro sessionId");
  }
  res.redirect(obterUrlAutenticacao(sessionId));
});

rotas.get("/auth/success", async (req, res) => {
  const { code, state: jid } = req.query;

  if (code && jid) {
    try {
      await tratarRetornoOAuth(code, jid);
      console.log("[Google] Tokens de acesso salvos com sucesso para:", jid);
    } catch (erro) {
      console.error("[Google] Erro no fluxo OAuth:", erro.message);
      return res.status(500).send("Falha na autenticação com o Google.");
    }
  }

  res.send(htmlSucesso(REDIRECIONAR_WHATSAPP));
});

// ── Autenticação do AVA (Moodle) ─────────────────────────────────────────────
rotas.get("/auth/ava/iniciar", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).send("Faltando o parâmetro sessionId");
  }
  res.send(htmlAutenticacaoAva(sessionId, "/auth/ava/salvar"));
});

rotas.post("/auth/ava/salvar", async (req, res) => {
  const { sessionId, ava_username, ava_password } = req.body;

  // Validação no Back-end
  if (!sessionId || !ava_username || !ava_username.trim() || !ava_password || !ava_password.trim()) {
    console.error("[AVA] Validação falhou no back-end. Campos obrigatórios em branco.");
    return res.status(400).json({
      erro: "Usuário e senha são obrigatórios e devem ser válidos."
    });
  }

  try {
    // Console.log conforme solicitado
    console.log("[AVA] Credenciais recebidas e validadas no back-end:");
    console.log(`- Usuário: ${ava_username.trim()}`);
    console.log(`- Senha: ${ava_password.trim()}`);

    // Salvar no banco de dados e atualizar estado para 'CONCLUIDO'
    await salvarCredenciaisAva(sessionId, ava_username.trim(), ava_password.trim());
    console.log(`[AVA] Credenciais salvas com sucesso para o usuário: ${sessionId}`);

    // Retorna a página de sucesso que redireciona de volta ao WhatsApp
    res.send(htmlSucesso(REDIRECIONAR_WHATSAPP));
  } catch (erro) {
    console.error("[AVA] Erro ao salvar credenciais do AVA no banco:", erro.message);
    res.status(500).send("Erro interno ao processar a integração com o AVA.");
  }
});

// ── Sessão do WhatsApp ──────────────────────────────────────────
rotas.post("/disconnect", async (_, res) => {
  try {
    await desconectarWhatsApp();
    iniciarWhatsApp();
    res.json({ ok: true, mensagem: "Sessão encerrada. Novo QR disponível em /qr em instantes." });
  } catch (erro) {
    console.error("Erro ao desconectar WhatsApp:", erro.message);
    res.status(500).json({ ok: false, mensagem: "Erro ao desconectar." });
  }
});

rotas.get("/qr", async (_, res) => {
  const qr = obterQrCodeMaisRecente();
  if (!qr) {
    return res.send(htmlQrIndisponivel());
  }
  const urlDadosQr = await QRCode.toDataURL(qr);
  res.send(htmlQrCode(urlDadosQr));
});

module.exports = rotas;
