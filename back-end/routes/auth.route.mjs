import {
  atualizarPerfil,
  cadastrar,
  entrar,
  eu,
  googleCallback,
  googleInicio,
  sair,
} from "../controllers/auth.controller.mjs";
import { exigirLogin } from "../auth/middleware.mjs";

export default function authRoutes(router) {
  router.post("/auth/cadastro", cadastrar);
  router.post("/auth/login", entrar);
  router.post("/auth/logout", sair);

  // Quem está logado (público: devolve usuario null para visitantes)
  router.get("/auth/eu", eu);
  router.patch("/auth/eu", exigirLogin(atualizarPerfil));

  // Login com Google
  router.get("/auth/google", googleInicio);
  router.get("/auth/google/callback", googleCallback);
}
