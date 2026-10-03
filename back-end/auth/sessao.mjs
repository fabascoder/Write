import { lerCookies } from "../http.mjs";
import { buscarPorId } from "../services/usuario.service.mjs";
import { COOKIE_SEGURO } from "./config.mjs";
import { gerarJwt, verificarJwt } from "./jwt.mjs";

// Login com JWT.
// - O token vai num cookie httpOnly: o JavaScript do site não consegue ler,
//   então um script injetado não rouba o login.
// - Também aceita "Authorization: Bearer <token>" (útil para testar no Postman).
// - A cada requisição o usuário é buscado no banco pelo "sub" do token, então
//   a role vale sempre a atual: se um admin virar leitor, perde o acesso na hora.

export const COOKIE_TOKEN = "write_token";
const DURACAO = 7 * 24 * 60 * 60; // 7 dias, em segundos

export function montarCookie(nome, valor, { maxAge, httpOnly = true } = {}) {
  const partes = [`${nome}=${encodeURIComponent(valor)}`, "Path=/", "SameSite=Lax"];
  if (httpOnly) partes.push("HttpOnly");
  if (COOKIE_SEGURO) partes.push("Secure");
  if (maxAge !== undefined) partes.push(`Max-Age=${maxAge}`);
  return partes.join("; ");
}

export function cookieApagado(nome) {
  return montarCookie(nome, "", { maxAge: 0 });
}

// ---------- Várias contas no mesmo navegador (como no GitHub) ----------
// Cada conta conectada guarda o seu JWT no cookie write_contas (httpOnly).
// Trocar de conta = copiar o token daquela conta para o write_token.

export const COOKIE_CONTAS = "write_contas";
const MAX_CONTAS = 5;

function lerTokensDasContas(req) {
  try {
    const bruto = lerCookies(req)[COOKIE_CONTAS];
    const lista = bruto ? JSON.parse(Buffer.from(bruto, "base64url").toString("utf8")) : [];
    return Array.isArray(lista) ? lista.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function cookieDasContas(tokens) {
  if (tokens.length === 0) return cookieApagado(COOKIE_CONTAS);
  const valor = Buffer.from(JSON.stringify(tokens.slice(0, MAX_CONTAS))).toString("base64url");
  return montarCookie(COOKIE_CONTAS, valor, { maxAge: DURACAO });
}

// Contas com token ainda válido: [{ usuarioId, token }]
export function contasConectadas(req) {
  return lerTokensDasContas(req)
    .map((token) => ({ token, dados: verificarJwt(token) }))
    .filter((c) => c.dados)
    .map((c) => ({ usuarioId: Number(c.dados.sub), token: c.token }));
}

// Lista de contas sem a conta "usuarioId" (e sem tokens vencidos)
function semAConta(req, usuarioId) {
  return contasConectadas(req)
    .filter((c) => c.usuarioId !== usuarioId)
    .map((c) => c.token);
}

// Gera o JWT do usuário, torna ele a conta ativa e o guarda na lista de contas.
// Devolve o token e os cookies prontos para o Set-Cookie.
export function criarSessao(usuario, req) {
  const token = gerarJwt({ sub: String(usuario.id), role: usuario.role }, DURACAO);
  const contas = [token, ...(req ? semAConta(req, usuario.id) : [])];
  return {
    token,
    expiraEm: new Date(Date.now() + DURACAO * 1000).toISOString(),
    cookies: [montarCookie(COOKIE_TOKEN, token, { maxAge: DURACAO }), cookieDasContas(contas)],
  };
}

// Troca para outra conta já conectada neste navegador. Devolve os cookies, ou null.
export function trocarDeConta(req, usuarioId) {
  const conta = contasConectadas(req).find((c) => c.usuarioId === usuarioId);
  if (!conta) return null;
  const contas = [conta.token, ...semAConta(req, usuarioId)];
  return [montarCookie(COOKIE_TOKEN, conta.token, { maxAge: DURACAO }), cookieDasContas(contas)];
}

// Desconecta uma conta. Se for a ativa, ninguém fica ativo (a pessoa escolhe a próxima).
export function sairDaConta(req, usuarioId) {
  const cookies = [cookieDasContas(semAConta(req, usuarioId))];
  const ativa = verificarJwt(tokenDa(req));
  if (!ativa || Number(ativa.sub) === usuarioId) cookies.push(cookieApagado(COOKIE_TOKEN));
  return cookies;
}

export function sairDeTodas() {
  return [cookieApagado(COOKIE_TOKEN), cookieApagado(COOKIE_CONTAS)];
}

export function idDaContaAtiva(req) {
  const dados = verificarJwt(tokenDa(req));
  return dados ? Number(dados.sub) : null;
}

function tokenDa(req) {
  const autorizacao = String(req.headers.authorization ?? "");
  if (autorizacao.startsWith("Bearer ")) return autorizacao.slice(7).trim();
  return lerCookies(req)[COOKIE_TOKEN];
}

// Usuário dono do token, ou null. A role vem SEMPRE do banco,
// nunca do que o navegador mandar (nem do próprio token).
export async function usuarioDaSessao(req) {
  const dados = verificarJwt(tokenDa(req));
  if (!dados) return null;

  const usuario = await buscarPorId(Number(dados.sub));
  return usuario ?? null; // conta apagada → token não vale mais
}
