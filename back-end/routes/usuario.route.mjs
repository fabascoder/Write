import { listar, mudarRole } from "../controllers/usuario.controller.mjs";
import { exigirPermissao } from "../auth/middleware.mjs";

export default function usuarioRoutes(router) {
  router.get("/usuarios", exigirPermissao("usuarios:gerenciar", listar));
  router.patch("/usuarios/:id/role", exigirPermissao("usuarios:gerenciar", mudarRole));
}
