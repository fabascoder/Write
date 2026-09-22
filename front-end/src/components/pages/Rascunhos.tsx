import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAdmin } from "../../hooks/useAdmin";
import { lerRascunhos, removerRascunho } from "../../lib/rascunhos";
import { dataPorExtenso, tempoRelativo } from "../../lib/format";
import { ArrowLeftIcon, ArrowRightIcon } from "../icons";
import AdminBar from "../admin/AdminBar";
import { Head } from "../layout/Head";

export default function Rascunhos() {
  const { logado } = useAdmin();
  const [rascunhos, setRascunhos] = useState(lerRascunhos);

  if (!logado) return <Navigate to="/" replace />;

  function excluir(id: string) {
    removerRascunho(id);
    setRascunhos(lerRascunhos());
  }

  return (
    <main className="fc-main fc-main--simples">
      <Head title="Rascunhos" description="Textos ainda não publicados." />

      <div className="fc-topo">
        <Link to="/" className="fc-voltar" aria-label="Voltar">
          <ArrowLeftIcon />
        </Link>
        <AdminBar />
      </div>

      <h1 className="fc-titulo-pagina">Rascunhos</h1>

      {rascunhos.length === 0 ? (
        <p className="fc-estado">
          Nenhum rascunho salvo. Use "Salvar rascunho" no editor para guardar um texto sem publicar.
        </p>
      ) : (
        <ul className="fc-mais-lista">
          {rascunhos.map((r) => (
            <li key={r.id}>
              <Link to={`/editor?rascunho=${r.id}`} className="fc-row">
                <div>
                  <h3>{r.titulo}</h3>
                  <p className="fc-meta">
                    <span>editado {tempoRelativo(r.atualizadoEm)}</span>
                    <span aria-hidden="true">|</span>
                    <time>{dataPorExtenso(r.atualizadoEm)}</time>
                  </p>
                </div>
                <span className="fc-row-seta">
                  <ArrowRightIcon />
                </span>
              </Link>
              <button type="button" className="fc-link-apagar" onClick={() => excluir(r.id)}>
                excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
