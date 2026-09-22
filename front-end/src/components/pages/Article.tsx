import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { useAdmin } from "../../hooks/useAdmin";
import { excluirArtigo } from "../../lib/api";
import { dataPorExtenso, tempoRelativo } from "../../lib/format";
import { ArrowLeftIcon, PenIcon, TrashIcon } from "../icons";
import ConfirmDialog from "../layout/ConfirmDialog";
import { Head } from "../layout/Head";

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { artigos, carregando, erro } = useArtigos();
  const { logado } = useAdmin();

  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState("");

  // A API não tem GET por id, então o artigo é buscado na lista
  const artigo = artigos.find((a) => String(a.id) === id);

  function voltar() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  async function apagar() {
    if (!artigo) return;
    try {
      setExcluindo(true);
      setErroExcluir("");
      await excluirArtigo(artigo.id);
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      setErroExcluir("Não foi possível excluir. Tente de novo em instantes.");
    } finally {
      setExcluindo(false);
    }
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
        <div className="fc-artigo-topo">
          <h1>{artigo.titulo}</h1>

          {logado && (
            <div className="fc-artigo-acoes">
              <button
                type="button"
                className="fc-btn fc-btn--primario fc-btn--icone"
                onClick={() => setConfirmando(true)}
                aria-label="Excluir artigo"
                title="Excluir artigo"
              >
                <TrashIcon />
              </button>
              <Link
                to={`/editor?id=${artigo.id}`}
                className="fc-btn fc-btn--primario fc-btn--icone"
                aria-label="Editar artigo"
                title="Editar artigo"
              >
                <PenIcon />
              </Link>
            </div>
          )}
        </div>

        <p className="fc-meta">
          <span>{tempoRelativo(artigo.dataCriacao)}</span>
          <span aria-hidden="true">|</span>
          <time>{dataPorExtenso(artigo.dataCriacao)}</time>
        </p>

        <div className="fc-prosa" dangerouslySetInnerHTML={{ __html: artigo.conteudoHtml ?? "" }} />
      </article>

      <ConfirmDialog
        aberto={confirmando}
        titulo="Excluir artigo"
        descricao={`"${artigo.titulo}" será apagado de vez. Essa ação não tem volta.`}
        carregando={excluindo}
        erro={erroExcluir}
        confirmar={apagar}
        cancelar={() => {
          setConfirmando(false);
          setErroExcluir("");
        }}
      />
    </main>
  );
}
