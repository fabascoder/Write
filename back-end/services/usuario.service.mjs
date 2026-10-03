import { db } from "../database/database.mjs";

const CAMPOS = `id, nome, email, role, "dataCriacao", "dataAtualizacao"`;

// O que pode sair da API. Nunca inclui senhaHash.
export function usuarioPublico(u) {
  if (!u) return null;
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    dataCriacao: u.dataCriacao,
  };
}

export function normalizarEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export async function criarUsuario({ nome, email, senhaHash = null, role = "leitor" }) {
  const result = await db.query(
    `
      INSERT INTO usuarios (nome, email, "senhaHash", role)
      VALUES ($1, $2, $3, $4)
      RETURNING ${CAMPOS}
    `,
    [nome, normalizarEmail(email), senhaHash, role],
  );
  return result.rows[0];
}

// Inclui o senhaHash: usar só para conferir a senha, nunca para responder
export async function buscarPorEmailComSenha(email) {
  const result = await db.query(
    `SELECT ${CAMPOS}, "senhaHash" FROM usuarios WHERE email = $1`,
    [normalizarEmail(email)],
  );
  return result.rows[0];
}

export async function buscarPorId(id) {
  const result = await db.query(`SELECT ${CAMPOS} FROM usuarios WHERE id = $1`, [id]);
  return result.rows[0];
}

export async function buscarPorProvedor(provedor, provedorId) {
  const result = await db.query(
    `
      SELECT u.id, u.nome, u.email, u.role, u."dataCriacao", u."dataAtualizacao"
      FROM "usuarioProvedores" p
      JOIN usuarios u ON u.id = p."usuarioId"
      WHERE p.provedor = $1 AND p."provedorId" = $2
    `,
    [provedor, provedorId],
  );
  return result.rows[0];
}

export async function vincularProvedor(usuarioId, provedor, provedorId) {
  await db.query(
    `
      INSERT INTO "usuarioProvedores" ("usuarioId", provedor, "provedorId")
      VALUES ($1, $2, $3)
      ON CONFLICT (provedor, "provedorId") DO NOTHING
    `,
    [usuarioId, provedor, provedorId],
  );
}

export async function listarProvedores(usuarioId) {
  const result = await db.query(
    `SELECT provedor FROM "usuarioProvedores" WHERE "usuarioId" = $1`,
    [usuarioId],
  );
  return result.rows.map((r) => r.provedor);
}

export async function usuarioTemSenha(usuarioId) {
  const result = await db.query(`SELECT "senhaHash" FROM usuarios WHERE id = $1`, [usuarioId]);
  return Boolean(result.rows[0]?.senhaHash);
}

export async function atualizarNome(id, nome) {
  const result = await db.query(
    `
      UPDATE usuarios
      SET nome = $1, "dataAtualizacao" = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING ${CAMPOS}
    `,
    [nome, id],
  );
  return result.rows[0];
}

export async function definirSenha(id, senhaHash) {
  await db.query(
    `UPDATE usuarios SET "senhaHash" = $1, "dataAtualizacao" = CURRENT_TIMESTAMP WHERE id = $2`,
    [senhaHash, id],
  );
}

export async function listarUsuarios() {
  const result = await db.query(`SELECT ${CAMPOS} FROM usuarios ORDER BY id ASC`);
  return result.rows;
}

export async function mudarRole(id, role) {
  const result = await db.query(
    `
      UPDATE usuarios
      SET role = $1, "dataAtualizacao" = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING ${CAMPOS}
    `,
    [role, id],
  );
  return result.rows[0];
}

export async function contarAdmins() {
  const result = await db.query(`SELECT COUNT(*) AS total FROM usuarios WHERE role = 'admin'`);
  return Number(result.rows[0]?.total ?? 0);
}
