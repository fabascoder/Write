import { useSearchParams } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { useAdmin } from "../../hooks/useAdmin";
import { buscarCategoria, categoriaDe } from "../../lib/categorias";
import { resumo } from "../../lib/format";
import FeaturedView from "../home/FeaturedView";
import Sidebar from "../home/Sidebar";
import TimelineView from "../home/TimelineView";
import type { Visao } from "../home/ViewToggle";
import AdminBar from "../admin/AdminBar";
import ContaForm from "../admin/ContaForm";
import ArtigoRow from "../home/ArtigoRow";
import { Head } from "../layout/Head";

export default function Home() {
  const { artigos, carregando, erro } = useArtigos();
  const { logado } = useAdmin();
  const [params, setParams] = useSearchParams();

  const visao: Visao = params.get("visao") === "linha-do-tempo" ? "linha-do-tempo" : "destaques";
  const categoria = buscarCategoria(params.get("categoria"));
  const busca = (params.get("busca") ?? "").trim().toLowerCase();

  const filtrados = artigos.filter((a) => {
    const porCategoria = categoria ? categoriaDe(a)?.slug === categoria.slug : true;
    const porBusca = busca
      ? a.titulo.toLowerCase().includes(busca) ||
        resumo(a.conteudoHtml, Infinity).toLowerCase().includes(busca)
      : true;
    return porCategoria && porBusca;
  });

  function atualizar(chave: string, valor: string | null) {
    const novos = new URLSearchParams(params);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    setParams(novos, { replace: true });
  }

  return (
    <main className="fc-main">
      <Head title={categoria?.nome ?? "Início"} description="Artigos publicados no Fabas Coder Blog." />

      <Sidebar
        visao={visao}
        mudarVisao={(v) => atualizar("visao", v === "destaques" ? null : v)}
        recentes={artigos.slice(0, 8)}
        categoria={categoria?.slug ?? null}
        escolherCategoria={(slug) => atualizar("categoria", slug)}
      />

      <div className="fc-conteudo">
        {logado && <AdminBar />}

        {busca && (
          <p className="fc-busca-aviso">
            Resultados para <strong>{params.get("busca")}</strong>
            <button type="button" onClick={() => atualizar("busca", null)}>
              limpar
            </button>
          </p>
        )}

        {carregando && <p className="fc-estado">Carregando artigos…</p>}
        {erro && <p className="fc-estado fc-estado--erro">{erro}</p>}

        {!carregando && !erro && filtrados.length === 0 && (
          <p className="fc-estado">Nenhum artigo encontrado.</p>
        )}

        {!carregando && !erro && filtrados.length > 0 && (
          logado ? (
            <section className="fc-mais">
              <h2 className="fc-rotulo">Meus artigos</h2>
              <ul>
                {filtrados.map((a) => (
                  <li key={String(a.id)}>
                    <ArtigoRow artigo={a} />
                  </li>
                ))}
              </ul>
            </section>
          ) : visao === "destaques" ? (
            <FeaturedView artigos={filtrados} />
          ) : (
            <TimelineView artigos={filtrados} />
          )
        )}

        {logado && <ContaForm />}
      </div>
    </main>
  );
}
