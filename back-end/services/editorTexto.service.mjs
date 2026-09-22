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
    id: result.lastInsertRowid,
    titulo: data.titulo,
    conteudoHtml: data.conteudoHtml,
  };
}

export const cadastrarDocumento = publicarDocumento;
