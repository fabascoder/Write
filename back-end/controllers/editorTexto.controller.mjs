import * as servicesEditorTexto from "../services/editorTexto.service.mjs";

export async function publicarDocumento(req, res) {
  try {
    const data = JSON.parse(req.body);

    if (!data.titulo || !data.conteudoHtml) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          mensagem: "Título e conteúdo são obrigatórios",
        }),
      );

      return;
    }

    const documento = await servicesEditorTexto.publicarDocumento(data);

    res.writeHead(201, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        mensagem: "Documento publicado com sucesso",
        documento,
      }),
    );
  } catch (error) {
    console.error("Erro ao publicar documento:", error);

    res.writeHead(500, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        mensagem: "Erro ao publicar documento",
      }),
    );
  }
}

export async function consultarDocumentos(req, res) {
  try {
    const documentos = await servicesEditorTexto.consultarDocumentos();

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        mensagem: "Documentos consultados com sucesso",
        documentos,
      }),
    );
  } catch (error) {
    console.error("Erro ao consultar documentos:", error);

    res.writeHead(500, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        mensagem: "Erro ao consultar documentos",
      }),
    );
  }
}
