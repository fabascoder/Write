import { publicarDocumento } from "../controllers/editorTexto.controller.mjs";

export default function editorTextoRoutes(router) {
  router.post("/publicar", publicarDocumento);
}
