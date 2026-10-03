import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "../lib/autenticacao";
import type { Cadastro, Usuario } from "../lib/autenticacao";
import { AuthContext, type PedidoLogin, type ValorAuth } from "./auth";

// Guarda quem está logado e abre o modal de login quando alguma ação precisa de conta.
// Ninguém precisa estar logado para ler: visitantes só têm usuario = null.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [google, setGoogle] = useState(false);
  const [pedido, setPedido] = useState<PedidoLogin | null>(null);

  useEffect(() => {
    let ativo = true;

    api
      .buscarSessao()
      .then((sessao) => {
        if (!ativo) return;
        setUsuario(sessao.usuario);
        setGoogle(sessao.google);
      })
      .catch((e) => console.error("Não foi possível consultar a sessão:", e))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const u = await api.entrar(email, senha);
    setUsuario(u);
    return u;
  }, []);

  const cadastrar = useCallback(async (dados: Cadastro) => {
    const u = await api.cadastrar(dados);
    setUsuario(u);
    return u;
  }, []);

  const sair = useCallback(async () => {
    try {
      await api.sair();
    } finally {
      setUsuario(null);
    }
  }, []);

  const pode = useCallback((permissao: string) => Boolean(usuario?.permissoes.includes(permissao)), [usuario]);

  const abrirLogin = useCallback((p: Partial<PedidoLogin> = {}) => setPedido({ modo: "entrar", ...p }), []);
  const fecharLogin = useCallback(() => setPedido(null), []);

  const exigirLogin = useCallback(
    (acao: string, executar: () => void) => {
      if (usuario) {
        executar();
        return;
      }
      setPedido({
        modo: "entrar",
        motivo: `Você precisa estar conectado para ${acao}.`,
        voltar: window.location.pathname + window.location.search,
      });
    },
    [usuario],
  );

  const valor = useMemo<ValorAuth>(
    () => ({
      usuario,
      carregando,
      google,
      entrar,
      cadastrar,
      sair,
      atualizarUsuario: setUsuario,
      pode,
      pedido,
      abrirLogin,
      fecharLogin,
      exigirLogin,
    }),
    [usuario, carregando, google, entrar, cadastrar, sair, pode, pedido, abrirLogin, fecharLogin, exigirLogin],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
