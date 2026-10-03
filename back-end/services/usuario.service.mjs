import { db } from "../database/database.mjs";

const CAMPOS = `id, nome, email, role, "dataCriacao", "dataAtualizacao", "fotoEm"`;

// O que pode sair da API. Nunca inclui senhaHash.
export function usuarioPublico(u) {
  if (!u) return null;
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    dataCriacao: u.dataCriacao,
    foto: enderecoDaFoto(u),
  };
}

// Caminho da foto na API, ou null. O "?v=" muda a cada foto nova, então o
// navegador pode guardar a imagem em cache sem nunca mostrar uma antiga.
function enderecoDaFoto(u) {
  if (!u.fotoEm) return null;
  const versao = new Date(u.fotoEm).getTime() || 0;
  return `/usuarios/${u.id}/foto?v=${versao}`;
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
      SELECT u.id, u.nome, u.email, u.role, u."dataCriacao", u."dataAtualizacao", u."fotoEm"
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

// ---------- Foto de perfil ----------

export async function salvarFoto(id, tipo, dados) {
  await db.query(
    `
      INSERT INTO "fotosPerfil" ("usuarioId", tipo, dados)
      VALUES ($1, $2, $3)
      ON CONFLICT ("usuarioId") DO UPDATE SET tipo = excluded.tipo, dados = excluded.dados
    `,
    [id, tipo, dados],
  );
  // Data com milissegundos: duas fotos no mesmo segundo ainda ganham versões diferentes
  const result = await db.query(
    `UPDATE usuarios SET "fotoEm" = $1 WHERE id = $2 RETURNING ${CAMPOS}`,
    [new Date().toISOString(), id],
  );
  return result.rows[0];
}

export async function apagarFoto(id) {
  await db.query(`DELETE FROM "fotosPerfil" WHERE "usuarioId" = $1`, [id]);
  const result = await db.query(`UPDATE usuarios SET "fotoEm" = NULL WHERE id = $1 RETURNING ${CAMPOS}`, [id]);
  return result.rows[0];
}

export async function buscarFoto(id) {
  const result = await db.query(`SELECT tipo, dados FROM "fotosPerfil" WHERE "usuarioId" = $1`, [id]);
  return result.rows[0];
}
