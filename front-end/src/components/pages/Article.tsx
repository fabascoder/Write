import { Link, useNavigate, useParams } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { dataPorExtenso, tempoRelativo } from "../../lib/format";
import { ArrowLeftIcon } from "../icons";
import { Head } from "../layout/Head";

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { artigos, carregando, erro } = useArtigos();

  // A API não tem GET por id, então o artigo é buscado na lista
  const artigo = artigos.find((a) => String(a.id) === id);

  function voltar() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  if (carregando) {
    return (
      <main className="fc-main fc-main--simples">
        <p className="fc-estado">Carregando artigo…</p>
      </main>
    );
  }

  if (erro || !artigo) {
    return (
      <main className="fc-main fc-main--simples">
        <p className="fc-estado fc-estado--erro">
          {erro || "Esse artigo não existe ou foi removido."}
        </p>
        <Link to="/" className="fc-btn fc-btn--contorno">
          Voltar para o início
        </Link>
      </main>
    );
  }

  return (
    <main className="fc-main fc-main--simples fc-artigo-pagina">
      <Head title={artigo.titulo} description={`${artigo.titulo} no Fabas Coder Blog.`} />

      <button type="button" className="fc-voltar" onClick={voltar} aria-label="Voltar">
        <ArrowLeftIcon />
      </button>

      <article className="fc-artigo">
        <h1>{artigo.titulo}</h1>
        <p className="fc-meta">
          <span>{tempoRelativo(artigo.dataCriacao)}</span>
          <span aria-hidden="true">|</span>
          <time>{dataPorExtenso(artigo.dataCriacao)}</time>
        </p>

        <div className="fc-prosa" dangerouslySetInnerHTML={{ __html: artigo.conteudoHtml ?? "" }} />
      </article>
    </main>
  );
}
