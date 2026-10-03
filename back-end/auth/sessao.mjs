import { createHash, randomBytes } from "node:crypto";
import { db } from "../database/database.mjs";
import { lerCookies } from "../http.mjs";
import { COOKIE_SEGURO } from "./config.mjs";

// Sessão = token aleatório num cookie httpOnly (o JavaScript do site não lê).
// No banco fica só o hash do token: se o banco vazar, as sessões não vazam junto.

export const COOKIE_SESSAO = "write_sessao";
const DURACAO_DIAS = 30;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

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

// Cria a sessão e devolve o cookie pronto para ir no Set-Cookie
export async function criarSessao(usuarioId) {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);

  // Aproveita para limpar sessões vencidas
  await db.query(`DELETE FROM sessoes WHERE "expiraEm" < $1`, [new Date().toISOString()]);

  await db.query(
    `INSERT INTO sessoes ("usuarioId", "tokenHash", "expiraEm") VALUES ($1, $2, $3)`,
    [usuarioId, hashToken(token), expira.toISOString()],
  );

  return montarCookie(COOKIE_SESSAO, token, { maxAge: DURACAO_DIAS * 24 * 60 * 60 });
}

// Usuário dono do cookie de sessão, ou null. A role vem SEMPRE do banco,
// nunca do que o navegador mandar.
export async function usuarioDaSessao(req) {
  const token = lerCookies(req)[COOKIE_SESSAO];
  if (!token) return null;

  const result = await db.query(
    `
      SELECT s."expiraEm", u.id, u.nome, u.email, u.role, u."dataCriacao"
      FROM sessoes s
      JOIN usuarios u ON u.id = s."usuarioId"
      WHERE s."tokenHash" = $1
    `,
    [hashToken(token)],
  );

  const linha = result.rows[0];
  if (!linha || new Date(linha.expiraEm).getTime() <= Date.now()) return null;

  const { expiraEm: _expira, ...usuario } = linha;
  return usuario;
}

export async function encerrarSessao(req) {
  const token = lerCookies(req)[COOKIE_SESSAO];
  if (token) await db.query(`DELETE FROM sessoes WHERE "tokenHash" = $1`, [hashToken(token)]);
  return cookieApagado(COOKIE_SESSAO);
}
