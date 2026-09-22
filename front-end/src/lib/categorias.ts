import type { Artigo } from "./api";

export type Categoria = {
  slug: string;
  nome: string;
};

// Cores ficam no CSS (--cat-vida, --cat-poemas...) para funcionarem no tema escuro
export const CATEGORIAS: Categoria[] = [
  { slug: "vida", nome: "Vida" },
  { slug: "poemas", nome: "Poemas" },
  { slug: "trabalho", nome: "Trabalho" },
  { slug: "romance", nome: "Romance" },
];

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Usa o campo categoria; se a API ainda não tiver, tenta achar nas tags
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
