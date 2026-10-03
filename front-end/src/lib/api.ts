import { tempo } from "./format";

// Endereço da API. O padrão é /api, no mesmo domínio do site: o Vite (em dev)
// e a Vercel (em produção) repassam para o back-end. Ver vite.config.ts e vercel.json.
//   npm run dev       → API local (back-end rodando em localhost:3000)
//   npm run dev:prod  → API de produção, com o front rodando local
//   build (Vercel)    → API de produção
// VITE_API_URL força outro endereço, mas aí o login não funciona
// (o cookie de sessão é do domínio do site).
export const API_URL: string = import.meta.env.VITE_API_URL || "/api";

// Erro com o status HTTP, para a tela saber se foi falta de login (401) ou de permissão (403)
export class ErroApi extends Error {
  status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

// fetch com JSON nos dois sentidos. Lança ErroApi com a mensagem do back-end.
export async function requisitar<T = Record<string, unknown>>(
  caminho: string,
  opcoes: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: { "Content-Type": "application/json", ...opcoes.headers },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ErroApi(data.mensagem || "Não foi possível falar com o servidor.", response.status);
  }

  return data as T;
}

export type Artigo = {
  id: string | number;
  titulo: string;
  conteudoHtml?: string;
  categoria?: string;
  tags?: string[];
  capaUrl?: string;
  dataCriacao?: string | Date | null;
};

export type NovoArtigo = {
  titulo: string;
  conteudoHtml: string;
  categoria?: string;
  tags?: string[];
};

// ---------- Lista de artigos, com cache ----------
// Quase toda página usa a lista inteira (home, artigo, embed, admin). Para não
// baixar de novo a cada clique:
//   1. o index.html já começa a buscar /documentos antes do JavaScript do site
//      chegar (e isso também acorda a API no Render, que dorme quando fica parada);
//   2. a lista fica em memória: trocar de página não refaz a requisição por 1 minuto;
//   3. a última lista fica no localStorage: quem volta ao site vê os artigos na hora,
//      enquanto a lista nova chega por trás (útil quando a API está acordando).

declare global {
  interface Window {
    /** Começado no index.html */
    __artigos?: Promise<unknown>;
  }
}

type RespostaArtigos = { artigos?: Artigo[]; documentos?: Artigo[] };

const CHAVE_ARTIGOS = "write-artigos";
const FRESCO_MS = 60 * 1000;

let emMemoria: { lista: Artigo[]; em: number } | null = null;
let pedido: Promise<Artigo[]> | null = null;

function organizar(data: RespostaArtigos): Artigo[] {
  const lista = data.artigos ?? data.documentos ?? [];
  // Mais recentes primeiro
  return [...lista].sort((a, b) => tempo(b.dataCriacao) - tempo(a.dataCriacao));
}

/** A lista que já está no navegador (memória ou localStorage), sem rede. */
export function artigosGuardados(): Artigo[] | null {
  if (emMemoria) return emMemoria.lista;
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_ARTIGOS) ?? "null");
    if (Array.isArray(salvo)) return salvo as Artigo[];
  } catch {
    /* sem localStorage ou dado corrompido: busca na rede */
  }
  return null;
}

/** true se a lista em memória é recente e não precisa ir à rede. */
export function artigosFrescos() {
  return emMemoria !== null && Date.now() - emMemoria.em < FRESCO_MS;
}

// GET /documentos — pública, não precisa de login. Pedidos ao mesmo tempo viram um só.
export function listarArtigos(): Promise<Artigo[]> {
  pedido ??= buscarNaRede()
    .then((lista) => {
      emMemoria = { lista, em: Date.now() };
      try {
        localStorage.setItem(CHAVE_ARTIGOS, JSON.stringify(lista));
      } catch {
        /* cheio ou bloqueado: fica só em memória */
      }
      return lista;
    })
    .finally(() => {
      pedido = null;
    });
  return pedido;
}

async function buscarNaRede(): Promise<Artigo[]> {
  // Usa a busca que o index.html já começou (uma vez só)
  const adiantada = API_URL === "/api" ? window.__artigos : undefined;
  window.__artigos = undefined;
  const pronta = (await adiantada?.catch(() => null)) as RespostaArtigos | null | undefined;
  if (pronta) return organizar(pronta);

  const response = await fetch(`${API_URL}/documentos`);
  if (!response.ok) throw new Error("Erro ao consultar artigos");
  return organizar((await response.json()) as RespostaArtigos);
}

/** Depois de publicar, editar ou excluir: a próxima página busca a lista nova. */
function esquecerArtigos() {
  emMemoria = null;
  try {
    localStorage.removeItem(CHAVE_ARTIGOS);
  } catch {
    /* ignora */
  }
}

// POST /publicar — exige conta com permissão de gerenciar artigos.
// categoria e tags vão junto; se o back-end ainda não salvar, ele só ignora.
export async function publicarArtigo(artigo: NovoArtigo) {
  const resposta = await requisitar("/publicar", { method: "POST", body: JSON.stringify(artigo) });
  esquecerArtigos();
  return resposta;
}

// PUT /documentos/:id — edita um artigo já publicado
export async function atualizarArtigo(id: string | number, artigo: NovoArtigo) {
  const resposta = await requisitar(`/documentos/${id}`, { method: "PUT", body: JSON.stringify(artigo) });
  esquecerArtigos();
  return resposta;
}

// DELETE /documentos/:id — apaga um artigo publicado
export async function excluirArtigo(id: string | number) {
  const resposta = await requisitar(`/documentos/${id}`, { method: "DELETE" });
  esquecerArtigos();
  return resposta;
}
