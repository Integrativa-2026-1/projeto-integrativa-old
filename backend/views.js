function successHtml(redirectUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login successful</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0; background: #f0fdf4; }
    h1 { color: #16a34a; }
    a.btn { margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #25d366;
            color: #fff; text-decoration: none; border-radius: 8px; font-size: 1rem; }
  </style>
  <script>setTimeout(() => { window.location.href = "${redirectUrl}"; }, 2000);</script>
</head>
<body>
  <h1>Login completed successfully</h1>
  <p>Redirecting you back to WhatsApp...</p>
  <a class="btn" href="${redirectUrl}">Open WhatsApp</a>
</body>
</html>`;
}

function qrHtml(dataURL) {
  return `<!DOCTYPE html>
<html>
<body style="background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <img src="${dataURL}" style="width:300px;height:300px;" />
</body>
</html>`;
}

function qrUnavailableHtml() {
  return `<!DOCTYPE html>
<html>
<body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
  <p>QR code não disponível. O WhatsApp já está conectado ou ainda está inicializando.</p>
</body>
</html>`;
}

module.exports = { successHtml, qrHtml, qrUnavailableHtml };
