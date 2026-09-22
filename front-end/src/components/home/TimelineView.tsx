import { Link } from "react-router-dom";
import type { Artigo } from "../../lib/api";
import { agruparPorMes, dataPorExtenso, tempoRelativo } from "../../lib/format";
import { ArrowRightIcon } from "../icons";

export default function TimelineView({ artigos }: { artigos: Artigo[] }) {
  const meses = agruparPorMes(artigos);

  return (
    <div className="fc-timeline">
      {meses.map((mes) => (
        <section key={mes.chave} className="fc-mes">
          <h2 className="fc-mes-titulo">
            <span className="fc-no fc-no--mes" aria-hidden="true" />
            {mes.rotulo}
          </h2>

          <ul>
            {mes.artigos.map((a) => (
              <li key={String(a.id)}>
                <span className="fc-no" aria-hidden="true" />
                <Link to={`/artigo/${a.id}`} className="fc-linha">
                  <div>
                    <h3>{a.titulo}</h3>
                    <p className="fc-meta">
                      <span>{tempoRelativo(a.dataCriacao)}</span>
                      <span aria-hidden="true">|</span>
                      <time>{dataPorExtenso(a.dataCriacao)}</time>
                    </p>
                  </div>
                  <span className="fc-row-seta">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
