import { consultar, reagir } from "../controllers/reacao.controller.mjs";
import { exigirPermissao } from "../auth/middleware.mjs";

export default function reacaoRoutes(router) {
  // Ver os totais: qualquer pessoa
  router.get("/documentos/:id/reacoes", consultar);

  // Dar like/deslike: só quem está logado (leitor, funcionário e admin têm essa permissão)
  router.put("/documentos/:id/reacao", exigirPermissao("interacoes:usar", reagir));
}
