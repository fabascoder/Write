import { Link } from "react-router-dom";
import { useArtigos } from "../../hooks/useArtigos";
import { useAuth } from "../../hooks/useAuth";
import { ActivityIcon, ArrowRightIcon, BookIcon, FileIcon, PenIcon, UserIcon } from "../icons";
import Novidades from "../admin/Novidades";
import { Head } from "../layout/Head";

// /admin — ponto de partida da administração
export default function AdminPainel() {
  const { usuario, pode } = useAuth();
  const { artigos, carregando } = useArtigos();

  const atalhos = [
    {
      para: "/admin/artigos",
      icone: <FileIcon />,
      titulo: "Artigos",
      texto: carregando ? "Carregando…" : `${artigos.length} publicado${artigos.length === 1 ? "" : "s"}`,
      permissao: "artigos:gerenciar",
    },
    { para: "/editor", icone: <PenIcon />, titulo: "Novo artigo", texto: "Escrever e publicar", permissao: "artigos:gerenciar" },
    { para: "/rascunhos", icone: <BookIcon />, titulo: "Rascunhos", texto: "Textos ainda não publicados", permissao: "artigos:gerenciar" },
    { para: "/admin/usuarios", icone: <UserIcon />, titulo: "Usuários", texto: "Contas e tipos de acesso", permissao: "usuarios:gerenciar" },
    { para: "/admin/desempenho", icone: <ActivityIcon />, titulo: "Desempenho", texto: "Velocidade do site e dicas", permissao: "desempenho:ver" },
  ].filter((a) => pode(a.permissao));

  return (
    <main className="fc-main fc-main--simples">
      <Head title="Painel administrativo" description="Administração do Fabas Coder Blog." />

      <h1 className="fc-titulo-pagina">Painel administrativo</h1>
      <p className="fc-admin-ola">Olá, {usuario?.nome.split(/\s+/)[0]}.</p>

      <ul className="fc-admin-atalhos">
        {atalhos.map((a) => (
          <li key={a.para}>
            <Link to={a.para} className="fc-admin-atalho">
              <span className="fc-admin-atalho-icone">{a.icone}</span>
              <span>
                <strong>{a.titulo}</strong>
                <small>{a.texto}</small>
              </span>
              <span className="fc-row-seta">
                <ArrowRightIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Novidades />
    </main>
  );
}
