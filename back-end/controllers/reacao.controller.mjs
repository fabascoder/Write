import { lerJson, responder } from "../http.mjs";
import { usuarioDaSessao } from "../auth/sessao.mjs";
import * as reacoes from "../services/reacao.service.mjs";

function idDoDocumento(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /documentos/:id/reacoes  (público)
// Todo mundo vê os totais. Se a pessoa estiver logada, vem também a reação dela.
export async function consultar(req, res) {
  try {
    const id = idDoDocumento(req);
    if (!id) return responder(res, 400, { mensagem: "Artigo inválido." });
    if (!(await reacoes.documentoExiste(id))) return responder(res, 404, { mensagem: "Artigo não encontrado." });

    const usuario = await usuarioDaSessao(req);
    responder(res, 200, await reacoes.contarReacoes(id, usuario?.id));
  } catch (error) {
    console.error("Erro ao consultar reações:", error);
    responder(res, 500, { mensagem: "Não foi possível carregar as reações." });
  }
}

// PUT /documentos/:id/reacao  { valor: 1 | -1 | 0 }  (exige login)
// O usuário vem do token, nunca do corpo: ninguém reage no nome de outra pessoa.
export async function reagir(req, res) {
  try {
    const id = idDoDocumento(req);
    if (!id) return responder(res, 400, { mensagem: "Artigo inválido." });

    const valor = Number(lerJson(req).valor);
    if (![1, -1, 0].includes(valor)) {
      return responder(res, 400, { mensagem: "Reação inválida: use 1 (like), -1 (deslike) ou 0 (tirar)." });
    }

    if (!(await reacoes.documentoExiste(id))) return responder(res, 404, { mensagem: "Artigo não encontrado." });

    await reacoes.definirReacao(id, req.usuario.id, valor);
    responder(res, 200, await reacoes.contarReacoes(id, req.usuario.id));
  } catch (error) {
    console.error("Erro ao reagir:", error);
    responder(res, 500, { mensagem: "Não foi possível salvar sua reação." });
  }
}
