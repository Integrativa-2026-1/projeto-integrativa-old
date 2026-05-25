const { google } = require("googleapis");
const { criarClienteOAuth } = require("./google");

class PlataformaGoogleClassroom {
  async listarDisciplinas(usuario) {
    const auth = criarClienteOAuth();
    auth.setCredentials({
      access_token: usuario.google_token_acesso,
      refresh_token: usuario.google_token_atualizacao,
    });

    const { data } = await google
      .classroom({ version: "v1", auth })
      .courses.list({ courseStates: ["ACTIVE"], pageSize: 20 });

    return (data.courses || []).map((c) => ({ name: c.name }));
  }
}

class PlataformaAva {
  async listarDisciplinas(usuario) {
    // Placeholder — integração Moodle a implementar futuramente
    return [];
  }
}

module.exports = { PlataformaGoogleClassroom, PlataformaAva };
