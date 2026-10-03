import {
  atualizarPerfil,
  cadastrar,
  contas,
  entrar,
  enviarFoto,
  eu,
  googleCallback,
  googleInicio,
  removerFoto,
  sair,
  sairDeUmaConta,
  trocar,
} from "../controllers/auth.controller.mjs";
import { exigirLogin } from "../auth/middleware.mjs";

export default function authRoutes(router) {
  router.post("/auth/cadastro", cadastrar);
  router.post("/auth/login", entrar);
  router.post("/auth/logout", sair);

  // Várias contas no mesmo navegador (escolher, trocar, desconectar uma)
  router.get("/auth/contas", contas);
  router.post("/auth/trocar", trocar);
  router.post("/auth/contas/sair", sairDeUmaConta);

  // Quem está logado (público: devolve usuario null para visitantes)
  router.get("/auth/eu", eu);
  router.patch("/auth/eu", exigirLogin(atualizarPerfil));
  router.put("/auth/eu/foto", exigirLogin(enviarFoto));
  router.delete("/auth/eu/foto", exigirLogin(removerFoto));

  // Login com Google
  router.get("/auth/google", googleInicio);
  router.get("/auth/google/callback", googleCallback);
}
