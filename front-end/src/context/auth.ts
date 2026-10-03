import { createContext } from "react";
import type { Cadastro, Usuario } from "../lib/autenticacao";

export type PedidoLogin = {
  modo?: "entrar" | "cadastro";
  /** Ex.: "Você precisa estar conectado para curtir este artigo." */
  motivo?: string;
  /** Página para onde voltar depois de entrar. Sem ela, vai para a página principal */
  voltar?: string;
};

export type ValorAuth = {
  usuario: Usuario | null;
  /** true enquanto a sessão ainda está sendo consultada */
  carregando: boolean;
  /** Login com Google configurado no back-end */
  google: boolean;

  entrar: (email: string, senha: string) => Promise<Usuario>;
  cadastrar: (dados: Cadastro) => Promise<Usuario>;
  /** Sai só da conta ativa; as outras contas conectadas continuam no navegador */
  sair: () => Promise<void>;
  /** Passa a usar outra conta já conectada neste navegador (sem senha) */
  trocarConta: (id: number) => Promise<Usuario>;
  atualizarUsuario: (usuario: Usuario) => void;

  /** Só para mostrar/esconder na tela. Quem protege de verdade é o back-end */
  pode: (permissao: string) => boolean;

  /** Leva para /entrar (ou /cadastro) */
  abrirLogin: (pedido?: PedidoLogin) => void;

  /**
   * Para ações que precisam de conta. Logado: executa. Visitante: vai para o
   * login com o motivo e volta para a mesma página depois.
   * Ex.: exigirLogin("curtir este artigo", curtir)
   */
  exigirLogin: (acao: string, executar: () => void) => void;
};

export const AuthContext = createContext<ValorAuth | null>(null);
