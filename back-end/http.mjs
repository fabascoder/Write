// Ajudantes de requisição e resposta, para os controllers não repetirem
// writeHead/JSON.stringify em todo lugar.

export function responder(res, status, dados, cookies = []) {
  const headers = { "Content-Type": "application/json" };
  if (cookies.length) headers["Set-Cookie"] = cookies;
  res.writeHead(status, headers);
  res.end(JSON.stringify(dados));
}

export function redirecionar(res, url, cookies = []) {
  const headers = { Location: url };
  if (cookies.length) headers["Set-Cookie"] = cookies;
  res.writeHead(302, headers);
  res.end();
}

// Corpo JSON da requisição. Devolve {} se vier vazio ou inválido.
export function lerJson(req) {
  try {
    const dados = JSON.parse(req.body || "{}");
    return dados && typeof dados === "object" ? dados : {};
  } catch {
    return {};
  }
}

export function lerCookies(req) {
  const cookies = {};
  for (const parte of (req.headers.cookie ?? "").split(";")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    const nome = parte.slice(0, i).trim();
    try {
      cookies[nome] = decodeURIComponent(parte.slice(i + 1).trim());
    } catch {
      /* cookie malformado: ignora */
    }
  }
  return cookies;
}

export function lerQuery(req) {
  return new URL(req.url, "http://localhost").searchParams;
}

// IP de quem fez a requisição (atrás do proxy da Vercel e do Render)
export function ipDe(req) {
  const encaminhado = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  return encaminhado || req.socket.remoteAddress || "desconhecido";
}
