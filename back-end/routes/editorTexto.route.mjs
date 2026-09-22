import {
  publicarDocumento,
  consultarDocumentos,
  atualizarDocumento,
  deletarDocumento,
} from "../controllers/editorTexto.controller.mjs";

export default function editorTextoRoutes(router) {
  router.post("/publicar", publicarDocumento);

  router.get("/consultarArtigos", consultarDocumentos);

  router.get("/documentos", consultarDocumentos);

  // Atualizar documento
  router.put("/documentos/:id", atualizarDocumento);

  // Deletar documento
  router.delete("/documentos/:id", deletarDocumento);
}
