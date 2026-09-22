import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { categoriaDe } from "../../lib/categorias";
import { formatarData, tempoRelativo } from "../../lib/format";
import { lerRascunhos, removerRascunho } from "../../lib/rascunhos";
import CategoriaTag from "../CategoriaTag";
import Meta from "../home/Meta";
import { DraftIcon, FileIcon, PlusIcon, TrashIcon } from "../icons";
import { Head } from "../layout/Head";

export default function MeusArtigos() {
  const [params, setParams] = useSearchParams();
  const aba = params.get("aba") === "rascunhos" ? "rascunhos" : "artigos";
  const { artigos, carregando, erro } = useArtigos();
  const [rascunhos, setRascunhos] = useState(lerRascunhos);

  function excluirRascunho(id: string) {
    removerRascunho(id);
    setRascunhos(lerRascunhos());
  }

  return (
    <main className="wr-main">
      <Head title="Meus artigos" description="Gerencie seus textos." />

      <div className="wr-manage">
        <nav className="wr-manage-nav" aria-label="Seções">
          <button
            type="button"
            className={"wr-side-link" + (aba === "artigos" ? " active" : "")}
            onClick={() => setParams({})}
          >
            <FileIcon />
            Publicados
          </button>
          <button
            type="button"
            className={"wr-side-link" + (aba === "rascunhos" ? " active" : "")}
            onClick={() => setParams({ aba: "rascunhos" })}
          >
            <DraftIcon />
            Rascunhos
            <span className="wr-count">{rascunhos.length}</span>
          </button>
        </nav>

        <section>
          <div className="wr-toolbar">
            <div>
              <h1 className="wr-page-title">Meus artigos</h1>
              <p className="wr-page-sub">Gerencie o que já foi publicado e o que ainda está em andamento.</p>
            </div>
            <Link to="/editor" className="wr-btn wr-btn--primary">
              <PlusIcon />
              Novo artigo
            </Link>
          </div>

          {aba === "artigos" && (
            <>
              {carregando && <p className="wr-state">Carregando…</p>}
              {erro && <p className="wr-state wr-state--erro">{erro}</p>}
              <ul className="wr-manage-list">
                {artigos.map((a) => (
                  <li key={String(a.id)}>
                    <span className={`wr-dot wr-dot--${categoriaDe(a)?.slug ?? "todos"}`} aria-hidden="true" />
                    <div className="wr-manage-info">
                      <Link to={`/artigo/${a.id}`} className="wr-row-title">{a.titulo}</Link>
                      <div className="wr-manage-meta">
                        <CategoriaTag categoria={categoriaDe(a)} />
                        <Meta artigo={a} />
                      </div>
                    </div>
                    <Link to={`/artigo/${a.id}`} className="wr-btn wr-btn--ghost wr-btn--sm">Abrir</Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {aba === "rascunhos" && (
            rascunhos.length === 0 ? (
              <div className="wr-empty">
                <p>Nenhum rascunho salvo. Use "Salvar rascunho" no editor para guardar um texto sem publicar.</p>
              </div>
            ) : (
              <ul className="wr-manage-list">
                {rascunhos.map((r) => (
                  <li key={r.id}>
                    <span className="wr-dot wr-dot--todos" aria-hidden="true" />
                    <div className="wr-manage-info">
                      <Link to={`/editor?rascunho=${r.id}`} className="wr-row-title">{r.titulo}</Link>
                      <p className="wr-meta">
                        editado {tempoRelativo(r.atualizadoEm)}
                        <span aria-hidden="true" className="wr-meta-sep">|</span>
                        {formatarData(r.atualizadoEm)}
                      </p>
                    </div>
                    <Link to={`/editor?rascunho=${r.id}`} className="wr-btn wr-btn--ghost wr-btn--sm">Continuar</Link>
                    <button
                      type="button"
                      className="wr-icon-btn"
                      aria-label={`Excluir rascunho ${r.titulo}`}
                      onClick={() => excluirRascunho(r.id)}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </main>
  );
}
