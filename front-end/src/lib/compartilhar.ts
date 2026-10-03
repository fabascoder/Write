// Textos e links de compartilhamento. Vale para artigos hoje e para
// livros e capítulos quando eles existirem.

export type TipoCompartilhamento = "article" | "book" | "chapter";

export type DadosCompartilhamento = {
  title: string;
  url: string;
  type: TipoCompartilhamento;
  chapter?: number;
};

const NOME: Record<TipoCompartilhamento, string> = {
  article: "artigo",
  book: "livro",
  chapter: "capítulo",
};

// "Compartilhar artigo", "Compartilhar livro"...
export function tituloCompartilhar(type: TipoCompartilhamento) {
  return `Compartilhar ${NOME[type]}`;
}

export async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Sem clipboard (ex.: http fora do localhost): tenta o jeito antigo
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand("copy");
    campo.remove();
    return ok;
  }
}

// ---------- Cartão personalizado (incorporar) ----------

export type CorCartao = "claro" | "azul" | "escuro";
export type TamanhoCartao = "normal" | "compacto";

export type Personalizacao = {
  cor: CorCartao;
  tamanho: TamanhoCartao;
  trecho: boolean;
};

export const CORES: { valor: CorCartao; nome: string }[] = [
  { valor: "claro", nome: "Claro" },
  { valor: "azul", nome: "Azul" },
  { valor: "escuro", nome: "Escuro" },
];

export const TAMANHOS: { valor: TamanhoCartao; nome: string; altura: number }[] = [
  { valor: "normal", nome: "Normal", altura: 352 },
  { valor: "compacto", nome: "Compacto", altura: 152 },
];

export const PERSONALIZACAO_PADRAO: Personalizacao = {
  cor: "claro",
  tamanho: "normal",
  trecho: true,
};

export function alturaCartao(tamanho: TamanhoCartao) {
  return TAMANHOS.find((t) => t.valor === tamanho)?.altura ?? 352;
}

// Lê ?cor=azul&tamanho=compacto&trecho=0 e ignora valores inválidos
export function lerPersonalizacao(params: URLSearchParams): Personalizacao {
  const cor = params.get("cor");
  const tamanho = params.get("tamanho");
  return {
    cor: CORES.some((c) => c.valor === cor) ? (cor as CorCartao) : PERSONALIZACAO_PADRAO.cor,
    tamanho: TAMANHOS.some((t) => t.valor === tamanho)
      ? (tamanho as TamanhoCartao)
      : PERSONALIZACAO_PADRAO.tamanho,
    trecho: params.get("trecho") !== "0",
  };
}

// Link do cartão com a personalização na URL
export function linkPersonalizado(embedPath: string, p: Personalizacao) {
  const params = new URLSearchParams({ cor: p.cor, tamanho: p.tamanho });
  if (!p.trecho) params.set("trecho", "0");
  return `${window.location.origin}${embedPath}?${params}`;
}

export function codigoIncorporar(link: string, p: Personalizacao, title: string) {
  const titulo = title.replace(/"/g, "&quot;");
  return (
    `<iframe src="${link}" width="100%" height="${alturaCartao(p.tamanho)}" ` +
    `style="border:0;border-radius:12px" loading="lazy" title="${titulo} | Write"></iframe>`
  );
}
