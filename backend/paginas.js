/**
 * Templates HTML em português para o servidor Express.
 */

function htmlSucesso(urlRedirecionamento) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login Realizado com Sucesso</title>
  <style>
    body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0; background: #f0fdf4; color: #1f2937; }
    h1 { color: #16a34a; font-size: 1.8rem; margin-bottom: 0.5rem; }
    p { color: #4b5563; font-size: 1rem; margin-bottom: 1.5rem; }
    a.btn { padding: 0.75rem 1.5rem; background: #25d366;
            color: #fff; text-decoration: none; border-radius: 8px; font-size: 1rem; font-weight: bold;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: background-color 0.2s; }
    a.btn:hover { background: #1ebd59; }
  </style>
  <script>setTimeout(() => { window.location.href = "${urlRedirecionamento}"; }, 2500);</script>
</head>
<body>
  <h1>Login concluído com sucesso!</h1>
  <p>Redirecionando você de volta para o WhatsApp em instantes...</p>
  <a class="btn" href="${urlRedirecionamento}">Abrir WhatsApp</a>
</body>
</html>`;
}

function htmlQrCode(dadosUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Conectar WhatsApp</title>
</head>
<body style="background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;color:#fff;">
  <h1 style="margin-bottom: 1.5rem; font-size: 1.5rem;">Escaneie o QR Code para conectar</h1>
  <div style="background:#fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
    <img src="${dadosUrl}" style="width:280px;height:280px;display:block;" />
  </div>
  <p style="margin-top: 1.5rem; color: #94a3b8; font-size: 0.9rem;">Abra o WhatsApp no celular > Dispositivos conectados > Conectar um dispositivo</p>
</body>
</html>`;
}

function htmlQrIndisponivel() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>WhatsApp Conectado</title>
</head>
<body style="background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
  <div style="text-align: center; padding: 2rem;">
    <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">QR code não disponível.</p>
    <p style="color:#94a3b8;">O WhatsApp já está conectado ou o servidor ainda está inicializando.</p>
  </div>
</body>
</html>`;
}

function htmlAutenticacaoAva(sessionId, urlAcao) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Integração com AVA (Moodle)</title>
  <style>
    body {
      font-family: sans-serif;
      background-color: #f3f4f6;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      background-color: #ffffff;
      padding: 2.5rem;
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
    }
    h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #1f2937;
      text-align: center;
    }
    .form-group {
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
    }
    label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #4b5563;
      font-size: 0.9rem;
    }
    input {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      outline: none;
      box-sizing: border-box;
      width: 100%;
    }
    input:focus {
      border-color: #2563eb;
    }
    .erro-mensagem {
      color: #dc2626;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: none;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      margin-top: 1rem;
      box-sizing: border-box;
    }
    button:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Integrar com AVA</h2>
    <form id="form-ava" action="${urlAcao}" method="POST" onsubmit="return validarFormulario(event)">
      <input type="hidden" name="sessionId" value="${sessionId}" />
      
      <div class="form-group">
        <label for="ava_username">Usuário do AVA</label>
        <input type="text" id="ava_username" name="ava_username" placeholder="Insira seu usuário de acesso" oninput="limparErro('erro-usuario')" />
        <span class="erro-mensagem" id="erro-usuario"></span>
      </div>

      <div class="form-group">
        <label for="ava_password">Senha do AVA</label>
        <input type="password" id="ava_password" name="ava_password" placeholder="Insira sua senha de acesso" oninput="limparErro('erro-senha')" />
        <span class="erro-mensagem" id="erro-senha"></span>
      </div>

      <button type="submit">Salvar e Conectar</button>
    </form>
  </div>

  <script>
    function validarFormulario(event) {
      var usuarioInput = document.getElementById('ava_username');
      var senhaInput = document.getElementById('ava_password');
      var erroUsuario = document.getElementById('erro-usuario');
      var erroSenha = document.getElementById('erro-senha');
      var temErro = false;

      // Validação do Usuário
      if (!usuarioInput.value || usuarioInput.value.trim() === '') {
        erroUsuario.textContent = 'O usuário do AVA é obrigatório.';
        erroUsuario.style.display = 'block';
        usuarioInput.style.borderColor = '#dc2626';
        temErro = true;
      } else {
        erroUsuario.style.display = 'none';
        usuarioInput.style.borderColor = '#d1d5db';
      }

      // Validação da Senha
      if (!senhaInput.value || senhaInput.value.trim() === '') {
        erroSenha.textContent = 'A senha do AVA é obrigatória.';
        erroSenha.style.display = 'block';
        senhaInput.style.borderColor = '#dc2626';
        temErro = true;
      } else {
        erroSenha.style.display = 'none';
        senhaInput.style.borderColor = '#d1d5db';
      }

      if (temErro) {
        event.preventDefault();
        return false;
      }
      return true;
    }

    function limparErro(idErro) {
      var elementoErro = document.getElementById(idErro);
      if (elementoErro) {
        elementoErro.style.display = 'none';
        
        // Limpar a borda vermelha do input correspondente
        var idInput = idErro === 'erro-usuario' ? 'ava_username' : 'ava_password';
        var input = document.getElementById(idInput);
        if (input) {
          input.style.borderColor = '#d1d5db';
        }
      }
    }
  </script>
</body>
</html>`;
}

module.exports = {
  htmlSucesso,
  htmlQrCode,
  htmlQrIndisponivel,
  htmlAutenticacaoAva,
};
