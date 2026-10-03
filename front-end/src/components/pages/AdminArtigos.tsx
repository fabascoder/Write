import { Link } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { ArrowLeftIcon } from "../icons";
import AdminBar from "../admin/AdminBar";
import ArtigoRow from "../home/ArtigoRow";
import { Head } from "../layout/Head";

// /admin/artigos — os artigos publicados. Editar e excluir ficam na página de cada um.
export default function AdminArtigos() {
  const { artigos, carregando, erro } = useArtigos();

  return (
    <main className="fc-main fc-main--simples">
      <Head title="Artigos" description="Artigos publicados." />

      <div className="fc-topo">
        <Link to="/admin" className="fc-voltar" aria-label="Voltar ao painel">
          <ArrowLeftIcon />
        </Link>
        <AdminBar />
      </div>

      <h1 className="fc-titulo-pagina">Artigos</h1>

      {carregando && <p className="fc-estado">Carregando artigos…</p>}
      {erro && <p className="fc-estado fc-estado--erro">{erro}</p>}
      {!carregando && !erro && artigos.length === 0 && <p className="fc-estado">Nenhum artigo publicado ainda.</p>}

      <ul className="fc-mais-lista">
        {artigos.map((a) => (
          <li key={String(a.id)}>
            <ArtigoRow artigo={a} />
          </li>
        ))}
      </ul>
    </main>
  );
}
