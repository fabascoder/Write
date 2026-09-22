import { Link } from "react-router-dom";
import type { Artigo } from "../../lib/api";
import { categoriaDe } from "../../lib/categorias";
import { resumo, tempoLeitura, tempoRelativo } from "../../lib/format";
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

export default function FeaturedView({ artigos, todos, categoria, escolherCategoria }: Props) {
  const [destaque, ...resto] = artigos;

  return (
    <div className="wr-featured">
      <div className="wr-featured-main">
        {destaque && (
          <article className="wr-hero">
            <CategoriaTag categoria={categoriaDe(destaque)} />
            <h2 className="wr-hero-title">
              <Link to={`/artigo/${destaque.id}`}>{destaque.titulo}</Link>
            </h2>
            <Meta artigo={destaque} />
            {destaque.conteudoHtml && (
              <p className="wr-hero-excerpt">{resumo(destaque.conteudoHtml, 240)}</p>
            )}
            <Link to={`/artigo/${destaque.id}`} className="wr-readmore">
              Ler texto
              <ArrowRightIcon />
              {destaque.conteudoHtml && (
                <span className="wr-readmore-time">{tempoLeitura(destaque.conteudoHtml)} min</span>
              )}
            </Link>
          </article>
        )}

        {resto.length > 0 && (
          <section className="wr-more" aria-labelledby="mais-artigos">
            <h2 id="mais-artigos" className="wr-section-title">
              Mais artigos
            </h2>
            <ul>
              {resto.map((a) => (
                <li key={String(a.id)}>
                  <Link to={`/artigo/${a.id}`} className="wr-row">
                    <div>
                      <CategoriaTag categoria={categoriaDe(a)} />
                      <h3 className="wr-row-title">{a.titulo}</h3>
                      <Meta artigo={a} />
                    </div>
                    <span className="wr-row-arrow">
                      <ArrowRightIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="wr-featured-aside">
        <section>
          <h2 className="wr-section-title">Artigos recentes</h2>
          <ul className="wr-recent">
            {todos.slice(0, 5).map((a) => (
              <li key={String(a.id)}>
                <Link to={`/artigo/${a.id}`}>
                  <span>{a.titulo}</span>
                  <small>{tempoRelativo(a.dataCriacao)}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="wr-section-title">Categorias</h2>
          <CategoriaFiltro todos={todos} ativa={categoria} escolher={escolherCategoria} />
        </section>
      </aside>
    </div>
  );
}
