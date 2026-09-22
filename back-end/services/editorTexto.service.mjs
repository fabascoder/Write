import { db } from "../database/database.mjs";

export function publicarDocumento(data) {
  const result = db
    .prepare(
      /*sql*/ `
        INSERT INTO documentos (
            titulo,
            conteudoHtml
        ) VALUES (
            ?,
            ?
        )
      `,
    )
    .run(data.titulo, data.conteudoHtml);

  return {
    id: Number(result.lastInsertRowid),
    titulo: data.titulo,
    conteudoHtml: data.conteudoHtml,
  };
}

export function consultarDocumentos() {
  const documentos = db
    .prepare(
      /*sql*/ `
        SELECT
            id,
            titulo,
            conteudoHtml,
            dataCriacao
        FROM documentos
        ORDER BY id DESC
      `,
    )
    .all();

  return documentos;
}

export const cadastrarDocumento = publicarDocumento;
