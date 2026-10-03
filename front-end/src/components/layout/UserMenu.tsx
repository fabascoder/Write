import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { BellIcon, HeartIcon, LogOutIcon, ShieldIcon, UserIcon } from "../icons";

// Foto padrão de perfil: círculo preto com a silhueta em branco
function Avatar() {
  return (
    <span className="fc-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="currentColor" />
        <circle cx="12" cy="9.4" r="4.3" fill="#fff" />
        <path d="M4.5 20.1C5.8 16.6 8.6 14.9 12 14.9s6.2 1.7 7.5 5.2A11 11 0 0 1 4.5 20.1Z" fill="#fff" />
      </svg>
    </span>
  );
}

type Props = {
  /**
   * trilho    → coluna da direita, junto do Instagram e do GitHub (desktop)
   * cabecalho → no topo, ao lado do ☰ (celular, onde a trilha vai para o rodapé)
   */
  lugar: "trilho" | "cabecalho";
};

// Conta do usuário.
//   visitante → só a foto padrão; clicar abre o login
//   logado    → "Olá, Nome" + foto; clicar abre o menu da conta
export default function UserMenu({ lugar }: Props) {
  const { usuario, carregando, pode, sair, abrirLogin } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  const fechar = useCallback((devolverFoco = false) => {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!aberto) return;
    caixaRef.current?.querySelector<HTMLElement>("[role=menuitem]:not([aria-disabled=true])")?.focus();

    function fora(e: MouseEvent) {
      if (!caixaRef.current?.contains(e.target as Node)) fechar();
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto, fechar]);

  if (!usuario) {
    return (
      <div className={`fc-conta fc-conta--${lugar}`}>
        <button
          type="button"
          className="fc-conta-botao"
          onClick={() => abrirLogin()}
          aria-label="Entrar ou criar conta"
          title="Entrar ou criar conta"
          // Enquanto a sessão carrega, o espaço fica reservado (sem piscar)
          style={carregando ? { visibility: "hidden" } : undefined}
        >
          <Avatar />
        </button>
      </div>
    );
  }

  function teclado(e: KeyboardEvent) {
    if (!aberto) return;
    if (e.key === "Escape") {
      e.preventDefault();
      fechar(true);
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const itens = [...(caixaRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
      const atual = itens.indexOf(document.activeElement as HTMLElement);
      const passo = e.key === "ArrowDown" ? 1 : -1;
      itens[(atual + passo + itens.length) % itens.length]?.focus();
    }
  }

  async function desconectar() {
    fechar();
    await sair();
    navigate("/");
  }

  const primeiroNome = usuario.nome.trim().split(/\s+/)[0];
  const admin = pode("admin:acessar");

  return (
    <div className={`fc-conta fc-conta--${lugar} fc-opcoes is-logado`} ref={caixaRef} onKeyDown={teclado}>
      <button
        ref={botaoRef}
        type="button"
        className={"fc-conta-botao" + (aberto ? " is-open" : "")}
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Minha conta: ${usuario.nome}`}
      >
        <span className="fc-conta-nome">Olá, {primeiroNome}</span>
        <Avatar />
      </button>

      {aberto && (
        <div className="fc-opcoes-menu fc-conta-menu" role="menu" aria-label="Minha conta">
          <div className="fc-conta-quem">
            <strong>{usuario.nome}</strong>
            <span>{usuario.email}</span>
          </div>

          <Link to="/perfil" role="menuitem" className="fc-opcoes-item" onClick={() => fechar()}>
            <UserIcon />
            Meu perfil
          </Link>

          {admin ? (
            <Link to="/admin" role="menuitem" className="fc-opcoes-item" onClick={() => fechar()}>
              <ShieldIcon />
              Painel administrativo
            </Link>
          ) : (
            <span role="menuitem" className="fc-opcoes-item" aria-disabled="true" tabIndex={-1}>
              <HeartIcon />
              Favoritos{" "}
              <span className="fc-em-breve">em breve</span>
            </span>
          )}

          <span role="menuitem" className="fc-opcoes-item" aria-disabled="true" tabIndex={-1}>
            <BellIcon />
            Notificações{" "}
            <span className="fc-em-breve">em breve</span>
          </span>

          <button type="button" role="menuitem" className="fc-opcoes-item" onClick={desconectar}>
            <LogOutIcon />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
