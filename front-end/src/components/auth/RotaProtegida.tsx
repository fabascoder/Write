import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LockIcon } from "../icons";
import { Head } from "../layout/Head";

type Props = {
  children: ReactNode;
  /** Ex.: "admin:acessar". Sem ela, basta estar logado */
  permissao?: string;
};

// Protege páginas no React. É só a parte visível: as rotas da API conferem
// a sessão e a permissão de novo, então esconder aqui não é a única barreira.
//   visitante       → vai para /entrar e volta depois
//   sem permissão   → "Acesso negado"
export default function RotaProtegida({ children, permissao }: Props) {
  const { usuario, carregando, pode } = useAuth();
  const { pathname, search } = useLocation();

  if (carregando) {
    return (
      <main className="fc-main fc-main--simples">
        <p className="fc-estado">Carregando…</p>
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to={`/entrar?voltar=${encodeURIComponent(pathname + search)}`} replace />;
  }

  if (permissao && !pode(permissao)) return <AcessoNegado />;

  return children;
}

function AcessoNegado() {
  return (
    <main className="fc-main fc-main--simples fc-auth-pagina">
      <Head title="Acesso negado" description="Sua conta não tem acesso a esta página." />
      <section className="fc-modal-caixa fc-auth-caixa" aria-labelledby="titulo-negado">
        <span className="fc-modal-icone fc-modal-icone--alerta">
          <LockIcon />
        </span>
        <h2 id="titulo-negado">Acesso negado</h2>
        <p className="fc-modal-sub">Sua conta não tem permissão para ver esta página.</p>
        <div className="fc-modal-acoes">
          <Link to="/" className="fc-btn fc-btn--contorno">
            Ir para o início
          </Link>
          <Link to="/perfil" className="fc-btn fc-btn--primario">
            Meu perfil
          </Link>
        </div>
      </section>
    </main>
  );
}
