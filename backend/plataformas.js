const { google } = require("googleapis");
const { criarClienteOAuth } = require("./google");

const BASE_URL = "https://ead.uniplaclages.edu.br";

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
  async fazerRequisicao(url) {
    let resposta;
    try {
      resposta = await fetch(url);
    } catch (erro) {
      throw new Error(`AVA indisponível ou sem conexão: ${erro.message}`);
    }

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status} ao acessar o AVA.`);
    }

    const dados = await resposta.json();
    return dados;
  }

  async conectar(credenciais) {
    const usuario = credenciais.ava_username || credenciais.usuarioAva;
    const senha = credenciais.ava_password;

    if (!usuario || !usuario.trim()) {
      throw new Error("Credenciais inválidas: usuário do AVA não informado.");
    }
    if (!senha || !senha.trim()) {
      throw new Error("Credenciais inválidas: senha do AVA não informada.");
    }

    console.log(`[AVA] Iniciando autenticação para o usuário: ${usuario}`);

    const urlToken = `${BASE_URL}/login/token.php?username=${encodeURIComponent(usuario)}&password=${encodeURIComponent(senha)}&service=moodle_mobile_app`;
    const respostaToken = await this.fazerRequisicao(urlToken);

    if (!respostaToken.token) {
      const motivo = respostaToken.error || respostaToken.debuginfo || "Usuário ou senha incorretos.";
      throw new Error(`Falha na autenticação com o AVA: ${motivo}`);
    }

    const { token, privatetoken: privateToken } = respostaToken;

    console.log(`[AVA] Autenticação bem-sucedida. Carregando informações do site...`);

    const urlSiteInfo = `${BASE_URL}/webservice/rest/server.php?wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`;
    const siteInfo = await this.fazerRequisicao(urlSiteInfo);

    return {
      conectado: true,
      token,
      privateToken,
      usuario: {
        id: siteInfo.userid,
        username: siteInfo.username,
        firstname: siteInfo.firstname,
        lastname: siteInfo.lastname,
        fullname: siteInfo.fullname,
        siteName: siteInfo.sitename,
        siteUrl: siteInfo.siteurl,
        userPicture: siteInfo.userpictureurl,
      },
    };
  }

  async listarDisciplinas(credenciais) {
    const { token, usuario } = await this.conectar(credenciais);

    console.log(`[AVA] Carregando disciplinas para o usuário ID: ${usuario.id}`);

    const urlDisciplinas = `${BASE_URL}/webservice/rest/server.php?wstoken=${token}&wsfunction=core_enrol_get_users_courses&userid=${usuario.id}&moodlewsrestformat=json`;
    const cursos = await this.fazerRequisicao(urlDisciplinas);

    if (!Array.isArray(cursos)) {
      throw new Error("Resposta inesperada do AVA ao listar disciplinas.");
    }

    console.log(`[AVA] ${cursos.length} disciplina(s) encontrada(s).`);

    return cursos.map((course) => ({
      id: course.id,
      name: course.fullname,
      shortName: course.shortname,
      progress: course.progress,
      completed: course.completed,
      image: course.courseimage,
      startDate: course.startdate ? new Date(course.startdate * 1000).toISOString() : null,
      endDate: course.enddate && course.enddate !== 0 ? new Date(course.enddate * 1000).toISOString() : null,
      visible: course.visible === 1,
    }));
  }

  async publicarAtividade() {
    // A implementar futuramente
    return null;
  }

  async obterAtividades() {
    // A implementar futuramente
    return [];
  }
}

module.exports = { PlataformaGoogleClassroom, PlataformaAva };
