import type { Artigo } from "./api";

export type Categoria = {
  slug: string;
  nome: string;
};

export const CATEGORIAS: Categoria[] = [
  { slug: "pensamentos", nome: "Pensamentos" },
  { slug: "poesias", nome: "Poesias" },
  { slug: "reflexoes", nome: "Reflexões" },
  { slug: "romance", nome: "Romance" },
  { slug: "trabalho", nome: "Trabalho" },
];

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Usa o campo categoria; se a API ainda não devolver, tenta achar nas tags
export function categoriaDe(artigo: Artigo): Categoria | undefined {
  const candidatos = [artigo.categoria, ...(artigo.tags ?? [])].filter(
    Boolean,
  ) as string[];

  for (const c of candidatos) {
    const achada = CATEGORIAS.find((cat) => cat.slug === normalizar(c));
    if (achada) return achada;
  }

  return undefined;
}

export function buscarCategoria(slug: string | null) {
  if (!slug) return undefined;
  return CATEGORIAS.find((c) => c.slug === slug);
}
