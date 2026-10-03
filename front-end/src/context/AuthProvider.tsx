import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/autenticacao";
import type { Cadastro, Usuario } from "../lib/autenticacao";
import { AuthContext, type PedidoLogin, type ValorAuth } from "./auth";
import { useTempoLogado } from "../hooks/useTempoLogado";

// Guarda quem está logado. O login em si é um JWT num cookie httpOnly:
// este código nunca vê nem guarda o token, só pergunta ao back-end quem é.
// Ninguém precisa estar logado para ler: visitantes só têm usuario = null.
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [google, setGoogle] = useState(false);

  // Tempo logado (para o painel do admin)
  useTempoLogado(usuario?.id);

  // Toda conta que entra fica lembrada na tela "Escolha uma conta"
  useEffect(() => {
    if (usuario) api.lembrarConta(usuario);
  }, [usuario]);

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

  const trocarConta = useCallback(async (id: number) => {
    const u = await api.trocarConta(id);
    setUsuario(u);
    return u;
  }, []);

  const pode = useCallback((permissao: string) => Boolean(usuario?.permissoes.includes(permissao)), [usuario]);

  const abrirLogin = useCallback(
    ({ modo = "entrar", motivo, voltar }: PedidoLogin = {}) => {
      const caminho = modo === "cadastro" ? "/cadastro" : "/entrar";
      navigate(api.comVoltar(caminho, api.caminhoSeguro(voltar)), { state: motivo ? { motivo } : null });
    },
    [navigate],
  );

  const exigirLogin = useCallback(
    (acao: string, executar: () => void) => {
      if (usuario) {
        executar();
        return;
      }
      abrirLogin({
        motivo: `Você precisa estar conectado para ${acao}.`,
        voltar: window.location.pathname + window.location.search,
      });
    },
    [usuario, abrirLogin],
  );

  const valor = useMemo<ValorAuth>(
    () => ({
      usuario,
      carregando,
      google,
      entrar,
      cadastrar,
      sair,
      trocarConta,
      atualizarUsuario: setUsuario,
      pode,
      abrirLogin,
      exigirLogin,
    }),
    [usuario, carregando, google, entrar, cadastrar, sair, trocarConta, pode, abrirLogin, exigirLogin],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
