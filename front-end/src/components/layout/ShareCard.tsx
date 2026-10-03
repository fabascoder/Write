import { alturaCartao, type Personalizacao } from "../../lib/compartilhar";
import { ArrowRightIcon } from "../icons";

type Props = Personalizacao & {
  titulo: string;
  trechoTexto?: string;
  data?: string;
  capa?: string;
  href: string;
  /** No iframe o cartão ocupa a altura toda */
  preencher?: boolean;
};

// Cartão personalizado: aparece na prévia do modal e dentro do <iframe>
export default function ShareCard({
  cor,
  tamanho,
  trecho,
  titulo,
  trechoTexto,
  data,
  capa,
  href,
  preencher = false,
}: Props) {
  return (
    <article
      className={`fc-cartao fc-cartao--${cor} fc-cartao--${tamanho}`}
      style={preencher ? undefined : { height: alturaCartao(tamanho) }}
    >
      {/* Só aparece quando o artigo tem capa de verdade */}
      {capa && (
        <div className="fc-cartao-capa" aria-hidden="true">
          <img src={capa} alt="" />
        </div>
      )}

      <div className="fc-cartao-corpo">
        <p className="fc-cartao-marca">
          <strong>FABAS CODER</strong> Blog
        </p>
        <h2 className="fc-cartao-titulo">{titulo}</h2>
        {data && <p className="fc-cartao-data">{data}</p>}
        {trecho && trechoTexto && <p className="fc-cartao-trecho">{trechoTexto}</p>}

        <a className="fc-cartao-ler" href={href} target="_blank" rel="noopener noreferrer">
          Ler artigo
          <ArrowRightIcon />
        </a>
      </div>
    </article>
  );
}
