import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { BellIcon, HeartIcon, LogOutIcon, ShieldIcon, UserIcon } from "../icons";

// "Fabricio 👤" no rodapé, para quem está logado. Abre o menu da conta
// no mesmo balão azul do menu de opções do artigo.
export default function UserMenu() {
  const { usuario, pode, sair } = useAuth();
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

  if (!usuario) return null;

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
    <div className="fc-opcoes fc-usuario" ref={caixaRef} onKeyDown={teclado}>
      <button
        ref={botaoRef}
        type="button"
        className="fc-access fc-usuario-botao"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        {primeiroNome}
        <UserIcon />
      </button>

      {aberto && (
        <div className="fc-opcoes-menu fc-opcoes-menu--cima" role="menu" aria-label="Minha conta">
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
