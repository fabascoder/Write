import { Link } from "react-router-dom";
import type { Artigo } from "../../lib/api";
import { CATEGORIAS } from "../../lib/categorias";
import { tempoRelativo } from "../../lib/format";
import ViewToggle, { type Visao } from "./ViewToggle";

type Props = {
  visao: Visao;
  mudarVisao: (v: Visao) => void;
  recentes: Artigo[];
  categoria: string | null;
  escolherCategoria: (slug: string | null) => void;
};

export default function Sidebar({
  visao,
  mudarVisao,
  recentes,
  categoria,
  escolherCategoria,
}: Props) {
  return (
    <aside className="fc-sidebar">
      <ViewToggle visao={visao} mudar={mudarVisao} />
      <hr className="fc-sidebar-regua" />

      {visao === "destaques" ? (
        <>
          <h2 className="fc-sidebar-titulo">Artigos Recentes</h2>
          <ul className="fc-recentes fc-scroll">
            {recentes.map((a) => (
              <li key={String(a.id)}>
                <Link to={`/artigo/${a.id}`}>{a.titulo}</Link>
                <small>{tempoRelativo(a.dataCriacao)}</small>
              </li>
            ))}
            {recentes.length === 0 && <li className="fc-vazio-mini">Nenhum artigo ainda</li>}
          </ul>
        </>
      ) : (
        <>
          <h2 className="fc-sidebar-titulo">Filtrar</h2>
          <ul className="fc-filtros fc-scroll">
            <li>
              <button
                type="button"
                className={!categoria ? "is-active" : ""}
                onClick={() => escolherCategoria(null)}
              >
                Todos
              </button>
            </li>
            {CATEGORIAS.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  className={categoria === c.slug ? "is-active" : ""}
                  onClick={() => escolherCategoria(c.slug)}
                >
                  {c.nome}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
