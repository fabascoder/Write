import { responder } from "../http.mjs";
import { pode } from "./permissoes.mjs";
import { usuarioDaSessao } from "./sessao.mjs";

// Envolve um handler e só deixa passar quem está logado.
// O usuário fica disponível em req.usuario.
export function exigirLogin(handler) {
  return async (req, res) => {
    const usuario = await usuarioDaSessao(req);
    if (!usuario) {
      responder(res, 401, { mensagem: "Entre na sua conta para continuar." });
      return;
    }
    req.usuario = usuario;
    return handler(req, res);
  };
}

// Logado E com a permissão. Ex.: exigirPermissao("artigos:gerenciar", publicar)
//   sem sessão  → 401
//   sem permissão → 403
export function exigirPermissao(permissao, handler) {
  return exigirLogin(async (req, res) => {
    if (!pode(req.usuario, permissao)) {
      responder(res, 403, { mensagem: "Sua conta não tem permissão para fazer isso." });
      return;
    }
    return handler(req, res);
  });
}
