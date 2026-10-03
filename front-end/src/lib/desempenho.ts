import { requisitar } from "./api";
import type { AcaoMedida } from "./medicao";

// ---------- O que vem da API ----------

export type Estatisticas = {
  total: number;
  media: number | null;
  mediana: number | null;
  p95: number | null;
  maximo: number | null;
  servidorMedia: number | null;
  bytesMedia: number | null;
  erros: number;
};

export type Recente = {
  data: string;
  duracaoMs: number;
  servidorMs: number | null;
  bytes: number | null;
  status: number | null;
  detalhes: Record<string, number | boolean>;
};

export type Comparacao = { total: number; media: number | null; mediana: number | null; p95: number | null };

/** Uma medição, compacta: t = quando, d = duração, s = servidor, b = bytes,
 *  e = erro, f = primeira visita, c = celular, r = rtt da internet, i = tempo das imagens */
export type Amostra = {
  t: number;
  d: number;
  s: number | null;
  b: number | null;
  e: 0 | 1;
  f: 0 | 1;
  c: 0 | 1 | null;
  r: number | null;
  i: number | null;
};

export type PontoSerie = {
  inicio: string;
  total: number;
  media: number | null;
  mediana: number | null;
  p95: number | null;
  erros: number;
};

export type ResumoAcao = Estatisticas & {
  detalhes: Record<string, number>;
  primeiraVisita: { total: number; media: number | null };
  navegando: { total: number; media: number | null };
  anterior: Comparacao;
  recentes: Recente[];
  amostras: Amostra[];
};

export type ResumoRota = Estatisticas & { rota: string; erros5xx: number; anterior: Comparacao };

export type Resumo = {
  dias: number;
  geradoEm: string;
  inicio: string;
  fim: string;
  /** Tamanho de cada ponto dos gráficos de linha, em ms */
  balde: number;
  truncado: boolean;
  navegador: Partial<Record<AcaoMedida, ResumoAcao>>;
  servidor: ResumoRota[];
  servidorGeral: Estatisticas & { erros5xx: number; anterior: Comparacao; serie: PontoSerie[] };
};

export function buscarDesempenho(dias: number) {
  return requisitar<Resumo>(`/metricas/resumo?dias=${dias}`);
}

// ---------- Limites de cada ação (tempo médio, em ms) ----------

export type Status = "bom" | "atencao" | "ruim" | "sem-dados";

export const ACOES: { id: AcaoMedida; nome: string; descricao: string; bom: number; ruim: number }[] = [
  { id: "abrir_artigo", nome: "Abrir artigo", descricao: "Do clique até o texto e as fotos aparecerem", bom: 1500, ruim: 3000 },
  { id: "carregar_inicio", nome: "Página inicial", descricao: "Até a lista de artigos aparecer", bom: 1500, ruim: 3000 },
  { id: "entrar", nome: "Entrar", descricao: "Do botão Entrar até a resposta", bom: 800, ruim: 2000 },
  { id: "cadastro", nome: "Cadastro", descricao: "Do botão Cadastrar até a conta criada", bom: 1000, ruim: 2500 },
  { id: "curtir", nome: "Curtir", descricao: "Do clique no 👍 ou 👎 até o servidor confirmar", bom: 400, ruim: 1000 },
  { id: "personalizar", nome: "Personalizar", descricao: "Do clique em Personalizar até o modal aparecer", bom: 150, ruim: 400 },
];

// Rotas da API: tempo dentro do servidor (95% das vezes)
const ROTA_BOM = 300;
const ROTA_RUIM = 1000;
// Login e cadastro conferem a senha com scrypt, que é lento de propósito
const ROTAS_COM_SENHA = ["POST /auth/login", "POST /auth/cadastro"];

function classificar(valor: number | null, bom: number, ruim: number): Status {
  if (valor === null) return "sem-dados";
  if (valor <= bom) return "bom";
  if (valor <= ruim) return "atencao";
  return "ruim";
}

// ---------- Formatação ----------

export function ms(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return "—";
  if (valor < 1000) return `${Math.round(valor)} ms`;
  return `${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`;
}

export function tamanho(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

// ---------- Diagnóstico ----------

export type Problema = { motivo: string; dica: string };

export type Diagnostico = {
  status: Status;
  titulo: string;
  texto: string;
  problemas: Problema[];
};

const DICA_SERVIDOR_DORMINDO =
  "No Render gratuito o servidor “dorme” depois de 15 minutos sem visitas e leva até ~50 s para acordar. " +
  "Se a lentidão aparece só às vezes, é isso: um plano pago no Render, ou um serviço gratuito que visite o site " +
  "a cada 10 minutos (como o cron-job.org), mantém o servidor acordado.";

const DICA_LISTA_INTEIRA =
  "Hoje o site baixa todos os artigos, com o texto inteiro, mesmo para mostrar um só. " +
  "Crie uma rota GET /documentos/:id para buscar só o artigo aberto, e faça a página inicial buscar só título, data e resumo.";

export function diagnosticar(acao: (typeof ACOES)[number], d: ResumoAcao | undefined): Diagnostico {
  if (!d || d.total === 0 || d.media === null) {
    return {
      status: "sem-dados",
      titulo: "Ainda sem medições",
      texto: `Assim que alguém usar “${acao.nome}”, os tempos aparecem aqui.`,
      problemas: [],
    };
  }

  // Com média calculada, nunca é "sem-dados"
  const status = classificar(d.media, acao.bom, acao.ruim) as Exclude<Status, "sem-dados">;
  const problemas: Problema[] = [];
  const servidor = d.servidorMedia ?? 0;
  const rede = Math.max(0, d.media - servidor);

  // Algumas muito lentas e a maioria rápida = servidor acordando
  if (d.p95 !== null && d.mediana !== null && d.p95 > 5000 && d.p95 > d.mediana * 4) {
    problemas.push({
      motivo: `A maioria leva ${ms(d.mediana)}, mas algumas demoraram muito mais (95% ficam abaixo de ${ms(d.p95)}; a pior, ${ms(d.maximo)}).`,
      dica: DICA_SERVIDOR_DORMINDO,
    });
  }

  if (acao.id === "abrir_artigo" || acao.id === "carregar_inicio") {
    const det = d.detalhes;

    if ((det.bytesImagensEmbutidas ?? 0) > 500 * 1024) {
      problemas.push({
        motivo: `As fotos estão embutidas dentro do texto e pesam, em média, ${tamanho(det.bytesImagensEmbutidas)} por artigo.`,
        dica:
          "Diminua as fotos antes de colocar no editor: até 1600 px de largura e qualidade de ~80% (JPEG ou WebP) " +
          "costuma deixar cada uma abaixo de 300 KB. Como elas vão junto com o texto, também deixam a página inicial pesada.",
      });
    } else if ((det.bytesImagens ?? 0) > 1.5 * 1024 * 1024) {
      problemas.push({
        motivo: `As imagens do artigo somam, em média, ${tamanho(det.bytesImagens)}.`,
        dica: "Comprima as fotos (até 1600 px de largura, JPEG ou WebP a ~80%) e evite usar muitas imagens grandes no mesmo texto.",
      });
    }

    if ((det.imagensMs ?? 0) > 1500) {
      problemas.push({
        motivo: `Depois do texto aparecer, as imagens ainda levaram ${ms(det.imagensMs)} para carregar.`,
        dica: "As fotos estão grandes para a conexão de quem lê. Otimize o tamanho e o formato delas.",
      });
    }

    if ((d.bytesMedia ?? 0) > 500 * 1024) {
      problemas.push({
        motivo: `Para mostrar a página, o site baixa ${tamanho(d.bytesMedia)} de dados do servidor.`,
        dica: DICA_LISTA_INTEIRA,
      });
    }

    const fria = d.primeiraVisita.media;
    const quente = d.navegando.media;
    if (fria !== null && quente !== null && fria > 3000 && fria > quente * 2) {
      const jaExplicado = problemas.some((p) => p.dica === DICA_SERVIDOR_DORMINDO);
      problemas.push({
        motivo: `Na primeira visita leva ${ms(fria)}; navegando dentro do site, ${ms(quente)}.`,
        dica:
          "A primeira visita inclui baixar o próprio site e, às vezes, esperar o servidor acordar. " +
          (jaExplicado ? "Veja a dica sobre o servidor “dormindo”, acima." : DICA_SERVIDOR_DORMINDO),
      });
    }
  }

  if (acao.id === "entrar" || acao.id === "cadastro") {
    if (servidor > 800) {
      problemas.push({
        motivo: `O servidor levou ${ms(servidor)} para responder, em média.`,
        dica:
          "Uma parte é proposital: a senha é conferida com scrypt (~100 a 300 ms) para dificultar ataques. " +
          "Bem acima disso, o servidor está sem fôlego: confira o plano do Render e se o banco está na mesma região.",
      });
    }
    if (d.total >= 5 && d.erros / d.total > 0.3) {
      problemas.push({
        motivo: `${Math.round((d.erros / d.total) * 100)}% das tentativas não deram certo (senha errada, e-mail repetido...).`,
        dica:
          "Se forem erros de digitação, é normal. Se o número for muito alto, pode ser alguém tentando adivinhar senhas: " +
          "o limite de 10 tentativas a cada 15 minutos já bloqueia isso.",
      });
    }
  }

  if (acao.id === "curtir" && servidor > 300) {
    problemas.push({
      motivo: `Salvar a curtida levou ${ms(servidor)} dentro do servidor.`,
      dica:
        "Deveria levar poucos milissegundos. Confira se o banco (Postgres) está na mesma região do servidor no Render: " +
        "a distância entre os dois aparece em cada consulta.",
    });
  }

  if (acao.id === "personalizar" && status !== "bom") {
    problemas.push({
      motivo: `Abrir o modal levou ${ms(d.media)}, e isso acontece todo no navegador, sem servidor.`,
      dica:
        (d.detalhes.capa ?? 0) > 0
          ? "A prévia do cartão mostra a capa do artigo: use capas leves (até ~200 KB)."
          : "Em celulares mais simples o modal pesa mais. Se acontecer sempre, a prévia do cartão pode ser simplificada.",
    });
  }

  // Celular bem mais lento que o computador
  const [computador, celular] = porAparelho(d.amostras ?? []);
  if (
    celular.total >= 3 &&
    computador.total >= 3 &&
    celular.mediana !== null &&
    computador.mediana !== null &&
    celular.mediana > computador.mediana * 1.8 &&
    celular.mediana > acao.bom
  ) {
    problemas.push({
      motivo: `No celular leva ${ms(celular.mediana)}; no computador, ${ms(computador.mediana)}.`,
      dica:
        "Celulares têm internet e processador mais fracos, então fotos pesadas e páginas grandes pesam mais neles. " +
        "Otimize as fotos e reduza o que cada página baixa — quem lê no celular é quem mais sente.",
    });
  }

  // Muita gente com internet lenta (o Chrome informa a latência)
  const comConexao = (d.amostras ?? []).filter((a) => a.r !== null);
  const lentas = comConexao.filter((a) => (a.r ?? 0) > 300).length;
  if (comConexao.length >= 5 && lentas / comConexao.length > 0.3 && status !== "bom") {
    problemas.push({
      motivo: `${Math.round((lentas / comConexao.length) * 100)}% das leituras vieram de uma internet lenta (resposta acima de 300 ms).`,
      dica:
        "Não dá para mudar a internet de quem lê, mas dá para mandar menos coisa: páginas e fotos mais leves " +
        "fazem mais diferença justamente para essas pessoas.",
    });
  }

  // Ruim e nenhuma causa óbvia: mostra onde o tempo foi gasto
  if (status === "ruim" && problemas.length === 0) {
    problemas.push(
      servidor > rede
        ? {
            motivo: `O tempo está no servidor: ${ms(servidor)} de ${ms(d.media)}.`,
            dica: "O banco ou o servidor estão lentos. Veja a aba “Servidor (API)” para descobrir qual rota pesa mais.",
          }
        : {
            motivo: `O tempo está na rede: ${ms(rede)} de ${ms(d.media)} foram no caminho entre o leitor e o servidor.`,
            dica: DICA_SERVIDOR_DORMINDO,
          },
    );
  }

  const titulos: Record<Exclude<Status, "sem-dados">, string> = {
    bom: "O sistema está bom aqui",
    atencao: "Está aceitável, mas dá para melhorar",
    ruim: "O sistema está ruim aqui",
  };

  const textos: Record<Exclude<Status, "sem-dados">, string> = {
    bom: `Em média ${ms(d.media)} — dentro do esperado (até ${ms(acao.bom)}).`,
    atencao: `Em média ${ms(d.media)}. O ideal é até ${ms(acao.bom)}.`,
    ruim: `Em média ${ms(d.media)}, acima do limite de ${ms(acao.ruim)}.`,
  };

  if (d.total < 5) {
    problemas.push({
      motivo: `Ainda são poucas medições (${d.total}).`,
      dica: "O resultado fica mais confiável conforme mais pessoas usam o site.",
    });
  }

  return { status, titulo: titulos[status], texto: textos[status], problemas };
}

// Rota da API: olha os 95% mais rápidos (ignora um ou outro pico)
export function diagnosticarRota(r: ResumoRota): Diagnostico {
  const comSenha = ROTAS_COM_SENHA.includes(r.rota);
  const bom = comSenha ? ROTA_BOM * 2 : ROTA_BOM;
  const status = classificar(r.p95, bom, ROTA_RUIM);
  const problemas: Problema[] = [];

  if (r.erros5xx > 0) {
    problemas.push({
      motivo: `${r.erros5xx} ${r.erros5xx === 1 ? "requisição deu" : "requisições deram"} erro no servidor (5xx).`,
      dica: "Veja os logs do Render (aba Logs) no horário do erro: a mensagem mostra o que falhou.",
    });
  }
  if ((r.bytesMedia ?? 0) > 500 * 1024) {
    problemas.push({
      motivo: `Cada resposta tem, em média, ${tamanho(r.bytesMedia)}.`,
      dica:
        r.rota === "GET /documentos"
          ? DICA_LISTA_INTEIRA
          : "A resposta é grande porque devolve o artigo inteiro, com as fotos embutidas no texto. " +
            "Otimize as fotos antes de colocar no editor (até 1600 px, ~80% de qualidade); " +
            "e, depois de salvar, a API poderia devolver só o id e a data, em vez do artigo todo.",
    });
  }
  if (status === "ruim" && problemas.length === 0) {
    problemas.push({
      motivo: `95% das respostas levam até ${ms(r.p95)} dentro do servidor.`,
      dica: comSenha
        ? "Conferir senha é lento de propósito, mas não tanto: o servidor pode estar sobrecarregado."
        : "A consulta ao banco está lenta. Confira se o banco está na mesma região do servidor e se a tabela tem índice.",
    });
  }

  return {
    status,
    titulo: status === "bom" ? "Rápida" : status === "atencao" ? "Atenção" : status === "ruim" ? "Lenta" : "Sem dados",
    texto: "",
    problemas,
  };
}

// Pior situação entre as ações com medição
export function statusGeral(diagnosticos: Diagnostico[]): Status {
  const ordem: Status[] = ["ruim", "atencao", "bom"];
  return ordem.find((s) => diagnosticos.some((d) => d.status === s)) ?? "sem-dados";
}

// ---------- Contas para os gráficos (a partir das amostras) ----------

function percentilDe(ordenados: number[], p: number) {
  if (ordenados.length === 0) return null;
  const i = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return ordenados[Math.max(0, i)];
}

export function medianaDe(valores: number[]) {
  return percentilDe([...valores].sort((a, b) => a - b), 50);
}

// Agrupa as amostras por intervalo de tempo (linha do tempo)
export function serieDasAmostras(amostras: Amostra[], inicio: string, fim: string, balde: number): PontoSerie[] {
  const de = Math.floor(new Date(inicio).getTime() / balde) * balde;
  const ate = new Date(fim).getTime();
  const grupos = new Map<number, number[]>();
  const erros = new Map<number, number>();
  for (let t = de; t < ate; t += balde) grupos.set(t, []);

  for (const a of amostras) {
    const t = Math.floor(a.t / balde) * balde;
    grupos.get(t)?.push(a.d);
    if (a.e) erros.set(t, (erros.get(t) ?? 0) + 1);
  }

  return [...grupos.entries()].map(([t, tempos]) => {
    const ordenados = tempos.sort((a, b) => a - b);
    return {
      inicio: new Date(t).toISOString(),
      total: ordenados.length,
      media: ordenados.length ? Math.round(ordenados.reduce((a, b) => a + b, 0) / ordenados.length) : null,
      mediana: percentilDe(ordenados, 50),
      p95: percentilDe(ordenados, 95),
      erros: erros.get(t) ?? 0,
    };
  });
}

// Satisfação (índice Apdex): rápidas contam 1, aceitáveis contam meio, lentas contam 0
export function satisfacao(amostras: Amostra[], bom: number, ruim: number) {
  if (amostras.length === 0) return null;
  const rapidas = amostras.filter((a) => a.d <= bom).length;
  const aceitaveis = amostras.filter((a) => a.d > bom && a.d <= ruim).length;
  return (rapidas + aceitaveis / 2) / amostras.length;
}

export type Faixa = { faixa: string; rotulo: string; de: number; ate: number; total: number; parte: number; zona: Exclude<Status, "sem-dados"> };

// Distribuição em faixas de tempo, com as faixas alinhadas aos limites da ação
export function histograma(amostras: Amostra[], bom: number, ruim: number): Faixa[] {
  const bordas = [0, bom / 2, bom, (bom + ruim) / 2, ruim, ruim * 2, ruim * 5, Infinity];
  const total = amostras.length || 1;

  return bordas.slice(0, -1).map((de, i) => {
    const ate = bordas[i + 1];
    const quantos = amostras.filter((a) => a.d > de && a.d <= ate).length + (i === 0 ? amostras.filter((a) => a.d === 0).length : 0);
    return {
      faixa: ate === Infinity ? `mais de ${ms(de)}` : i === 0 ? `até ${ms(ate)}` : `${ms(de)} a ${ms(ate)}`,
      // Rótulo curto para o eixo (a faixa completa aparece ao passar o mouse)
      rotulo: ate === Infinity ? `> ${ms(de)}` : `≤ ${ms(ate)}`,
      de,
      ate,
      total: quantos,
      parte: quantos / total,
      zona: ate <= bom ? "bom" : ate <= ruim ? "atencao" : "ruim",
    };
  });
}

// Comparação com o período anterior. Para tempo, menor é melhor.
export function variacao(atual: number | null, anterior: number | null | undefined) {
  if (atual === null || !anterior) return null;
  const pct = ((atual - anterior) / anterior) * 100;
  if (Math.abs(pct) < 1) {
    return { texto: "igual ao período anterior", curto: "igual ao anterior", melhorou: null as boolean | null, pct };
  }
  const curto = `${Math.abs(Math.round(pct))}% ${pct < 0 ? "mais rápido" : "mais lento"}`;
  return { texto: `${curto} que o período anterior`, curto, melhorou: pct < 0, pct };
}

export type Grupo = { nome: string; total: number; mediana: number | null };

export function porAparelho(amostras: Amostra[]): Grupo[] {
  const celular = amostras.filter((a) => a.c === 1).map((a) => a.d);
  const computador = amostras.filter((a) => a.c === 0).map((a) => a.d);
  return [
    { nome: "Computador", total: computador.length, mediana: medianaDe(computador) },
    { nome: "Celular", total: celular.length, mediana: medianaDe(celular) },
  ];
}

export function porVisita(amostras: Amostra[]): Grupo[] {
  const primeira = amostras.filter((a) => a.f === 1).map((a) => a.d);
  const navegando = amostras.filter((a) => a.f === 0).map((a) => a.d);
  return [
    { nome: "Navegando no site", total: navegando.length, mediana: medianaDe(navegando) },
    { nome: "Primeira visita", total: primeira.length, mediana: medianaDe(primeira) },
  ];
}

// Onde o tempo de uma ação vai, em média: servidor, imagens e o resto (internet + navegador)
export function composicao(d: ResumoAcao) {
  const total = d.media ?? 0;
  const servidor = Math.min(total, d.servidorMedia ?? 0);
  const imagens = Math.min(total - servidor, d.detalhes.imagensMs ?? 0);
  return [
    { nome: "Servidor", valor: servidor },
    { nome: "Imagens carregando", valor: imagens },
    { nome: "Internet e navegador", valor: Math.max(0, total - servidor - imagens) },
  ].filter((p) => p.valor > 0 || p.nome !== "Imagens carregando");
}

// Planilha com cada medição da ação
export function csvDasAmostras(amostras: Amostra[]) {
  const linhas = [
    "data,duracao_ms,servidor_ms,bytes,erro,primeira_visita,celular,internet_rtt_ms,imagens_ms",
    ...amostras.map((a) =>
      [new Date(a.t).toISOString(), a.d, a.s ?? "", a.b ?? "", a.e, a.f, a.c ?? "", a.r ?? "", a.i ?? ""].join(","),
    ),
  ];
  return linhas.join("\n");
}
