import { useCallback, useEffect, useState } from "react";
import { entrar, estaLogado, sair } from "../lib/auth";

const EVENTO = "fcb-sessao-mudou";

// Compartilha o estado de login entre os componentes sem context
export function useAdmin() {
  const [logado, setLogado] = useState(estaLogado);

  useEffect(() => {
    const atualizar = () => setLogado(estaLogado());
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  const logar = useCallback((email: string, senha: string) => {
    const ok = entrar(email, senha);
    if (ok) window.dispatchEvent(new Event(EVENTO));
    return ok;
  }, []);

  const deslogar = useCallback(() => {
    sair();
    window.dispatchEvent(new Event(EVENTO));
  }, []);

  return { logado, logar, deslogar };
}
