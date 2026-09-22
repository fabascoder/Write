/**
 * Acesso do administrador — SOMENTE no navegador.
 *
 * A API ainda não tem rota de login, então a verificação acontece aqui, no
 * front. Isso serve para esconder a área de escrita da visita comum, mas NÃO é
 * segurança de verdade: qualquer pessoa com o DevTools aberto consegue ver o
 * código. Quando existir um /login na API, é só trocar a função entrar() por
 * uma chamada de rede que devolva um token.
 */

export type Credenciais = { autor: string; email: string; senha: string };

const CHAVE_CRED = "fcb-admin";
const CHAVE_SESSAO = "fcb-sessao";

const PADRAO: Credenciais = {
  autor: "Fabas Coder",
  email: import.meta.env.VITE_ADMIN_EMAIL ?? "admin@fabascoder.dev",
  senha: import.meta.env.VITE_ADMIN_SENHA ?? "admin",
};

export function lerCredenciais(): Credenciais {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_CRED) ?? "null");
    if (salvo) return { ...PADRAO, ...salvo } as Credenciais;
  } catch {
    /* ignora */
  }
  return PADRAO;
}

export function salvarCredenciais(c: Credenciais) {
  localStorage.setItem(CHAVE_CRED, JSON.stringify(c));
}

export function entrar(email: string, senha: string) {
  const cred = lerCredenciais();
  const ok =
    email.trim().toLowerCase() === cred.email.trim().toLowerCase() &&
    senha === cred.senha;

  if (ok) sessionStorage.setItem(CHAVE_SESSAO, "1");
  return ok;
}

export function sair() {
  sessionStorage.removeItem(CHAVE_SESSAO);
}

export function estaLogado() {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) === "1";
  } catch {
    return false;
  }
}
