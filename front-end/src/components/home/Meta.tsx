import type { Artigo } from "../../lib/api";
import { formatarData, tempoRelativo } from "../../lib/format";

export default function Meta({ artigo }: { artigo: Artigo }) {
  const relativo = tempoRelativo(artigo.dataCriacao);
  return (
    <p className="wr-meta">
      {relativo && (
        <>
          <span>{relativo}</span>
          <span aria-hidden="true" className="wr-meta-sep">|</span>
        </>
      )}
      <time dateTime={artigo.dataCriacao ? new Date(artigo.dataCriacao).toISOString() : undefined}>
        {formatarData(artigo.dataCriacao)}
      </time>
    </p>
  );
}
