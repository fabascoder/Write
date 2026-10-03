import { createContext } from "react";
import type { Cadastro, Usuario } from "../lib/autenticacao";

export type ModoLogin = "entrar" | "cadastro";

export type PedidoLogin = {
  modo: ModoLogin;
  /** Ex.: "Você precisa estar conectado para curtir este artigo." */
  motivo?: string;
  /** Página para onde voltar depois do login com Google */
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
  sair: () => Promise<void>;
  atualizarUsuario: (usuario: Usuario) => void;

  /** Só para mostrar/esconder na tela. Quem protege de verdade é o back-end */
  pode: (permissao: string) => boolean;

  /** Modal de login/cadastro */
  pedido: PedidoLogin | null;
  abrirLogin: (pedido?: Partial<PedidoLogin>) => void;
  fecharLogin: () => void;

  /**
   * Para ações que precisam de conta. Logado: executa. Visitante: abre o login
   * com o motivo. Ex.: exigirLogin("curtir este artigo", curtir)
   */
  exigirLogin: (acao: string, executar: () => void) => void;
};

export const AuthContext = createContext<ValorAuth | null>(null);
