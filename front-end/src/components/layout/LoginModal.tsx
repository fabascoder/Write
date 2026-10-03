import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { destinoAposLogin, useAuth } from "../../hooks/useAuth";
import type { Usuario } from "../../lib/autenticacao";
import AuthForm from "../auth/AuthForm";
import { CloseIcon } from "../icons";

// Modal de entrar/criar conta. Abre pelo "Access" do rodapé ou quando uma ação
// precisa de conta (exigirLogin). O conteúdo da página continua lá atrás.
export default function LoginModal() {
  const { pedido, abrirLogin, fecharLogin } = useAuth();
  const navigate = useNavigate();
  const aberto = pedido !== null;

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fecharLogin();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, fecharLogin]);

  if (!pedido) return null;

  function concluir(usuario: Usuario) {
    fecharLogin();
    // Veio do "Access": leitor vai para o perfil, admin para o painel.
    // Veio de uma ação (curtir, comentar...): continua na mesma página.
    if (!pedido?.motivo) navigate(destinoAposLogin(usuario.permissoes));
  }

  const trocarModo = () => abrirLogin({ ...pedido, modo: pedido.modo === "entrar" ? "cadastro" : "entrar" });

  return (
    <div className="fc-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-login">
      <div className="fc-modal-fundo" onClick={fecharLogin} />
      <div className="fc-modal-caixa">
        <button type="button" className="fc-icon-btn fc-modal-fechar" onClick={fecharLogin} aria-label="Fechar">
          <CloseIcon />
        </button>

        <AuthForm
          key={pedido.modo}
          modo={pedido.modo}
          trocarModo={trocarModo}
          aoConcluir={concluir}
          motivo={pedido.motivo}
          voltar={pedido.voltar}
        />
      </div>
    </div>
  );
}
