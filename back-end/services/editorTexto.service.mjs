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

export const cadastrarDocumento = publicarDocumento;
