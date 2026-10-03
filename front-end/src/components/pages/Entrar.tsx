import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import type { ModoLogin } from "../../context/auth";
import { destinoAposLogin, useAuth } from "../../hooks/useAuth";
import AuthForm from "../auth/AuthForm";
import { Head } from "../layout/Head";

const ERROS: Record<string, string> = {
  google: "Não foi possível entrar com o Google. Tente de novo.",
  "google-indisponivel": "O login com Google ainda não está disponível.",
};

// Só caminhos do próprio site, nunca outro endereço
function caminhoSeguro(caminho: string | null) {
  return caminho && /^\/(?!\/)/.test(caminho) ? caminho : "";
}

// /entrar e /cadastro: o mesmo formulário do modal, numa página própria.
// Usado quando alguém abre uma página protegida sem estar logado.
export default function Entrar({ modo }: { modo: ModoLogin }) {
  const { usuario, carregando } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const voltar = caminhoSeguro(params.get("voltar"));
  const erro = ERROS[params.get("erro") ?? ""] ?? "";

  if (!carregando && usuario) {
    return <Navigate to={voltar || destinoAposLogin(usuario.permissoes)} replace />;
  }

  function trocarModo() {
    const query = voltar ? `?voltar=${encodeURIComponent(voltar)}` : "";
    navigate(`${modo === "entrar" ? "/cadastro" : "/entrar"}${query}`, { replace: true });
  }

  return (
    <main className="fc-main fc-main--simples fc-auth-pagina">
      <Head
        title={modo === "entrar" ? "Entrar" : "Criar conta"}
        description="Entre ou crie sua conta no Fabas Coder Blog."
      />

      <section className="fc-modal-caixa fc-auth-caixa" aria-labelledby="titulo-auth">
        <AuthForm
          key={modo}
          modo={modo}
          trocarModo={trocarModo}
          aoConcluir={(u) => navigate(voltar || destinoAposLogin(u.permissoes), { replace: true })}
          voltar={voltar}
          erroInicial={erro}
          idTitulo="titulo-auth"
        />
      </section>
    </main>
  );
}
