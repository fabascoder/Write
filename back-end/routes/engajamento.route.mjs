import { atividade, leitura, leituraDosArtigos, usuarios } from "../controllers/engajamento.controller.mjs";
import { exigirLogin, exigirPermissao } from "../auth/middleware.mjs";

export default function engajamentoRoutes(router) {
  // O site manda: quem está logado avisa que segue usando; quem lê manda o tempo de leitura
  router.post("/atividade", exigirLogin(atividade));
  router.post("/leituras", leitura);

  // Painel do admin
  router.get("/engajamento/usuarios", exigirPermissao("usuarios:gerenciar", usuarios));
  router.get("/engajamento/leitura", exigirPermissao("artigos:gerenciar", leituraDosArtigos));
}
