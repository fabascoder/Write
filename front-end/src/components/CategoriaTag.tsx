import type { Categoria } from "../lib/categorias";

export default function CategoriaTag({ categoria }: { categoria?: Categoria }) {
  if (!categoria) return null;
  return <span className={`wr-cat wr-cat--${categoria.slug}`}>{categoria.nome}</span>;
}
