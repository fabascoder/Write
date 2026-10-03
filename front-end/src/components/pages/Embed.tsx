import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { lerPersonalizacao } from "../../lib/compartilhar";
import { dataPorExtenso, htmlLegivel, resumo } from "../../lib/format";
import { ArrowRightIcon } from "../icons";
import Brand from "../layout/Brand";
import { Head } from "../layout/Head";
import ShareCard from "../layout/ShareCard";

// Dentro de um <iframe> em outro site?
function estaIncorporado() {
  try {
    return window.self !== window.top;
  } catch {
    return true; // o navegador bloqueou o acesso ao topo: é iframe
  }
}

// /embed/artigo/:id?cor=azul&tamanho=compacto
// No iframe: só o cartão. Aberto como link: o artigo inteiro na cor escolhida.
export default function Embed() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { artigos, carregando, erro } = useArtigos();
  const personalizacao = lerPersonalizacao(params);
  const incorporado = estaIncorporado();

  const artigo = artigos.find((a) => String(a.id) === id);

  // No iframe o fundo fica transparente, para os cantos arredondados aparecerem
  useEffect(() => {
    if (!incorporado) return;
    document.documentElement.classList.add("fc-embed");
    return () => document.documentElement.classList.remove("fc-embed");
  }, [incorporado]);

  const aviso = carregando ? "Carregando…" : erro || "Esse artigo não existe ou foi removido.";

  if (incorporado) {
    return (
      <main className="fc-embed-pagina">
        {artigo ? (
          <ShareCard
            {...personalizacao}
            titulo={artigo.titulo}
            trechoTexto={resumo(artigo.conteudoHtml, 260)}
            data={dataPorExtenso(artigo.dataCriacao)}
            capa={artigo.capaUrl}
            href={`${window.location.origin}/artigo/${artigo.id}`}
            preencher
          />
        ) : (
          <div className={`fc-cartao fc-cartao--${personalizacao.cor} fc-cartao--vazio`}>
            <p>{aviso}</p>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className={`fc-leitura fc-leitura--${personalizacao.cor}`}>
      <div className="fc-leitura-coluna">
        <header className="fc-leitura-topo">
          <Brand />
        </header>

        {artigo ? (
          <article>
            <Head title={artigo.titulo} description={resumo(artigo.conteudoHtml, 150)} />

            {artigo.capaUrl && <img src={artigo.capaUrl} alt="" className="fc-leitura-capa" />}
            <h1 className="fc-leitura-titulo">{artigo.titulo}</h1>
            <p className="fc-leitura-data">{dataPorExtenso(artigo.dataCriacao)}</p>

            <div className="fc-prosa" dangerouslySetInnerHTML={{ __html: htmlLegivel(artigo.conteudoHtml) }} />

            <Link to={`/artigo/${artigo.id}`} className="fc-leitura-ler">
              Ler artigo
              <ArrowRightIcon />
            </Link>
          </article>
        ) : (
          <p className="fc-estado">{aviso}</p>
        )}
      </div>
    </main>
  );
}
