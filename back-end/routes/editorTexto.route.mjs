import {
  publicarDocumento,
  consultarDocumentos,
  atualizarDocumento,
  deletarDocumento,
} from "../controllers/editorTexto.controller.mjs";
import { exigirPermissao } from "../auth/middleware.mjs";

export default function editorTextoRoutes(router) {
  // Leitura: pública, ninguém precisa entrar para ler
  router.get("/consultarArtigos", consultarDocumentos);

  router.get("/documentos", consultarDocumentos);

  // Escrita: só quem tem permissão de gerenciar artigos (hoje, o admin).
  // Sem sessão → 401, sem permissão → 403
  router.post("/publicar", exigirPermissao("artigos:gerenciar", publicarDocumento));

  // Atualizar documento
  router.put("/documentos/:id", exigirPermissao("artigos:gerenciar", atualizarDocumento));

  // Deletar documento
  router.delete("/documentos/:id", exigirPermissao("artigos:gerenciar", deletarDocumento));
}
