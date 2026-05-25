const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");

const { buscarUsuario, atualizarEstadoUsuario } = require("./banco");
const { PlataformaGoogleClassroom, PlataformaAva } = require("./plataformas");
const { perguntarGemini, classificarPlataforma } = require("./gemini");

const PASTA_AUTENTICACAO = path.join(__dirname, "../auth");
const URL_BASE = process.env.BASE_URL || "http://localhost:3000";
const LOGIN_CONCLUIDO = /^login\s+completed$/i;

let qrCodeMaisRecente = null;
function obterQrCodeMaisRecente() {
  return qrCodeMaisRecente;
}

/**
 * Formata a lista de disciplinas retornada de qualquer plataforma.
 * @param {Array} disciplinas 
 * @returns {string} Lista formatada para o WhatsApp
 */
function formatarListaDisciplinas(disciplinas) {
  if (!disciplinas || !disciplinas.length) {
    return "Nenhuma disciplina ativa encontrada.";
  }
  return (
    "📚 *Suas disciplinas sincronizadas:*\n\n" +
    disciplinas.map((d, i) => `${i + 1}️⃣ ${d.name}`).join("\n")
  );
}

/**
 * Processa a mensagem recebida e gerencia a máquina de estados.
 */
async function processarMensagem(sock, remetente, texto) {
  if (!texto) return;

  // Busca ou cria o registro do usuário
  let usuario = await buscarUsuario(remetente).catch(() => null);

  // Se o usuário não existir no banco de dados ou estiver no estado inicial
  if (!usuario || !usuario.estado_da_conversa || usuario.estado_da_conversa === "INICIO") {
    // Define o estado inicial como 'AGUARDANDO_SELECAO'
    await atualizarEstadoUsuario(remetente, "AGUARDANDO_SELECAO");

    // Envia a saudação curta explicando a solução
    await sock.sendMessage(remetente, {
      text: "Olá! Sou o seu *Assistente Acadêmico* no WhatsApp. \n\nMinha missão é simplificar sua rotina estudantil reunindo suas atividades, prazos e materiais em um só lugar. Posso me conectar ao AVA (Moodle) da sua instituição e ao Google Classroom para sincronizar automaticamente atividades, fóruns, provas, materiais e prazos."
    });

    // Envia a segunda mensagem de escolha da plataforma educacional
    setTimeout(async () => {
      await sock.sendMessage(remetente, {
        text: "Para começarmos, qual plataforma educacional você deseja integrar agora?\n\n1️⃣ *Google Classroom*\n2️⃣ *AVA (Moodle)*\n\nResponda abaixo me dizendo qual delas você quer usar!"
      });
    }, 1000);

    return;
  }

  const estado = usuario.estado_da_conversa;

  // ── MÁQUINA DE ESTADOS ──────────────────────────────────────────────────────
  
  if (estado === "AGUARDANDO_SELECAO") {
    // Chama o classificador Gemini para interpretar a resposta do usuário
    const resultado = await classificarPlataforma(texto);
    const plataforma = resultado.platform;

    if (plataforma === "GOOGLE") {
      // Atualiza o estado para 'AGUARDANDO_GOOGLE'
      await atualizarEstadoUsuario(remetente, "AGUARDANDO_GOOGLE", "GOOGLE");
      const urlLoginGoogle = `${URL_BASE}/auth/google/start?sessionId=${encodeURIComponent(remetente)}`;
      
      await sock.sendMessage(remetente, {
        text: `Excelente! Você escolheu o *Google Classroom*. \n\nPara sincronizarmos suas atividades e materiais, clique no link abaixo para fazer login com sua conta do Google:\n\n🔗 ${urlLoginGoogle}\n\nApós concluir a integração, responda com *login completed* para ativarmos o seu assistente!`
      });
    } 
    else if (plataforma === "AVA") {
      // Atualiza o estado para 'AGUARDANDO_AVA'
      await atualizarEstadoUsuario(remetente, "AGUARDANDO_AVA", "AVA");
      const urlLoginAva = `${URL_BASE}/auth/ava/iniciar?sessionId=${encodeURIComponent(remetente)}`;
      
      await sock.sendMessage(remetente, {
        text: `Perfeito! Você escolheu o *AVA (Moodle)*. \n\nPara conectar o bot à sua instituição de ensino, clique no link abaixo para inserir seus dados de acesso:\n\n🔗 ${urlLoginAva}\n\nApós concluir o cadastro, responda com *login completed* para ativar o seu assistente!`
      });
    } 
    else {
      // UNKNOWN ou resposta ambígua
      await sock.sendMessage(remetente, {
        text: "Não consegui identificar qual plataforma você prefere. 😕\n\nPor favor, digite claramente se você deseja usar o *Google Classroom* ou o *AVA (Moodle)* para que possamos continuar."
      });
    }
    return;
  }

  if (estado === "AGUARDANDO_GOOGLE" || estado === "AGUARDANDO_AVA") {
    // Se o usuário responder informando que completou o login
    if (LOGIN_CONCLUIDO.test(texto)) {
      // Recarrega o usuário do banco para verificar se os tokens/dados foram salvos pelas rotas Express
      usuario = await buscarUsuario(remetente);

      if (estado === "AGUARDANDO_GOOGLE" && usuario?.google_token_acesso) {
        // Integração concluída com sucesso!
        await atualizarEstadoUsuario(remetente, "CONCLUIDO");
        await sock.sendMessage(remetente, {
          text: "Parabéns! Sua integração com o *Google Classroom* foi concluída com sucesso! 🎉\n\nBuscando suas turmas..."
        });

        try {
          const plataformaGoogle = new PlataformaGoogleClassroom();
          const disciplinas = await plataformaGoogle.listarDisciplinas(usuario);
          await sock.sendMessage(remetente, { text: formatarListaDisciplinas(disciplinas) });
        } catch (erro) {
          console.error("Erro ao listar disciplinas na conclusão:", erro.message);
          await sock.sendMessage(remetente, {
            text: "Integração realizada, mas ocorreu um erro temporário ao carregar suas disciplinas. Pergunte algo para mim para testar!"
          });
        }
      } 
      else if (estado === "AGUARDANDO_AVA" && usuario?.ava_username && usuario?.ava_password) {
        // Integração concluída com sucesso!
        await atualizarEstadoUsuario(remetente, "CONCLUIDO");
        await sock.sendMessage(remetente, {
          text: "Parabéns! Sua integração com o *AVA (Moodle)* foi concluída com sucesso! 🎉\n\nBuscando suas turmas..."
        });

        try {
          const plataformaAva = new PlataformaAva();
          const disciplinas = await plataformaAva.listarDisciplinas(usuario);
          await sock.sendMessage(remetente, { text: formatarListaDisciplinas(disciplinas) });
        } catch (erro) {
          console.error("Erro ao listar disciplinas do AVA na conclusão:", erro.message);
          await sock.sendMessage(remetente, {
            text: "Integração realizada, mas ocorreu um erro temporário ao carregar suas disciplinas do AVA."
          });
        }
      } 
      else {
        // Ainda não detectamos a integração no banco
        const urlPendente = estado === "AGUARDANDO_GOOGLE"
          ? `${URL_BASE}/auth/google/start?sessionId=${encodeURIComponent(remetente)}`
          : `${URL_BASE}/auth/ava/iniciar?sessionId=${encodeURIComponent(remetente)}`;

        await sock.sendMessage(remetente, {
          text: `Ainda não detectamos sua integração no banco de dados. 🧐\n\nPor favor, acesse o link enviado anteriormente para concluir a vinculação de conta:\n🔗 ${urlPendente}`
        });
      }
    } 
    else {
      // Lembra o usuário de concluir a integração pendente
      const urlPendente = estado === "AGUARDANDO_GOOGLE"
        ? `${URL_BASE}/auth/google/start?sessionId=${encodeURIComponent(remetente)}`
        : `${URL_BASE}/auth/ava/iniciar?sessionId=${encodeURIComponent(remetente)}`;

      await sock.sendMessage(remetente, {
        text: `Estamos aguardando você conectar sua conta educacional. 😊\n\nClique no link abaixo para vincular:\n🔗 ${urlPendente}\n\nAssim que finalizar, responda com *login completed* aqui no chat!`
      });
    }
    return;
  }

  if (estado === "CONCLUIDO") {
    // Se o usuário pedir para listar disciplinas novamente
    if (LOGIN_CONCLUIDO.test(texto)) {
      try {
        let disciplinas = [];
        if (usuario.plataforma_escolhida === "GOOGLE") {
          const pGoogle = new PlataformaGoogleClassroom();
          disciplinas = await pGoogle.listarDisciplinas(usuario);
        } else {
          const pAva = new PlataformaAva();
          disciplinas = await pAva.listarDisciplinas(usuario);
        }
        return sock.sendMessage(remetente, { text: formatarListaDisciplinas(disciplinas) });
      } catch (erro) {
        console.error("Erro ao obter disciplinas:", erro.message);
        return sock.sendMessage(remetente, { text: "Não consegui carregar suas turmas no momento. Tente novamente mais tarde." });
      }
    }

    // Fluxo normal da IA (Assistente de Conversação Livre)
    const respostaIA = await perguntarGemini(texto);
    if (respostaIA) {
      await sock.sendMessage(remetente, { text: respostaIA });
    }
  }
}

async function iniciarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(PASTA_AUTENTICACAO);
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
      qrCodeMaisRecente = qr;
      console.log("[WhatsApp] Novo QR code disponível em /qr");
    }
    if (connection === "open") {
      qrCodeMaisRecente = null;
      console.log("[WhatsApp] WhatsApp conectado com sucesso!");
    }
    if (connection === "close") {
      const codigoStatus = lastDisconnect?.error?.output?.statusCode;
      const desconectado = codigoStatus === DisconnectReason.loggedOut;
      console.log(`[WhatsApp] Conexão fechada (${codigoStatus}). ${desconectado ? "Sessão encerrada." : "Reconectando..."}`);
      if (!desconectado) setTimeout(() => iniciarWhatsApp(), 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const remetente = msg.key.remoteJid;
      if (!remetente || remetente.endsWith("@broadcast")) continue;
      
      const texto = msg.message?.conversation?.trim() ||
                    msg.message?.extendedTextMessage?.text?.trim();
      try {
        await processarMensagem(sock, remetente, texto);
      } catch (erro) {
        console.error("[WhatsApp] Erro ao processar mensagem do usuário:", erro.message);
      }
    }
  });
}

async function desconectarWhatsApp() {
  qrCodeMaisRecente = null;
  await fs.promises.rm(PASTA_AUTENTICACAO, { recursive: true, force: true });
  console.log("[WhatsApp] Sessão do WhatsApp removida com sucesso.");
}

module.exports = {
  iniciarWhatsApp,
  desconectarWhatsApp,
  obterQrCodeMaisRecente,
};
