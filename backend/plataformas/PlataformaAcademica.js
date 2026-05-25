/**
 * Classe base abstrata para representar uma plataforma acadêmica.
 */
class PlataformaAcademica {
  /**
   * Conecta à plataforma usando as credenciais do usuário.
   * @param {Object} credenciais 
   * @returns {Promise<any>} Instância de conexão ou cliente autenticado
   */
  async conectar(credenciais) {
    throw new Error("Método 'conectar(credenciais)' não foi implementado.");
  }

  /**
   * Lista as disciplinas ativas na plataforma.
   * @param {Object} credenciais 
   * @returns {Promise<Array>} Array de disciplinas
   */
  async listarDisciplinas(credenciais) {
    throw new Error("Método 'listarDisciplinas(credenciais)' não foi implementado.");
  }

  /**
   * Publica uma atividade na plataforma.
   * @param {string} disciplinaId 
   * @param {Object} atividade 
   * @returns {Promise<Object>} Resposta de sucesso ou erro
   */
  async publicarAtividade(disciplinaId, atividade) {
    throw new Error("Método 'publicarAtividade(disciplinaId, atividade)' não foi implementado.");
  }

  /**
   * Obtém as atividades ou materiais de uma disciplina.
   * @param {string} disciplinaId 
   * @param {Object} credenciais 
   * @returns {Promise<Array>} Array de atividades
   */
  async obterAtividades(disciplinaId, credenciais) {
    throw new Error("Método 'obterAtividades(disciplinaId, credenciais)' não foi implementado.");
  }
}

module.exports = PlataformaAcademica;
