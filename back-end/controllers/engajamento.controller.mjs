import { ipDe, lerJson, lerQuery, responder } from "../http.mjs";
import * as engajamento from "../services/engajamento.service.mjs";

// Limite simples por chave (IP ou usuário) por minuto
function limitador(maximo) {
  const mapa = new Map();
  return (chave) => {
    const agora = Date.now();
    const r = mapa.get(chave);
    if (!r || agora - r.inicio > 60_000) {
      mapa.set(chave, { inicio: agora, total: 1 });
      if (mapa.size > 5000) mapa.clear();
      return false;
    }
    r.total += 1;
    return r.total > maximo;
  };
}

const excedeuAtividade = limitador(6);
const excedeuLeitura = limitador(30);

const diasDa = (req) => Math.min(365, Math.max(1, Number(lerQuery(req).get("dias")) || 30));

// POST /atividade  { segundos }  (logado) — sinal de "ainda estou aqui"
export async function atividade(req, res) {
  try {
    if (excedeuAtividade(req.usuario.id)) return responder(res, 429, { mensagem: "Sinais demais." });
    const segundos = Math.round(Number(lerJson(req).segundos));
    if (!Number.isFinite(segundos) || segundos < 1 || segundos > 90) {
      return responder(res, 400, { mensagem: "Tempo inválido." });
    }
    await engajamento.registrarAtividade(req.usuario.id, segundos);
    res.writeHead(204);
    res.end();
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);
    responder(res, 500, { mensagem: "Não foi possível registrar." });
  }
}

// POST /leituras  { artigoId, segundos, rolagem }  (público: visitantes também leem)
export async function leitura(req, res) {
  try {
    if (String(req.body ?? "").length > 500) return responder(res, 413, { mensagem: "Grande demais." });
    if (excedeuLeitura(ipDe(req))) return responder(res, 429, { mensagem: "Leituras demais." });

    const corpo = lerJson(req);
    const artigoId = Number(corpo.artigoId);
    const segundos = Math.round(Number(corpo.segundos));
    const rolagem = Math.round(Number(corpo.rolagem));

    if (!Number.isInteger(artigoId) || artigoId < 1) return responder(res, 400, { mensagem: "Artigo inválido." });
    if (!Number.isFinite(segundos) || segundos < 1 || segundos > 4 * 60 * 60) {
      return responder(res, 400, { mensagem: "Tempo inválido." });
    }
    if (!Number.isFinite(rolagem) || rolagem < 0 || rolagem > 100) {
      return responder(res, 400, { mensagem: "Rolagem inválida." });
    }
    if (!(await engajamento.documentoExiste(artigoId))) return responder(res, 404, { mensagem: "Artigo não encontrado." });

    await engajamento.registrarLeitura(artigoId, segundos, rolagem);
    res.writeHead(204);
    res.end();
  } catch (error) {
    console.error("Erro ao registrar leitura:", error);
    responder(res, 500, { mensagem: "Não foi possível registrar." });
  }
}

// GET /engajamento/usuarios?dias=30  (admin)
export async function usuarios(req, res) {
  try {
    const dias = diasDa(req);
    responder(res, 200, { dias, usuarios: await engajamento.tempoPorUsuario(dias) });
  } catch (error) {
    console.error("Erro ao consultar tempo dos usuários:", error);
    responder(res, 500, { mensagem: "Não foi possível consultar." });
  }
}

// GET /engajamento/leitura?dias=30  (admin)
export async function leituraDosArtigos(req, res) {
  try {
    const dias = diasDa(req);
    responder(res, 200, { dias, artigos: await engajamento.leituraPorArtigo(dias) });
  } catch (error) {
    console.error("Erro ao consultar leitura:", error);
    responder(res, 500, { mensagem: "Não foi possível consultar." });
  }
}
