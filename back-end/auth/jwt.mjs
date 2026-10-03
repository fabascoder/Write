import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { JWT_SECRET } from "./config.mjs";

// JWT (JSON Web Token) assinado com HMAC-SHA256 (HS256), feito com o node:crypto.
// Formato: header.payload.assinatura, cada parte em base64url.
// Quem não tem o JWT_SECRET não consegue criar nem alterar um token válido.

const EMISSOR = "write-api";
const PUBLICO = "write-site";

const base64url = (dados) => Buffer.from(dados).toString("base64url");

function assinatura(conteudo) {
  return createHmac("sha256", JWT_SECRET).update(conteudo).digest("base64url");
}

// payload: dados do token (ex.: { sub: "12", role: "leitor" })
export function gerarJwt(payload, duracaoSegundos) {
  const agora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const corpo = base64url(
    JSON.stringify({
      ...payload,
      iss: EMISSOR,
      aud: PUBLICO,
      iat: agora,
      exp: agora + duracaoSegundos,
      jti: randomBytes(12).toString("base64url"),
    }),
  );
  return `${header}.${corpo}.${assinatura(`${header}.${corpo}`)}`;
}

// Devolve o payload se o token for válido, ou null (assinatura errada,
// algoritmo diferente, vencido, de outro emissor...)
export function verificarJwt(token) {
  if (typeof token !== "string") return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [header, corpo, recebida] = partes;

  try {
    // Só aceita HS256: bloqueia o truque do "alg": "none"
    const cabecalho = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (cabecalho.alg !== "HS256" || cabecalho.typ !== "JWT") return null;

    const esperada = Buffer.from(assinatura(`${header}.${corpo}`));
    const veio = Buffer.from(recebida);
    if (esperada.length !== veio.length || !timingSafeEqual(esperada, veio)) return null;

    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
    const agora = Math.floor(Date.now() / 1000);
    if (dados.iss !== EMISSOR || dados.aud !== PUBLICO) return null;
    if (typeof dados.exp !== "number" || dados.exp <= agora) return null;
    if (!dados.sub) return null;

    return dados;
  } catch {
    return null;
  }
}
