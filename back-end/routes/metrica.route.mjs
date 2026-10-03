import { consultarResumo, receber } from "../controllers/metrica.controller.mjs";
import { exigirPermissao } from "../auth/middleware.mjs";

export default function metricaRoutes(router) {
  // O site manda as medições do navegador (público, com limite por IP)
  router.post("/metricas", receber);

  // Painel de desempenho (admin)
  router.get("/metricas/resumo", exigirPermissao("desempenho:ver", consultarResumo));
}
