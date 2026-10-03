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

// Gera o JWT do usuário. Devolve o token e o cookie pronto para o Set-Cookie.
export function criarSessao(usuario) {
  const token = gerarJwt({ sub: String(usuario.id), role: usuario.role }, DURACAO);
  return {
    token,
    expiraEm: new Date(Date.now() + DURACAO * 1000).toISOString(),
    cookie: montarCookie(COOKIE_TOKEN, token, { maxAge: DURACAO }),
  };
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

// JWT não tem estado no servidor: sair = apagar o cookie
export function encerrarSessao() {
  return cookieApagado(COOKIE_TOKEN);
}
