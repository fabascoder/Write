// Endereço da API. Em produção, defina VITE_API_URL no .env
import { tempo } from "./format";
export const API_URL =
  import.meta.env.VITE_API_URL ?? "https://writeapi.onrender.com";

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
