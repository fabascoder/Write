import { Link, useSearchParams } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { buscarCategoria, categoriaDe } from "../../lib/categorias";
import FeaturedView from "../home/FeaturedView";
import TimelineView from "../home/TimelineView";
import ViewToggle, { type Visao } from "../home/ViewToggle";
import { Head } from "../layout/Head";

export default function Home() {
  const { artigos, carregando, erro } = useArtigos();
  const [params, setParams] = useSearchParams();

  const visao: Visao = params.get("visao") === "linha-do-tempo" ? "linha-do-tempo" : "destaques";
  const categoria = buscarCategoria(params.get("categoria"));

  const filtrados = categoria
    ? artigos.filter((a) => categoriaDe(a)?.slug === categoria.slug)
    : artigos;

  function atualizar(chave: string, valor: string | null) {
    const novos = new URLSearchParams(params);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    setParams(novos, { replace: true });
  }

  const mudarVisao = (v: Visao) => atualizar("visao", v === "destaques" ? null : v);
  const escolherCategoria = (slug: string | null) => atualizar("categoria", slug);

  return (
    <main className="wr-main">
      <Head title={categoria?.nome ?? "Início"} description="Textos publicados no Write." />

      <div className="wr-toolbar">
        <div>
          <h1 className="wr-page-title">{categoria?.nome ?? "Todos os textos"}</h1>
          {!carregando && !erro && (
            <p className="wr-page-sub">
              {filtrados.length === 1 ? "1 texto publicado" : `${filtrados.length} textos publicados`}
            </p>
          )}
        </div>
        <ViewToggle visao={visao} mudar={mudarVisao} />
      </div>

      {carregando && <p className="wr-state">Carregando artigos…</p>}
      {erro && <p className="wr-state wr-state--erro">{erro}</p>}

      {!carregando && !erro && filtrados.length === 0 && (
        <div className="wr-empty">
          <p>
            {categoria
              ? `Ainda não há textos em ${categoria.nome}.`
              : "Nenhum texto publicado ainda."}
          </p>
          <Link to="/editor" className="wr-btn wr-btn--primary">
            Escrever o primeiro
          </Link>
        </div>
      )}

      {!carregando && !erro && filtrados.length > 0 && (
        visao === "destaques" ? (
          <FeaturedView
            artigos={filtrados}
            todos={artigos}
            categoria={categoria?.slug ?? null}
            escolherCategoria={escolherCategoria}
          />
        ) : (
          <TimelineView
            artigos={filtrados}
            todos={artigos}
            categoria={categoria?.slug ?? null}
            escolherCategoria={escolherCategoria}
          />
        )
      )}
    </main>
  );
}
