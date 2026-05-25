const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Busca um usuário no banco de dados pelo número de WhatsApp.
 * @param {string} numeroWhatsapp 
 * @returns {Promise<Object|null>}
 */
async function buscarUsuario(numeroWhatsapp) {
  const { rows } = await pool.query(
    "SELECT * FROM usuarios WHERE numero_whatsapp = $1",
    [numeroWhatsapp]
  );
  return rows[0] || null;
}

/**
 * Salva ou atualiza os tokens de acesso do Google Classroom para um usuário.
 * @param {string} numeroWhatsapp 
 * @param {string} tokenAcesso 
 * @param {string} tokenAtualizacao 
 */
async function salvarTokensGoogle(numeroWhatsapp, tokenAcesso, tokenAtualizacao) {
  await pool.query(
    `INSERT INTO usuarios (numero_whatsapp, google_token_acesso, google_token_atualizacao, estado_da_conversa, plataforma_escolhida, atualizado_em)
     VALUES ($1, $2, $3, 'CONCLUIDO', 'GOOGLE', NOW())
     ON CONFLICT (numero_whatsapp)
     DO UPDATE SET
       google_token_acesso = EXCLUDED.google_token_acesso,
       google_token_atualizacao = COALESCE(EXCLUDED.google_token_atualizacao, usuarios.google_token_atualizacao),
       estado_da_conversa = 'CONCLUIDO',
       plataforma_escolhida = 'GOOGLE',
       atualizado_em = NOW()`,
    [numeroWhatsapp, tokenAcesso, tokenAtualizacao]
  );
}

/**
 * Atualiza o estado da conversa e a plataforma selecionada para um usuário.
 * @param {string} numeroWhatsapp 
 * @param {string} estado 
 * @param {string|null} plataforma 
 */
async function atualizarEstadoUsuario(numeroWhatsapp, estado, plataforma = null) {
  await pool.query(
    `INSERT INTO usuarios (numero_whatsapp, estado_da_conversa, plataforma_escolhida, atualizado_em)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (numero_whatsapp)
     DO UPDATE SET
       estado_da_conversa = EXCLUDED.estado_da_conversa,
       plataforma_escolhida = COALESCE(EXCLUDED.plataforma_escolhida, usuarios.plataforma_escolhida),
       atualizado_em = NOW()`,
    [numeroWhatsapp, estado, plataforma]
  );
}

/**
 * Salva as credenciais do AVA (Moodle) para um usuário.
 * @param {string} numeroWhatsapp 
 * @param {string} usuarioAva 
 * @param {string} senhaAva 
 */
async function salvarCredenciaisAva(numeroWhatsapp, usuarioAva, senhaAva) {
  await pool.query(
    `INSERT INTO usuarios (numero_whatsapp, ava_username, ava_password, estado_da_conversa, plataforma_escolhida, atualizado_em)
     VALUES ($1, $2, $3, 'CONCLUIDO', 'AVA', NOW())
     ON CONFLICT (numero_whatsapp)
     DO UPDATE SET
       ava_username = EXCLUDED.ava_username,
       ava_password = EXCLUDED.ava_password,
       estado_da_conversa = 'CONCLUIDO',
       plataforma_escolhida = 'AVA',
       atualizado_em = NOW()`,
    [numeroWhatsapp, usuarioAva, senhaAva]
  );
}

module.exports = {
  pool,
  buscarUsuario,
  salvarTokensGoogle,
  atualizarEstadoUsuario,
  salvarCredenciaisAva,
};
