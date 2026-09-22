import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { categoriaDe } from "../../lib/categorias";
import { tempoLeitura } from "../../lib/format";
import CategoriaTag from "../CategoriaTag";
import Meta from "../home/Meta";
import { ArrowLeftIcon, ArrowRightIcon, LinkIcon } from "../icons";
import { Head } from "../layout/Head";

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { artigos, carregando, erro } = useArtigos();
  const [copiado, setCopiado] = useState(false);

  // Não há GET por id na API, então buscamos na lista
  const indice = artigos.findIndex((a) => String(a.id) === id);
  const artigo = artigos[indice];
  const proximo = indice >= 0 ? artigos[indice + 1] : undefined;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* navegador sem permissão */
    }
  }

  function voltar() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  if (carregando) return <main className="wr-main"><p className="wr-state">Carregando texto…</p></main>;
  if (erro) return <main className="wr-main"><p className="wr-state wr-state--erro">{erro}</p></main>;

  if (!artigo) {
    return (
      <main className="wr-main">
        <div className="wr-empty">
          <p>Esse texto não existe ou foi removido.</p>
          <Link to="/" className="wr-btn wr-btn--ghost">Voltar para o início</Link>
        </div>
      </main>
    );
  }

  const categoria = categoriaDe(artigo);

  return (
    <main className={"wr-main" + (artigo.capaUrl ? "" : " wr-main--read")}>
      <Head title={artigo.titulo} description={`${artigo.titulo} no Write.`} />

      <button type="button" className="wr-back" onClick={voltar}>
        <ArrowLeftIcon />
        Voltar para a lista
      </button>

      <article className={"wr-article" + (artigo.capaUrl ? " has-cover" : "")}>
        <div className="wr-article-body">
          <header className="wr-article-head">
            <CategoriaTag categoria={categoria} />
            <h1 className="wr-article-title">{artigo.titulo}</h1>
            <div className="wr-article-meta">
              <Meta artigo={artigo} />
              {artigo.conteudoHtml && (
                <span className="wr-meta">{tempoLeitura(artigo.conteudoHtml)} min de leitura</span>
              )}
            </div>
          </header>

          <div
            className="wr-prose"
            dangerouslySetInnerHTML={{ __html: artigo.conteudoHtml ?? "" }}
          />

          <footer className="wr-article-foot">
            <button type="button" className="wr-btn wr-btn--ghost wr-btn--sm" onClick={copiarLink}>
              <LinkIcon />
              {copiado ? "Link copiado" : "Copiar link"}
            </button>
            {artigo.tags && artigo.tags.length > 0 && (
              <ul className="wr-tags" aria-label="Tags">
                {artigo.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </footer>
        </div>

        {artigo.capaUrl && (
          <figure className="wr-article-cover">
            <img src={artigo.capaUrl} alt="" />
          </figure>
        )}
      </article>

      {proximo && (
        <Link to={`/artigo/${proximo.id}`} className="wr-next">
          <span className="wr-meta">Próximo texto</span>
          <span className="wr-next-title">
            {proximo.titulo}
            <ArrowRightIcon />
          </span>
        </Link>
      )}
    </main>
  );
}
