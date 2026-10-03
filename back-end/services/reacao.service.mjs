import { db } from "../database/database.mjs";

export async function documentoExiste(documentoId) {
  const result = await db.query(`SELECT id FROM documentos WHERE id = $1`, [documentoId]);
  return result.rows.length > 0;
}

// Totais do artigo e, se houver alguém logado, a reação dessa pessoa
export async function contarReacoes(documentoId, usuarioId = null) {
  const totais = await db.query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN valor = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN valor = -1 THEN 1 ELSE 0 END), 0) AS dislikes
      FROM reacoes
      WHERE "documentoId" = $1
    `,
    [documentoId],
  );

  let minha = 0;
  if (usuarioId) {
    const result = await db.query(
      `SELECT valor FROM reacoes WHERE "documentoId" = $1 AND "usuarioId" = $2`,
      [documentoId, usuarioId],
    );
    minha = Number(result.rows[0]?.valor ?? 0);
  }

  return {
    // No Postgres o SUM volta como texto (bigint)
    likes: Number(totais.rows[0]?.likes ?? 0),
    dislikes: Number(totais.rows[0]?.dislikes ?? 0),
    minha,
  };
}

// valor: 1 (like), -1 (deslike) ou 0 (tira a reação)
export async function definirReacao(documentoId, usuarioId, valor) {
  if (valor === 0) {
    await db.query(`DELETE FROM reacoes WHERE "documentoId" = $1 AND "usuarioId" = $2`, [documentoId, usuarioId]);
    return;
  }

  // Cria ou troca (like ↔ deslike) numa operação só
  await db.query(
    `
      INSERT INTO reacoes ("usuarioId", "documentoId", valor)
      VALUES ($1, $2, $3)
      ON CONFLICT ("usuarioId", "documentoId")
      DO UPDATE SET valor = excluded.valor, "dataAtualizacao" = CURRENT_TIMESTAMP
    `,
    [usuarioId, documentoId, valor],
  );
}
