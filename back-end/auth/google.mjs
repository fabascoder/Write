import { GOOGLE } from "./config.mjs";

// Login com Google pelo fluxo "authorization code" (OAuth 2.0 / OpenID Connect).
// A senha do Google nunca passa por aqui: o Google devolve um código, o servidor
// troca o código por um id_token e confere de quem é a conta.

const AUTORIZAR = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const EMISSORES = ["https://accounts.google.com", "accounts.google.com"];

export function urlDeAutorizacao(state) {
  const params = new URLSearchParams({
    client_id: GOOGLE.clientId,
    redirect_uri: GOOGLE.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTORIZAR}?${params}`;
}

function lerPayload(idToken) {
  const payload = String(idToken).split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

// Troca o código pelos dados da conta Google. Lança erro se algo não bater.
export async function contaGoogle(code) {
  const resposta = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE.clientId,
      client_secret: GOOGLE.clientSecret,
      redirect_uri: GOOGLE.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!resposta.ok) throw new Error(`Google recusou o código (${resposta.status})`);

  const { id_token: idToken } = await resposta.json();
  if (!idToken) throw new Error("Google não devolveu id_token");

  // O id_token veio direto do Google por HTTPS (não passou pelo navegador),
  // então basta conferir para quem e por quem ele foi emitido e se ainda vale.
  const dados = lerPayload(idToken);

  if (dados.aud !== GOOGLE.clientId) throw new Error("id_token de outro aplicativo");
  if (!EMISSORES.includes(dados.iss)) throw new Error("id_token de emissor desconhecido");
  if (!dados.exp || dados.exp * 1000 < Date.now()) throw new Error("id_token expirado");
  if (!dados.sub || !dados.email) throw new Error("id_token sem identificação");
  if (dados.email_verified !== true && dados.email_verified !== "true") {
    throw new Error("E-mail do Google não verificado");
  }

  return {
    id: String(dados.sub),
    email: String(dados.email),
    nome: String(dados.name || dados.given_name || dados.email.split("@")[0]),
  };
}
