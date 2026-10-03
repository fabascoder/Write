import { ipDe, lerJson, lerQuery, responder } from "../http.mjs";
import { registrarMetrica, resumo } from "../services/metrica.service.mjs";

// Ações que o site mede no navegador
export const ACOES = ["abrir_artigo", "carregar_inicio", "entrar", "cadastro", "curtir", "personalizar"];

// Números extras aceitos em "detalhes" (o resto é ignorado)
const DETALHES = [
  "imagens",
  "imagensEmbutidas",
  "bytesImagensEmbutidas",
  "bytesImagens",
  "imagensMs",
  "palavras",
  "bytesHtml",
  "artigos",
  "frio",
  "capa",
];

// Cada IP manda no máximo 60 medições por minuto
const porIp = new Map();
function excedeuLimite(ip) {
  const agora = Date.now();
  const r = porIp.get(ip);
  if (!r || agora - r.inicio > 60_000) {
    porIp.set(ip, { inicio: agora, total: 1 });
    if (porIp.size > 5000) porIp.clear();
    return false;
  }
  r.total += 1;
  return r.total > 60;
}

const numero = (v, max) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : null);

// POST /metricas  (público: visitantes também abrem artigos)
// Só aceita ações e campos conhecidos, com números dentro de limites.
export function receber(req, res) {
  if (String(req.body ?? "").length > 4000) return responder(res, 413, { mensagem: "Medição grande demais." });
  if (excedeuLimite(ipDe(req))) return responder(res, 429, { mensagem: "Medições demais." });

  const corpo = lerJson(req);
  if (!ACOES.includes(corpo.acao)) return responder(res, 400, { mensagem: "Ação desconhecida." });

  const duracaoMs = numero(corpo.duracaoMs, 600_000);
  if (duracaoMs === null) return responder(res, 400, { mensagem: "Duração inválida." });

  const detalhes = {};
  for (const chave of DETALHES) {
    const v = corpo.detalhes?.[chave];
    if (typeof v === "boolean") detalhes[chave] = v;
    else if (numero(v, 1e9) !== null) detalhes[chave] = v;
  }

  registrarMetrica({
    origem: "navegador",
    acao: corpo.acao,
    status: numero(corpo.status, 999),
    duracaoMs,
    servidorMs: numero(corpo.servidorMs, 600_000),
    bytes: numero(corpo.bytes, 1e9),
    detalhes,
  });

  res.writeHead(204);
  res.end();
}

// GET /metricas/resumo?dias=7  (admin)
export async function consultarResumo(req, res) {
  try {
    const dias = Math.min(30, Math.max(1, Number(lerQuery(req).get("dias")) || 7));
    responder(res, 200, await resumo(dias));
  } catch (error) {
    console.error("Erro ao montar o resumo de desempenho:", error);
    responder(res, 500, { mensagem: "Não foi possível carregar o desempenho." });
  }
}
