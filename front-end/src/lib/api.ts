import { tempo } from "./format";

// Endereço da API, escolhido nesta ordem:
// 1. VITE_API_URL no .env, se existir (força um endereço qualquer)
// 2. `npm run dev:prod` → API de produção, com o front rodando local
// 3. `npm run dev`      → API local (back-end rodando em localhost:3000)
// 4. build (Vercel)     → API de produção
export const API_LOCAL = "http://localhost:3000";
export const API_PRODUCAO = "https://writeapi.onrender.com";

const usarLocal = import.meta.env.DEV && import.meta.env.MODE !== "producao";

export const API_URL: string =
  import.meta.env.VITE_API_URL || (usarLocal ? API_LOCAL : API_PRODUCAO);

if (import.meta.env.DEV) {
  console.info(`[Write] usando a API: ${API_URL}`);
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

// GET /documentos — mesma rota que você já usa
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

// POST /publicar — mesma rota que você já usa.
// categoria e tags vão junto; se o back-end ainda não salvar, ele só ignora.
export async function publicarArtigo(artigo: NovoArtigo) {
  const response = await fetch(`${API_URL}/publicar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artigo),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.mensagem || "Erro ao publicar artigo");
  }

  return data;
}

// PUT /documentos/:id — edita um artigo já publicado
export async function atualizarArtigo(id: string | number, artigo: NovoArtigo) {
  const response = await fetch(`${API_URL}/documentos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artigo),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.mensagem || "Erro ao atualizar artigo");
  }

  return data;
}

// DELETE /documentos/:id — apaga um artigo publicado
export async function excluirArtigo(id: string | number) {
  const response = await fetch(`${API_URL}/documentos/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.mensagem || "Erro ao excluir artigo");
  }

  return data;
}
