import { randomBytes } from "node:crypto";
import { ehErroDeDuplicado } from "../database/database.mjs";
import { ipDe, lerCookies, lerJson, lerQuery, redirecionar, responder } from "../http.mjs";
import { APP_URL, googleConfigurado } from "../auth/config.mjs";
import { contaGoogle, urlDeAutorizacao } from "../auth/google.mjs";
import { permissoesDe } from "../auth/permissoes.mjs";
import { conferirSenha, conferirSenhaFalsa, gerarHashSenha } from "../auth/senha.mjs";
import { cookieApagado, criarSessao, encerrarSessao, montarCookie, usuarioDaSessao } from "../auth/sessao.mjs";

// Resposta de login/cadastro: o JWT vai no cookie httpOnly (o que o site usa) e
// também no corpo, para quem testar a API direto (Authorization: Bearer).
async function responderComSessao(res, status, usuario, extra = {}) {
  const sessao = criarSessao(usuario);
  responder(
    res,
    status,
    { ...extra, usuario: await resumoDoUsuario(usuario), token: sessao.token, expiraEm: sessao.expiraEm },
    [sessao.cookie],
  );
}
import * as usuarios from "../services/usuario.service.mjs";

// ---------- Validação ----------

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN = 8;
const SENHA_MAX = 200;

function validarCadastro({ nome, email, senha, confirmacao }) {
  if (!nome || !email || !senha || !confirmacao) return "Preencha todos os campos.";
  if (nome.length < 2 || nome.length > 80) return "O nome precisa ter entre 2 e 80 caracteres.";
  if (!EMAIL_VALIDO.test(email) || email.length > 254) return "Digite um e-mail válido.";
  if (senha.length < SENHA_MIN) return `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
  if (senha.length > SENHA_MAX) return "A senha é longa demais.";
  if (senha !== confirmacao) return "As senhas não são iguais.";
  return null;
}

// O que o front recebe sobre quem está logado
async function resumoDoUsuario(usuario) {
  return {
    ...usuarios.usuarioPublico(usuario),
    permissoes: permissoesDe(usuario.role),
    provedores: await usuarios.listarProvedores(usuario.id),
  };
}

// ---------- Limite de tentativas de login ----------
// 10 senhas erradas em 15 minutos pelo mesmo IP bloqueiam por um tempo.

const JANELA = 15 * 60 * 1000;
const MAX_FALHAS = 10;
const falhas = new Map();

function bloqueado(ip) {
  const registro = falhas.get(ip);
  if (!registro) return false;
  if (Date.now() - registro.inicio > JANELA) {
    falhas.delete(ip);
    return false;
  }
  return registro.total >= MAX_FALHAS;
}

function registrarFalha(ip) {
  const registro = falhas.get(ip);
  if (!registro || Date.now() - registro.inicio > JANELA) {
    falhas.set(ip, { inicio: Date.now(), total: 1 });
  } else {
    registro.total += 1;
  }
}

// ---------- Rotas ----------

// POST /auth/cadastro  { nome, email, senha, confirmacao }
// A role é SEMPRE "leitor". Qualquer "role" que venha no corpo é ignorada.
export async function cadastrar(req, res) {
  try {
    const corpo = lerJson(req);
    const dados = {
      nome: String(corpo.nome ?? "").trim(),
      email: usuarios.normalizarEmail(corpo.email),
      senha: String(corpo.senha ?? ""),
      confirmacao: String(corpo.confirmacao ?? ""),
    };

    const erro = validarCadastro(dados);
    if (erro) return responder(res, 400, { mensagem: erro });

    const senhaHash = await gerarHashSenha(dados.senha);

    let usuario;
    try {
      usuario = await usuarios.criarUsuario({ nome: dados.nome, email: dados.email, senhaHash, role: "leitor" });
    } catch (error) {
      if (ehErroDeDuplicado(error)) {
        return responder(res, 409, { mensagem: "Já existe uma conta com esse e-mail. Tente entrar." });
      }
      throw error;
    }

    await responderComSessao(res, 201, usuario, { mensagem: "Conta criada." });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    responder(res, 500, { mensagem: "Não foi possível criar a conta agora." });
  }
}

// POST /auth/login  { email, senha }
export async function entrar(req, res) {
  try {
    const ip = ipDe(req);
    if (bloqueado(ip)) {
      return responder(res, 429, { mensagem: "Muitas tentativas. Espere alguns minutos e tente de novo." });
    }

    const corpo = lerJson(req);
    const email = usuarios.normalizarEmail(corpo.email);
    const senha = String(corpo.senha ?? "");

    if (!email || !senha) return responder(res, 400, { mensagem: "Preencha e-mail e senha." });

    const usuario = await usuarios.buscarPorEmailComSenha(email);

    if (usuario && !usuario.senhaHash) {
      return responder(res, 400, { mensagem: "Essa conta entra com o Google. Use \"Continuar com Google\"." });
    }

    // Mesmo sem usuário, gasta o tempo de conferir uma senha (não revela quem existe)
    const ok = usuario ? await conferirSenha(senha, usuario.senhaHash) : await conferirSenhaFalsa(senha);

    if (!ok) {
      registrarFalha(ip);
      return responder(res, 401, { mensagem: "E-mail ou senha incorretos." });
    }

    falhas.delete(ip);
    await responderComSessao(res, 200, usuario);
  } catch (error) {
    console.error("Erro no login:", error);
    responder(res, 500, { mensagem: "Não foi possível entrar agora." });
  }
}

// POST /auth/logout
export async function sair(req, res) {
  try {
    responder(res, 200, { mensagem: "Até logo." }, [encerrarSessao()]);
  } catch (error) {
    console.error("Erro ao sair:", error);
    responder(res, 500, { mensagem: "Não foi possível sair agora." });
  }
}

// GET /auth/eu → quem está logado (ou null) e se o Google está disponível
export async function eu(req, res) {
  try {
    const usuario = await usuarioDaSessao(req);
    responder(res, 200, {
      usuario: usuario ? await resumoDoUsuario(usuario) : null,
      google: googleConfigurado(),
    });
  } catch (error) {
    console.error("Erro ao consultar sessão:", error);
    responder(res, 500, { mensagem: "Não foi possível consultar a sessão." });
  }
}

// PATCH /auth/eu  { nome }  (exige login)
export async function atualizarPerfil(req, res) {
  try {
    const nome = String(lerJson(req).nome ?? "").trim();
    if (nome.length < 2 || nome.length > 80) {
      return responder(res, 400, { mensagem: "O nome precisa ter entre 2 e 80 caracteres." });
    }
    const usuario = await usuarios.atualizarNome(req.usuario.id, nome);
    responder(res, 200, { mensagem: "Perfil atualizado.", usuario: await resumoDoUsuario(usuario) });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    responder(res, 500, { mensagem: "Não foi possível salvar agora." });
  }
}

// ---------- Google ----------

const COOKIE_OAUTH = "write_oauth";

// Só caminhos internos ("/artigo/2"), nunca outro site ("//site.com", "https://...")
function caminhoSeguro(caminho) {
  return typeof caminho === "string" && /^\/(?!\/)[^\s\\]*$/.test(caminho) ? caminho : "";
}

// GET /auth/google?voltar=/artigo/2
export function googleInicio(req, res) {
  if (!googleConfigurado()) {
    return redirecionar(res, `${APP_URL}/entrar?erro=google-indisponivel`);
  }

  const state = randomBytes(24).toString("base64url");
  const voltar = caminhoSeguro(lerQuery(req).get("voltar"));
  const valor = Buffer.from(JSON.stringify({ state, voltar })).toString("base64url");

  // O state volta junto com o Google e precisa bater com este cookie (protege contra CSRF)
  redirecionar(res, urlDeAutorizacao(state), [montarCookie(COOKIE_OAUTH, valor, { maxAge: 600 })]);
}

// GET /auth/google/callback?code=...&state=...
export async function googleCallback(req, res) {
  const limpar = cookieApagado(COOKIE_OAUTH);
  const falhou = () => redirecionar(res, `${APP_URL}/entrar?erro=google`, [limpar]);

  try {
    const query = lerQuery(req);
    let salvo = {};
    try {
      salvo = JSON.parse(Buffer.from(lerCookies(req)[COOKIE_OAUTH] ?? "", "base64url").toString("utf8"));
    } catch {
      /* cookie ausente ou adulterado */
    }

    if (query.get("error") || !query.get("code") || !salvo.state || salvo.state !== query.get("state")) {
      return falhou();
    }

    const google = await contaGoogle(query.get("code"));

    // 1. Já entrou com esse Google antes?
    let usuario = await usuarios.buscarPorProvedor("google", google.id);

    // 2. Já existe conta com esse e-mail? Liga o Google a ela (sem criar outra)
    if (!usuario) {
      usuario = await usuarios.buscarPorEmailComSenha(google.email);
      if (usuario) await usuarios.vincularProvedor(usuario.id, "google", google.id);
    }

    // 3. Ninguém ainda: cria uma conta de leitor, sem senha
    if (!usuario) {
      usuario = await usuarios.criarUsuario({ nome: google.nome, email: google.email, role: "leitor" });
      await usuarios.vincularProvedor(usuario.id, "google", google.id);
    }

    // Deu tudo certo: volta para onde estava, ou para a página principal
    const { cookie } = criarSessao(usuario);
    const destino = caminhoSeguro(salvo.voltar) || "/";
    redirecionar(res, `${APP_URL}${destino}`, [cookie, limpar]);
  } catch (error) {
    console.error("Erro no login com Google:", error);
    falhou();
  }
}
