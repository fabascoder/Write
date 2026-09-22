import type { Artigo } from "../../lib/api";
import { dataPorExtenso, tempoRelativo } from "../../lib/format";

export default function Meta({ artigo }: { artigo: Artigo }) {
  const relativo = tempoRelativo(artigo.dataCriacao);

  return (
    <p className="fc-meta">
      {relativo && (
        <>
          <span>{relativo}</span>
          <span aria-hidden="true">|</span>
        </>
      )}
      <time dateTime={artigo.dataCriacao ? new Date(artigo.dataCriacao).toISOString() : undefined}>
        {dataPorExtenso(artigo.dataCriacao)}
      </time>
    </p>
  );
}
