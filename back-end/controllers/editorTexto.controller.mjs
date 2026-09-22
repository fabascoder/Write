import * as servicesEditorTexto from "../services/editorTexto.service.mjs";

export async function publicarDocumento(req, res) {
  try {
    const data = JSON.parse(req.body);

    if (!data.titulo || !data.conteudoHtml) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      return res.end(
        JSON.stringify({
          mensagem: "Título e conteúdo são obrigatórios",
        }),
      );
    }

    const documento = servicesEditorTexto.publicarDocumento(data);

    res.writeHead(201, {
      "Content-Type": "application/json",
    });

    return res.end(
      JSON.stringify({
        mensagem: "Documento publicado com sucesso",
        documento,
      }),
    );
  } catch (error) {
    console.error(error);

    res.writeHead(500, {
      "Content-Type": "application/json",
    });

    return res.end(
      JSON.stringify({
        mensagem: "Erro ao publicar documento",
      }),
    );
  }
}

// Consultar todos os documentos
export async function consultarDocumentos(req, res) {
  try {
    const documentos = servicesEditorTexto.consultarDocumentos();

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    return res.end(
      JSON.stringify({
        mensagem: "Documentos consultados com sucesso",
        documentos,
        artigos: documentos,
      }),
    );
  } catch (error) {
    console.error(error);

    res.writeHead(500, {
      "Content-Type": "application/json",
    });

    return res.end(
      JSON.stringify({
        mensagem: "Erro ao consultar documentos",
      }),
    );
  }
}
