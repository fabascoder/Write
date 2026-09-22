import { Link } from "react-router-dom";
import type { Artigo } from "../../lib/api";
import { resumo } from "../../lib/format";
import ArtigoRow from "./ArtigoRow";
import Meta from "./Meta";

const QUANTIDADE_DESTAQUE = 2;

export default function FeaturedView({ artigos }: { artigos: Artigo[] }) {
  const destaques = artigos.slice(0, QUANTIDADE_DESTAQUE);
  const resto = artigos.slice(QUANTIDADE_DESTAQUE);

  return (
    <div className="fc-destaques">
      {destaques.map((a) => (
        <article key={String(a.id)} className="fc-destaque">
          <h2>
            <Link to={`/artigo/${a.id}`}>{a.titulo}</Link>
          </h2>
          <Meta artigo={a} />
          {a.conteudoHtml && <p className="fc-resumo">{resumo(a.conteudoHtml, 220)}</p>}
          <Link to={`/artigo/${a.id}`} className="fc-ler">
            Ler artigo &rarr;
          </Link>
        </article>
      ))}

      {resto.length > 0 && (
        <section className="fc-mais">
          <h2 className="fc-rotulo">Mais artigos</h2>
          <ul>
            {resto.map((a) => (
              <li key={String(a.id)}>
                <ArtigoRow artigo={a} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
