import { db } from "../database/database.mjs";

// Medições de desempenho. Para não pesar nas requisições, ficam numa fila
// na memória e vão para o banco em lotes (a cada 5 s ou 50 medições).

const fila = [];
let agendado = null;
let ultimaLimpeza = 0;

const GUARDAR_DIAS = 30;

export function registrarMetrica(metrica) {
  fila.push({ ...metrica, dataCriacao: new Date().toISOString() });
  if (fila.length >= 50) descarregar();
  else agendado ??= setTimeout(descarregar, 5000);
}

export async function descarregar() {
  clearTimeout(agendado);
  agendado = null;
  const lote = fila.splice(0);
  if (lote.length === 0) return;

  try {
    for (const m of lote) {
      await db.query(
        `
          INSERT INTO metricas
            (origem, acao, rota, metodo, status, "duracaoMs", "servidorMs", bytes, detalhes, "dataCriacao")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          m.origem,
          m.acao,
          m.rota ?? null,
          m.metodo ?? null,
          m.status ?? null,
          m.duracaoMs,
          m.servidorMs ?? null,
          m.bytes ?? null,
          m.detalhes ? JSON.stringify(m.detalhes) : null,
          m.dataCriacao,
        ],
      );
    }

    // Uma vez por hora, apaga o que tem mais de 30 dias
    if (Date.now() - ultimaLimpeza > 60 * 60 * 1000) {
      ultimaLimpeza = Date.now();
      const limite = new Date(Date.now() - GUARDAR_DIAS * 24 * 60 * 60 * 1000).toISOString();
      await db.query(`DELETE FROM metricas WHERE "dataCriacao" < $1`, [limite]);
    }
  } catch (error) {
    // Métrica nunca derruba o site: no pior caso, perde esse lote
    console.error("Não foi possível salvar as métricas:", error.message);
  }
}

// ---------- Resumo para o painel ----------

function percentil(ordenados, p) {
  if (ordenados.length === 0) return null;
  const i = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return ordenados[Math.max(0, i)];
}

const media = (lista) => (lista.length ? lista.reduce((a, b) => a + b, 0) / lista.length : null);
const arredondar = (n) => (n === null || n === undefined ? null : Math.round(n));

function estatisticas(linhas) {
  const tempos = linhas.map((l) => Number(l.duracaoMs)).sort((a, b) => a - b);
  const servidor = linhas.map((l) => l.servidorMs).filter((v) => v !== null && v !== undefined).map(Number);
  const bytes = linhas.map((l) => l.bytes).filter((v) => v !== null && v !== undefined).map(Number);

  return {
    total: linhas.length,
    media: arredondar(media(tempos)),
    mediana: arredondar(percentil(tempos, 50)),
    p95: arredondar(percentil(tempos, 95)),
    maximo: arredondar(tempos.at(-1)),
    servidorMedia: arredondar(media(servidor)),
    bytesMedia: arredondar(media(bytes)),
    erros: linhas.filter((l) => l.status !== null && l.status !== undefined && Number(l.status) >= 400).length,
  };
}

function lerDetalhes(texto) {
  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    return {};
  }
}

// Média de cada número que veio em "detalhes" (ex.: imagens, bytesImagens)
function mediaDosDetalhes(linhas) {
  const somas = {};
  for (const l of linhas) {
    for (const [chave, valor] of Object.entries(l.detalhes)) {
      if (typeof valor !== "number") continue;
      somas[chave] ??= [];
      somas[chave].push(valor);
    }
  }
  return Object.fromEntries(Object.entries(somas).map(([k, v]) => [k, arredondar(media(v))]));
}

export async function resumo(dias) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
  const result = await db.query(
    `
      SELECT origem, acao, rota, metodo, status, "duracaoMs", "servidorMs", bytes, detalhes, "dataCriacao"
      FROM metricas
      WHERE "dataCriacao" >= $1
      ORDER BY "dataCriacao" DESC
      LIMIT 20000
    `,
    [desde],
  );

  const linhas = result.rows.map((l) => ({ ...l, detalhes: lerDetalhes(l.detalhes) }));

  // Ações medidas no navegador (o que a pessoa sente)
  const acoes = {};
  for (const l of linhas.filter((l) => l.origem === "navegador")) (acoes[l.acao] ??= []).push(l);

  const navegador = Object.fromEntries(
    Object.entries(acoes).map(([acao, lista]) => {
      const frias = lista.filter((l) => l.detalhes.frio === true);
      const quentes = lista.filter((l) => l.detalhes.frio !== true);
      return [
        acao,
        {
          ...estatisticas(lista),
          detalhes: mediaDosDetalhes(lista),
          primeiraVisita: { total: frias.length, media: arredondar(media(frias.map((l) => Number(l.duracaoMs)))) },
          navegando: { total: quentes.length, media: arredondar(media(quentes.map((l) => Number(l.duracaoMs)))) },
          recentes: lista.slice(0, 15).map((l) => ({
            data: l.dataCriacao,
            duracaoMs: arredondar(Number(l.duracaoMs)),
            servidorMs: arredondar(l.servidorMs === null ? null : Number(l.servidorMs)),
            bytes: l.bytes === null ? null : Number(l.bytes),
            status: l.status === null ? null : Number(l.status),
            detalhes: l.detalhes,
          })),
        },
      ];
    }),
  );

  // Todas as rotas da API (tempo dentro do servidor)
  const rotas = {};
  for (const l of linhas.filter((l) => l.origem === "servidor")) (rotas[`${l.metodo} ${l.rota}`] ??= []).push(l);

  const servidor = Object.entries(rotas)
    .map(([rota, lista]) => ({
      rota,
      ...estatisticas(lista),
      erros5xx: lista.filter((l) => Number(l.status) >= 500).length,
    }))
    .sort((a, b) => b.total - a.total);

  return { dias, geradoEm: new Date().toISOString(), navegador, servidor };
}
