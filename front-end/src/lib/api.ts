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

// GET /documentos — pública, não precisa de login
export async function listarArtigos(): Promise<Artigo[]> {
  const response = await fetch(`${API_URL}/documentos`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error("Erro ao consultar artigos");

  const data = (await response.json()) as {
    artigos?: Artigo[];
    documentos?: Artigo[];
  };

  const lista = data.artigos ?? data.documentos ?? [];

  // Mais recentes primeiro
  return [...lista].sort((a, b) => tempo(b.dataCriacao) - tempo(a.dataCriacao));
}

// POST /publicar — exige conta com permissão de gerenciar artigos.
// categoria e tags vão junto; se o back-end ainda não salvar, ele só ignora.
export async function publicarArtigo(artigo: NovoArtigo) {
  return requisitar("/publicar", { method: "POST", body: JSON.stringify(artigo) });
}

// PUT /documentos/:id — edita um artigo já publicado
export async function atualizarArtigo(id: string | number, artigo: NovoArtigo) {
  return requisitar(`/documentos/${id}`, { method: "PUT", body: JSON.stringify(artigo) });
}

// DELETE /documentos/:id — apaga um artigo publicado
export async function excluirArtigo(id: string | number) {
  return requisitar(`/documentos/${id}`, { method: "DELETE" });
}
