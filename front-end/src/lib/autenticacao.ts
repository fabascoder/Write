import { API_URL, requisitar } from "./api";

// Conversa com as rotas /auth e /usuarios do back-end.
// A sessão fica num cookie httpOnly: este código nunca vê nem guarda o token.

export type Role = "leitor" | "funcionario" | "admin";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: Role;
  dataCriacao?: string;
  /** Vem do back-end. Usar para mostrar/esconder coisas, nunca como segurança */
  permissoes: string[];
  provedores: string[];
};

export type UsuarioResumo = Omit<Usuario, "permissoes" | "provedores">;

export type Cadastro = {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
};

export const NOME_ROLE: Record<Role, string> = {
  leitor: "Leitor",
  funcionario: "Funcionário",
  admin: "Administrador",
};

export const SENHA_MINIMA = 8;

export async function buscarSessao() {
  return requisitar<{ usuario: Usuario | null; google: boolean }>("/auth/eu");
}

export async function entrar(email: string, senha: string) {
  const data = await requisitar<{ usuario: Usuario }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
  return data.usuario;
}

export async function cadastrar(dados: Cadastro) {
  const data = await requisitar<{ usuario: Usuario }>("/auth/cadastro", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return data.usuario;
}

export async function sair() {
  await requisitar("/auth/logout", { method: "POST" });
}

export async function atualizarNome(nome: string) {
  const data = await requisitar<{ usuario: Usuario }>("/auth/eu", {
    method: "PATCH",
    body: JSON.stringify({ nome }),
  });
  return data.usuario;
}

// Página do Google. "voltar" é para onde a pessoa volta depois de entrar.
export function urlLoginGoogle(voltar?: string) {
  const query = voltar ? `?voltar=${encodeURIComponent(voltar)}` : "";
  return `${API_URL}/auth/google${query}`;
}

// ---------- Administração ----------

export async function listarUsuarios() {
  const data = await requisitar<{ usuarios: UsuarioResumo[] }>("/usuarios");
  return data.usuarios;
}

export async function mudarRole(id: number, role: Role) {
  const data = await requisitar<{ usuario: UsuarioResumo }>(`/usuarios/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return data.usuario;
}
