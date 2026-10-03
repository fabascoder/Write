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

// ---------- Validação dos formulários ----------
// O back-end confere tudo de novo; aqui é só para avisar antes de enviar.

export type ErrosForm = Partial<Record<"nome" | "email" | "senha" | "confirmacao" | "geral", string>>;

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarLogin(email: string, senha: string): ErrosForm {
  const erros: ErrosForm = {};
  if (!email.trim()) erros.email = "Digite seu e-mail.";
  else if (!EMAIL_VALIDO.test(email.trim())) erros.email = "Digite um e-mail válido.";
  if (!senha) erros.senha = "Digite sua senha.";
  return erros;
}

export function validarCadastro(dados: Cadastro): ErrosForm {
  const erros: ErrosForm = {};
  const nome = dados.nome.trim();

  if (!nome) erros.nome = "Digite seu nome.";
  else if (nome.length < 2) erros.nome = "O nome precisa ter pelo menos 2 letras.";
  else if (nome.length > 80) erros.nome = "O nome pode ter no máximo 80 caracteres.";

  if (!dados.email.trim()) erros.email = "Digite seu e-mail.";
  else if (!EMAIL_VALIDO.test(dados.email.trim())) erros.email = "Digite um e-mail válido.";

  if (!dados.senha) erros.senha = "Crie uma senha.";
  else if (dados.senha.length < SENHA_MINIMA) erros.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;

  if (!dados.confirmacao) erros.confirmacao = "Confirme sua senha.";
  else if (dados.confirmacao !== dados.senha) erros.confirmacao = "As senhas não são iguais.";

  return erros;
}

export const temErros = (erros: ErrosForm) => Object.values(erros).some(Boolean);

// ---------- Endereços das telas de login ----------

// Só caminhos do próprio site ("/artigo/2"), nunca outro endereço
export function caminhoSeguro(caminho: string | null | undefined) {
  return caminho && /^\/(?!\/)/.test(caminho) ? caminho : "";
}

// Mantém o ?voltar= ao trocar entre entrar e cadastro
export function comVoltar(caminho: string, voltar?: string) {
  return voltar ? `${caminho}?voltar=${encodeURIComponent(voltar)}` : caminho;
}
