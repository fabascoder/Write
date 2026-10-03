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
    // Um INSERT com várias linhas: uma ida ao banco por lote, não uma por métrica
    for (let i = 0; i < lote.length; i += 50) {
      const pedaco = lote.slice(i, i + 50);
      const valores = [];
      const linhas = pedaco.map((m) => {
        const base = valores.length;
        valores.push(
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
        );
        return `(${Array.from({ length: 10 }, (_, j) => `$${base + j + 1}`).join(", ")})`;
      });
      await db.query(
        `
          INSERT INTO metricas
            (origem, acao, rota, metodo, status, "duracaoMs", "servidorMs", bytes, detalhes, "dataCriacao")
          VALUES ${linhas.join(", ")}
        `,
        valores,
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

// Tamanho de cada ponto nos gráficos de linha do tempo
function tamanhoDoBalde(dias) {
  const hora = 60 * 60 * 1000;
  if (dias <= 1) return hora; // 24 pontos
  if (dias <= 7) return 6 * hora; // 28 pontos
  return 24 * hora; // 30 pontos
}

// Agrupa as linhas por intervalo de tempo (para os gráficos de linha)
function serieNoTempo(linhas, inicio, fim, balde) {
  const primeiro = Math.floor(inicio / balde) * balde;
  const baldes = new Map();
  for (let t = primeiro; t < fim; t += balde) baldes.set(t, []);

  for (const l of linhas) {
    const t = Math.floor(new Date(l.dataCriacao).getTime() / balde) * balde;
    baldes.get(t)?.push(l);
  }

  return [...baldes.entries()].map(([t, lista]) => {
    const tempos = lista.map((l) => Number(l.duracaoMs)).sort((a, b) => a - b);
    return {
      inicio: new Date(t).toISOString(),
      total: lista.length,
      media: arredondar(media(tempos)),
      mediana: arredondar(percentil(tempos, 50)),
      p95: arredondar(percentil(tempos, 95)),
      erros: lista.filter((l) => Number(l.status) >= 500).length,
    };
  });
}

function comparacao(linhas) {
  const e = estatisticas(linhas);
  return { total: e.total, media: e.media, mediana: e.mediana, p95: e.p95 };
}

const LIMITE_LINHAS = 60000;
const AMOSTRAS_POR_ACAO = 4000;

export async function resumo(dias) {
  const agora = Date.now();
  const periodo = dias * 24 * 60 * 60 * 1000;
  const inicio = agora - periodo;

  // Busca o período escolhido E o anterior, para comparar ("12% mais rápido")
  const result = await db.query(
    `
      SELECT origem, acao, rota, metodo, status, "duracaoMs", "servidorMs", bytes, detalhes, "dataCriacao"
      FROM metricas
      WHERE "dataCriacao" >= $1
      ORDER BY "dataCriacao" DESC
      LIMIT ${LIMITE_LINHAS}
    `,
    [new Date(inicio - periodo).toISOString()],
  );

  const todas = result.rows.map((l) => ({ ...l, detalhes: lerDetalhes(l.detalhes) }));
  const atuais = todas.filter((l) => new Date(l.dataCriacao).getTime() >= inicio);
  const anteriores = todas.filter((l) => new Date(l.dataCriacao).getTime() < inicio);

  const agrupar = (linhas, chave) => {
    const grupos = {};
    for (const l of linhas) (grupos[chave(l)] ??= []).push(l);
    return grupos;
  };

  // ---------- Ações medidas no navegador (o que a pessoa sente) ----------
  const acoesAtuais = agrupar(atuais.filter((l) => l.origem === "navegador"), (l) => l.acao);
  const acoesAnteriores = agrupar(anteriores.filter((l) => l.origem === "navegador"), (l) => l.acao);

  const navegador = Object.fromEntries(
    Object.entries(acoesAtuais).map(([acao, lista]) => {
      const frias = lista.filter((l) => l.detalhes.frio === true);
      const quentes = lista.filter((l) => l.detalhes.frio !== true);
      const num = (v) => (v === null || v === undefined ? null : Number(v));

      return [
        acao,
        {
          ...estatisticas(lista),
          detalhes: mediaDosDetalhes(lista),
          primeiraVisita: { total: frias.length, media: arredondar(media(frias.map((l) => Number(l.duracaoMs)))) },
          navegando: { total: quentes.length, media: arredondar(media(quentes.map((l) => Number(l.duracaoMs)))) },
          anterior: comparacao(acoesAnteriores[acao] ?? []),
          recentes: lista.slice(0, 15).map((l) => ({
            data: l.dataCriacao,
            duracaoMs: arredondar(Number(l.duracaoMs)),
            servidorMs: arredondar(num(l.servidorMs)),
            bytes: num(l.bytes),
            status: num(l.status),
            detalhes: l.detalhes,
          })),
          // Cada medição, compacta, para os gráficos (as mais recentes primeiro)
          amostras: lista.slice(0, AMOSTRAS_POR_ACAO).map((l) => ({
            t: new Date(l.dataCriacao).getTime(),
            d: arredondar(Number(l.duracaoMs)),
            s: arredondar(num(l.servidorMs)),
            b: num(l.bytes),
            e: num(l.status) !== null && Number(l.status) >= 400 ? 1 : 0,
            f: l.detalhes.frio === true ? 1 : 0,
            c: typeof l.detalhes.celular === "boolean" ? (l.detalhes.celular ? 1 : 0) : null,
            r: typeof l.detalhes.rtt === "number" ? l.detalhes.rtt : null,
            i: typeof l.detalhes.imagensMs === "number" ? l.detalhes.imagensMs : null,
          })),
        },
      ];
    }),
  );

  // ---------- Rotas da API (tempo dentro do servidor) ----------
  const doServidor = atuais.filter((l) => l.origem === "servidor");
  const rotasAtuais = agrupar(doServidor, (l) => `${l.metodo} ${l.rota}`);
  const rotasAnteriores = agrupar(
    anteriores.filter((l) => l.origem === "servidor"),
    (l) => `${l.metodo} ${l.rota}`,
  );

  const servidor = Object.entries(rotasAtuais)
    .map(([rota, lista]) => ({
      rota,
      ...estatisticas(lista),
      erros5xx: lista.filter((l) => Number(l.status) >= 500).length,
      anterior: comparacao(rotasAnteriores[rota] ?? []),
    }))
    .sort((a, b) => b.total - a.total);

  const balde = tamanhoDoBalde(dias);

  return {
    dias,
    geradoEm: new Date(agora).toISOString(),
    inicio: new Date(inicio).toISOString(),
    fim: new Date(agora).toISOString(),
    balde,
    // Chegou no limite de linhas: os números se baseiam nas mais recentes
    truncado: result.rows.length >= LIMITE_LINHAS,
    navegador,
    servidor,
    servidorGeral: {
      ...estatisticas(doServidor),
      erros5xx: doServidor.filter((l) => Number(l.status) >= 500).length,
      anterior: comparacao(anteriores.filter((l) => l.origem === "servidor")),
      serie: serieNoTempo(doServidor, inicio, agora, balde),
    },
  };
}
