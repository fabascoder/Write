import { NOVIDADES, expiraEm, tempoRestante } from "../../lib/novidades";
import { dataPorExtenso } from "../../lib/format";

// Só para quem está logado: quanto tempo falta para cada selo "Novo" sumir
export default function Novidades() {
  if (NOVIDADES.length === 0) return null;

  return (
    <section className="fc-novidades" aria-labelledby="titulo-novidades">
      <h2 id="titulo-novidades" className="fc-rotulo">Selos de novidade</h2>

      <ul>
        {NOVIDADES.map((n) => {
          const resta = tempoRestante(n);
          const fim = dataPorExtenso(expiraEm(n));

          return (
            <li key={n.id} className={"fc-novidade" + (resta.expirado ? " is-expirada" : "")}>
              <div className="fc-novidade-topo">
                <strong>{n.nome}</strong>
                {!resta.expirado && <span className="fc-novo">Novo</span>}
                <span className="fc-novidade-resta">{resta.texto}</span>
              </div>

              <p className="fc-novidade-desc">{n.descricao}</p>

              <div
                className="fc-novidade-barra"
                role="progressbar"
                aria-label={`Tempo do selo de ${n.nome}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(resta.progresso * 100)}
              >
                <span style={{ width: `${resta.progresso * 100}%` }} />
              </div>

              <p className="fc-novidade-data">
                {resta.expirado ? `O selo saiu do ar em ${fim}` : `O selo some em ${fim}`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
