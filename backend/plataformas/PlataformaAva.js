const PlataformaAcademica = require("./PlataformaAcademica");

class PlataformaAva extends PlataformaAcademica {
  constructor() {
    super();
  }

  /**
   * Conecta ao AVA usando as credenciais do usuário.
   * @param {Object} credenciais 
   * @returns {Promise<Object>} Status de conexão simulado
   */
  async conectar(credenciais) {
    console.log("[AVA] Conectando ao Moodle com:");
    console.log(`- Usuário: ${credenciais.ava_username || credenciais.usuarioAva}`);
    console.log(`- Senha: ${credenciais.ava_password ? "*****" : "não informada"}`);
    // Simula uma conexão bem-sucedida para testes manuais
    return { conectado: true };
  }

  /**
   * Lista as disciplinas do AVA.
   * @param {Object} credenciais 
   * @returns {Promise<Array>} Lista de disciplinas simuladas
   */
  async listarDisciplinas(credenciais) {
    console.log("[AVA] Executando listarDisciplinas...");
    await this.conectar(credenciais);
    // Retorna disciplinas simuladas no mesmo padrão que o Google Classroom
    return [
      { id: "ava_calculo_1", name: "Cálculo Diferencial e Integral I" },
      { id: "ava_estruturas_dados", name: "Estruturas de Dados e Algoritmos" },
      { id: "ava_banco_dados", name: "Projeto e Modelagem de Banco de Dados" }
    ];
  }

  /**
   * Publica uma atividade na disciplina do AVA.
   * @param {string} disciplinaId 
   * @param {Object} atividade 
   * @returns {Promise<Object>} Resposta simulada
   */
  async publicarAtividade(disciplinaId, atividade) {
    console.log(`[AVA] Publicando atividade na disciplina ${disciplinaId}:`, atividade);
    return { sucesso: true, mensagem: "Atividade publicada com sucesso no AVA (Moodle)!" };
  }

  /**
   * Obtém as atividades pendentes da disciplina do AVA.
   * @param {string} disciplinaId 
   * @param {Object} credenciais 
   * @returns {Promise<Array>} Atividades simuladas
   */
  async obterAtividades(disciplinaId, credenciais) {
    console.log(`[AVA] Obtendo atividades da disciplina ${disciplinaId}...`);
    await this.conectar(credenciais);
    return [
      { id: "tarefa_1", title: "Responder Fórum de Discussão 1", dueDate: "2026-06-05" },
      { id: "tarefa_2", title: "Enviar Relatório Técnico do CRUD", dueDate: "2026-06-20" }
    ];
  }
}

module.exports = PlataformaAva;
