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
  /** Caminho da foto na API (use urlDaFoto), ou null para a foto padrão */
  foto?: string | null;
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

// Endereço completo da foto de perfil, ou null
export function urlDaFoto(foto?: string | null) {
  return foto ? `${API_URL}${foto}` : null;
}

// PUT /auth/eu/foto — a imagem já vai pronta (ver lib/foto.ts)
export async function enviarFoto(imagem: string) {
  const data = await requisitar<{ usuario: Usuario }>("/auth/eu/foto", {
    method: "PUT",
    body: JSON.stringify({ imagem }),
  });
  return data.usuario;
}

export async function removerFoto() {
  const data = await requisitar<{ usuario: Usuario }>("/auth/eu/foto", { method: "DELETE" });
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

// ---------- Várias contas no mesmo navegador ----------

export type ContaConectada = UsuarioResumo & { ativa: boolean };

export async function listarContasConectadas() {
  const data = await requisitar<{ contas: ContaConectada[] }>("/auth/contas");
  return data.contas;
}

export async function trocarConta(id: number) {
  const data = await requisitar<{ usuario: Usuario }>("/auth/trocar", { method: "POST", body: JSON.stringify({ id }) });
  return data.usuario;
}

export async function desconectarConta(id: number) {
  await requisitar("/auth/contas/sair", { method: "POST", body: JSON.stringify({ id }) });
}

export async function sairDeTodas() {
  await requisitar("/auth/logout", { method: "POST", body: JSON.stringify({ todas: true }) });
}

// Contas que já entraram neste navegador. Fica no localStorage só o que aparece
// na tela (nome, e-mail, tipo) — nunca senha ou token. O login de verdade fica
// no cookie httpOnly do servidor.
export type ContaConhecida = { id: number; nome: string; email: string; role: Role; foto?: string | null; ultimaVez: string };

const CHAVE_CONTAS = "write-contas";

export function lerContasConhecidas(): ContaConhecida[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_CONTAS) ?? "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarContasConhecidas(lista: ContaConhecida[]) {
  try {
    localStorage.setItem(CHAVE_CONTAS, JSON.stringify(lista.slice(0, 8)));
  } catch {
    /* navegador sem localStorage: a lista só não aparece */
  }
}

export function lembrarConta(u: { id: number; nome: string; email: string; role: Role; foto?: string | null }) {
  const resto = lerContasConhecidas().filter((c) => c.id !== u.id);
  const conta = { id: u.id, nome: u.nome, email: u.email, role: u.role, foto: u.foto ?? null, ultimaVez: new Date().toISOString() };
  salvarContasConhecidas([conta, ...resto]);
}

export function esquecerConta(id: number) {
  salvarContasConhecidas(lerContasConhecidas().filter((c) => c.id !== id));
}
