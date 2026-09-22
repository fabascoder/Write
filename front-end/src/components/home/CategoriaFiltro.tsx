import type { Artigo } from "../../lib/api";
import { CATEGORIAS, categoriaDe } from "../../lib/categorias";

type Props = {
  todos: Artigo[];
  ativa: string | null;
  escolher: (slug: string | null) => void;
};

export default function CategoriaFiltro({ todos, ativa, escolher }: Props) {
  const contar = (slug: string) => todos.filter((a) => categoriaDe(a)?.slug === slug).length;

  return (
    <ul className="wr-catlist">
      <li>
        <button
          type="button"
          className={"wr-catlist-item" + (!ativa ? " is-active" : "")}
          onClick={() => escolher(null)}
        >
          <span className="wr-dot wr-dot--todos" aria-hidden="true" />
          Todos
          <span className="wr-count">{todos.length}</span>
        </button>
      </li>
      {CATEGORIAS.map((c) => (
        <li key={c.slug}>
          <button
            type="button"
            className={"wr-catlist-item" + (ativa === c.slug ? " is-active" : "")}
            onClick={() => escolher(c.slug)}
          >
            <span className={`wr-dot wr-dot--${c.slug}`} aria-hidden="true" />
            {c.nome}
            <span className="wr-count">{contar(c.slug)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
