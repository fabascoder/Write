import { Link } from "react-router-dom";
import type { Artigo } from "../../lib/api";
import { categoriaDe } from "../../lib/categorias";
import { agruparPorMes } from "../../lib/format";
import CategoriaTag from "../CategoriaTag";
import { ArrowRightIcon } from "../icons";
import CategoriaFiltro from "./CategoriaFiltro";
import Meta from "./Meta";

type Props = {
  artigos: Artigo[];
  todos: Artigo[];
  categoria: string | null;
  escolherCategoria: (slug: string | null) => void;
};

export default function TimelineView({ artigos, todos, categoria, escolherCategoria }: Props) {
  const meses = agruparPorMes(artigos);

  return (
    <div className="wr-timeline-layout">
      <aside className="wr-timeline-aside">
        <h2 className="wr-section-title">Filtrar</h2>
        <CategoriaFiltro todos={todos} ativa={categoria} escolher={escolherCategoria} />

        <h2 className="wr-section-title">Meses</h2>
        <ul className="wr-monthnav">
          {meses.map((m) => (
            <li key={m.chave}>
              <a href={`#mes-${m.chave}`}>
                {m.rotulo}
                <span className="wr-count">{m.artigos.length}</span>
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <div className="wr-timeline">
        {meses.map((m) => (
          <section key={m.chave} id={`mes-${m.chave}`} className="wr-month">
            <h2 className="wr-month-title">{m.rotulo}</h2>
            <ol className="wr-rail">
              {m.artigos.map((a) => {
                const cat = categoriaDe(a);
                return (
                  <li key={String(a.id)} className={`wr-rail-item wr-rail-item--${cat?.slug ?? "sem"}`}>
                    <span className="wr-node" aria-hidden="true" />
                    <Link to={`/artigo/${a.id}`} className="wr-rail-card">
                      <div>
                        <CategoriaTag categoria={cat} />
                        <h3 className="wr-row-title">{a.titulo}</h3>
                        <Meta artigo={a} />
                      </div>
                      <span className="wr-row-arrow">
                        <ArrowRightIcon />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
