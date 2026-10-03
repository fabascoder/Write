import { API_URL } from "./api";

// Mede quanto tempo as ações levam para quem está usando o site e manda para
// o painel de desempenho. Não guarda quem fez a ação: só tempos e tamanhos.

export type AcaoMedida = "abrir_artigo" | "carregar_inicio" | "entrar" | "cadastro" | "curtir" | "personalizar";

export type Detalhes = Partial<
  Record<
    | "imagens"
    | "imagensEmbutidas"
    | "bytesImagensEmbutidas"
    | "bytesImagens"
    | "imagensMs"
    | "palavras"
    | "bytesHtml"
    | "artigos"
    | "capa"
    | "frio"
    | "celular"
    | "rtt"
    | "downlink",
    number | boolean
  >
>;

export type FimMedicao = {
  /** Status HTTP da resposta (200, 401...) */
  status?: number;
  /** Caminho da API usado na ação, para pegar o tempo no servidor e o tamanho */
  caminho?: string;
  detalhes?: Detalhes;
};

// Guarda mais entradas de rede (o padrão do navegador é 250)
if (typeof performance !== "undefined" && "setResourceTimingBufferSize" in performance) {
  performance.setResourceTimingBufferSize(1000);
  performance.addEventListener?.("resourcetimingbufferfull", () => performance.clearResourceTimings());
}

// Última chamada à API nesse caminho: quanto tempo ficou no servidor
// (cabeçalho Server-Timing) e quantos bytes vieram
function dadosDaRequisicao(caminho: string) {
  const alvo = `${API_URL}${caminho}`;
  const entradas = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

  for (let i = entradas.length - 1; i >= 0; i--) {
    const e = entradas[i];
    if (!e.name.split("?")[0].endsWith(alvo)) continue;
    const servidor = e.serverTiming?.find((t) => t.name === "app")?.duration;
    return {
      servidorMs: servidor === undefined ? undefined : Math.round(servidor),
      bytes: e.encodedBodySize || e.transferSize || undefined,
    };
  }
  return {};
}

// Aparelho e conexão de quem está lendo (não identifica a pessoa).
// rtt = tempo de ida e volta da internet; downlink = velocidade estimada (Mbps).
// O navegador só informa a conexão no Chrome/Edge/Android.
function aparelho(): Detalhes {
  const conexao = (navigator as Navigator & { connection?: { rtt?: number; downlink?: number } }).connection;
  return {
    celular: window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768,
    ...(typeof conexao?.rtt === "number" ? { rtt: conexao.rtt } : {}),
    ...(typeof conexao?.downlink === "number" ? { downlink: conexao.downlink } : {}),
  };
}

function enviar(dados: { detalhes?: Detalhes } & Record<string, unknown>) {
  dados = { ...dados, detalhes: { ...aparelho(), ...dados.detalhes } };
  const url = `${API_URL}/metricas`;
  const corpo = JSON.stringify(dados);
  try {
    // sendBeacon não atrasa nada e funciona até mudando de página
    if (navigator.sendBeacon?.(url, new Blob([corpo], { type: "application/json" }))) return;
  } catch {
    /* cai no fetch abaixo */
  }
  fetch(url, { method: "POST", body: corpo, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
    () => {},
  );
}

// Começa a cronometrar. Devolve a função que para o cronômetro e envia.
// "inicio" pode ser 0 para contar desde que a página começou a abrir.
export function iniciarMedicao(acao: AcaoMedida, inicio = performance.now()) {
  let terminou = false;

  // Se a pessoa trocar de aba no meio, o navegador pausa a página e o tempo
  // medido não representa o site: essa medição é descartada
  let ficouEscondida = document.visibilityState === "hidden";
  const aoMudarVisibilidade = () => {
    if (document.visibilityState === "hidden") ficouEscondida = true;
  };
  document.addEventListener("visibilitychange", aoMudarVisibilidade);

  return ({ status, caminho, detalhes }: FimMedicao = {}) => {
    if (terminou) return;
    terminou = true;
    document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    if (ficouEscondida) return;

    const duracaoMs = Math.round(performance.now() - inicio);

    // A entrada de rede aparece um instante depois da resposta
    setTimeout(() => {
      enviar({ acao, duracaoMs, status, ...(caminho ? dadosDaRequisicao(caminho) : {}), detalhes });
    }, 0);
  };
}

// Primeira tela desde que o site abriu? Então conta desde o início da página
// (inclui baixar o site e, no Render gratuito, o servidor "acordar").
export function inicioDaTela() {
  const agora = performance.now();
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const primeiraTela = !nav || nav.domContentLoadedEventEnd === 0 || agora - nav.domContentLoadedEventEnd < 1000;
  return { momento: primeiraTela ? 0 : agora, frio: primeiraTela };
}

// Espera as imagens de um trecho da página terminarem de carregar (até 15 s)
export async function esperarImagens(raiz: Element | null) {
  const imagens = [...(raiz?.querySelectorAll("img") ?? [])];
  const inicio = performance.now();

  await Promise.race([
    Promise.all(
      imagens.map((img) =>
        img.complete
          ? null
          : new Promise((pronto) => {
              img.addEventListener("load", pronto, { once: true });
              img.addEventListener("error", pronto, { once: true });
            }),
      ),
    ),
    new Promise((pronto) => setTimeout(pronto, 15_000)),
  ]);

  // Tamanho das imagens que vêm de outro endereço (quando o navegador informa)
  const bytesExternas = imagens
    .filter((img) => !img.src.startsWith("data:"))
    .reduce((soma, img) => {
      const e = performance.getEntriesByName(img.currentSrc || img.src)[0] as PerformanceResourceTiming | undefined;
      return soma + (e?.encodedBodySize || 0);
    }, 0);

  return { imagens: imagens.length, imagensMs: Math.round(performance.now() - inicio), bytesExternas };
}

// Fotos coladas no editor viram texto (base64) dentro do artigo
export function imagensEmbutidas(html: string) {
  const encontradas = html.match(/src="data:image\/[^"]+"/g) ?? [];
  return {
    imagensEmbutidas: encontradas.length,
    // base64 ocupa ~4/3 do arquivo original
    bytesImagensEmbutidas: encontradas.reduce((soma, s) => soma + Math.round(s.length * 0.75), 0),
  };
}
