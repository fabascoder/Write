import {
  publicarDocumento,
  consultarDocumentos,
} from "../controllers/editorTexto.controller.mjs";

export default function editorTextoRoutes(router) {
  router.post("/publicar", publicarDocumento);
  router.get("/consultarArtigos", consultarDocumentos);
}
