const { google } = require("googleapis");
const PlataformaAcademica = require("./PlataformaAcademica");

class PlataformaGoogleClassroom extends PlataformaAcademica {
  constructor() {
    super();
  }

  /**
   * Inicializa e retorna o cliente autenticado do Google.
   * @param {Object} credenciais 
   * @returns {Promise<Object>} Cliente OAuth2
   */
  async conectar(credenciais) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials({
      access_token: credenciais.google_token_acesso || credenciais.tokenAcesso,
      refresh_token: credenciais.google_token_atualizacao || credenciais.tokenAtualizacao,
    });
    return auth;
  }

  /**
   * Obtém as disciplinas do Google Classroom.
   * @param {Object} credenciais 
   * @returns {Promise<Array>} Lista de disciplinas
   */
  async listarDisciplinas(credenciais) {
    try {
      const auth = await this.conectar(credenciais);
      const classroom = google.classroom({ version: "v1", auth });
      const { data } = await classroom.courses.list({
        courseStates: ["ACTIVE"],
        pageSize: 20,
      });
      return data.courses || [];
    } catch (erro) {
      console.error("Erro ao listar disciplinas no Google Classroom:", erro.message);
      throw erro;
    }
  }

  /**
   * Publica uma atividade na disciplina do Google Classroom.
   * @param {string} disciplinaId 
   * @param {Object} atividade 
   */
  async publicarAtividade(disciplinaId, atividade) {
    console.log(`[Google Classroom] Publicando atividade na disciplina ${disciplinaId}:`, atividade);
    // Placeholder com console.log
    return { sucesso: true, mensagem: "Atividade publicada com sucesso no Google Classroom." };
  }

  /**
   * Obtém as tarefas de uma disciplina específica do Google Classroom.
   * @param {string} disciplinaId 
   * @param {Object} credenciais 
   * @returns {Promise<Array>} Lista de atividades
   */
  async obterAtividades(disciplinaId, credenciais) {
    try {
      const auth = await this.conectar(credenciais);
      const classroom = google.classroom({ version: "v1", auth });
      const { data } = await classroom.courses.courseWork.list({
        courseId: disciplinaId,
      });
      return data.courseWork || [];
    } catch (erro) {
      console.error("Erro ao obter atividades do Google Classroom:", erro.message);
      throw erro;
    }
  }
}

module.exports = PlataformaGoogleClassroom;
