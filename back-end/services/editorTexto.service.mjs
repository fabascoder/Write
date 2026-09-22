import { db } from "../database/database.mjs";

export async function publicarDocumento(data) {
  const result = await db.query(
    `
      INSERT INTO documentos (titulo, "conteudoHtml")
      VALUES ($1, $2)
      RETURNING id, titulo, "conteudoHtml", "dataCriacao"
    `,
    [data.titulo, data.conteudoHtml],
  );

  return result.rows[0];
}

export async function consultarDocumentos() {
  const result = await db.query(
    `
      SELECT
        id,
        titulo,
        "conteudoHtml",
        "dataCriacao"
      FROM documentos
      ORDER BY id DESC
    `,
  );

  return result.rows;
}

// ATUALIZAR DOCUMENTO
export async function atualizarDocumento(id, data) {
  const result = await db.query(
    `
      UPDATE documentos
      SET
        titulo = $1,
        "conteudoHtml" = $2
      WHERE id = $3
      RETURNING id, titulo, "conteudoHtml", "dataCriacao"
    `,
    [data.titulo, data.conteudoHtml, id],
  );

  return result.rows[0];
}

// DELETAR DOCUMENTO
export async function deletarDocumento(id) {
  const result = await db.query(
    `
      DELETE FROM documentos
      WHERE id = $1
      RETURNING id
    `,
    [id],
  );

  return result.rows[0];
}

export const cadastrarDocumento = publicarDocumento;
