import { randomBytes } from "node:crypto";
import { ehErroDeDuplicado } from "../database/database.mjs";
import { ipDe, lerCookies, lerJson, lerQuery, redirecionar, responder } from "../http.mjs";
import { APP_URL, googleConfigurado } from "../auth/config.mjs";
import { contaGoogle, urlDeAutorizacao } from "../auth/google.mjs";
import { permissoesDe, pode } from "../auth/permissoes.mjs";
import { conferirSenha, conferirSenhaFalsa, gerarHashSenha } from "../auth/senha.mjs";
import {
  contasConectadas,
  cookieApagado,
  criarSessao,
  idDaContaAtiva,
  montarCookie,
  sairDaConta,
  sairDeTodas,
  trocarDeConta,
  usuarioDaSessao,
} from "../auth/sessao.mjs";

// Resposta de login/cadastro: o JWT vai no cookie httpOnly (o que o site usa) e
// também no corpo, para quem testar a API direto (Authorization: Bearer).
async function responderComSessao(req, res, status, usuario, extra = {}) {
  const sessao = criarSessao(usuario, req);
  responder(
    res,
    status,
    { ...extra, usuario: await resumoDoUsuario(usuario), token: sessao.token, expiraEm: sessao.expiraEm },
    sessao.cookies,
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

    await responderComSessao(req, res, 201, usuario, { mensagem: "Conta criada." });
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
    await responderComSessao(req, res, 200, usuario);
  } catch (error) {
    console.error("Erro no login:", error);
    responder(res, 500, { mensagem: "Não foi possível entrar agora." });
  }
}

// POST /auth/logout
export async function sair(req, res) {
  try {
    // { todas: true } desconecta todas as contas deste navegador
    const todas = lerJson(req).todas === true;
    const id = idDaContaAtiva(req);
    const cookies = todas || id === null ? sairDeTodas() : sairDaConta(req, id);
    responder(res, 200, { mensagem: "Até logo." }, cookies);
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

// ---------- Foto de perfil ----------
// O navegador já manda a foto recortada (quadrada) e reduzida, em data URL.
// Aqui só confere: tipo permitido, tamanho e se os bytes são mesmo daquele tipo.

const FOTO_MAX_BYTES = 300 * 1024;
const FOTO_DATA_URL = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/;
const ASSINATURAS = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
};

// PUT /auth/eu/foto  { imagem: "data:image/webp;base64,..." }  (exige login)
export async function enviarFoto(req, res) {
  try {
    // Base64 ocupa ~4/3 do arquivo: corta antes de decodificar algo enorme
    if (String(req.body ?? "").length > FOTO_MAX_BYTES * 1.5) {
      return responder(res, 413, { mensagem: "A foto ficou grande demais. Tente outra imagem." });
    }

    const partes = FOTO_DATA_URL.exec(String(lerJson(req).imagem ?? ""));
    if (!partes) return responder(res, 400, { mensagem: "Envie uma imagem JPG, PNG ou WebP." });

    const [, tipo, base64] = partes;
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length === 0 || bytes.length > FOTO_MAX_BYTES) {
      return responder(res, 413, { mensagem: "A foto ficou grande demais. Tente outra imagem." });
    }
    if (!ASSINATURAS[tipo](bytes)) {
      return responder(res, 400, { mensagem: "Esse arquivo não parece ser uma imagem válida." });
    }

    const usuario = await usuarios.salvarFoto(req.usuario.id, tipo, bytes.toString("base64"));
    responder(res, 200, { mensagem: "Foto atualizada.", usuario: await resumoDoUsuario(usuario) });
  } catch (error) {
    console.error("Erro ao salvar foto:", error);
    responder(res, 500, { mensagem: "Não foi possível salvar a foto agora." });
  }
}

// DELETE /auth/eu/foto  (exige login)
export async function removerFoto(req, res) {
  try {
    const usuario = await usuarios.apagarFoto(req.usuario.id);
    responder(res, 200, { mensagem: "Foto removida.", usuario: await resumoDoUsuario(usuario) });
  } catch (error) {
    console.error("Erro ao remover foto:", error);
    responder(res, 500, { mensagem: "Não foi possível remover a foto agora." });
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
    const { cookies } = criarSessao(usuario, req);
    const destino = caminhoSeguro(salvo.voltar) || (pode(usuario, "admin:acessar") ? "/admin" : "/");
    redirecionar(res, `${APP_URL}${destino}`, [...cookies, limpar]);
  } catch (error) {
    console.error("Erro no login com Google:", error);
    falhou();
  }
}

// ---------- Várias contas no mesmo navegador ----------

// GET /auth/contas → contas conectadas neste navegador (a ativa vem marcada)
export async function contas(req, res) {
  try {
    const ativa = idDaContaAtiva(req);
    const lista = [];
    for (const { usuarioId } of contasConectadas(req)) {
      const u = await usuarios.buscarPorId(usuarioId);
      if (u) lista.push({ ...usuarios.usuarioPublico(u), ativa: u.id === ativa });
    }
    responder(res, 200, { contas: lista });
  } catch (error) {
    console.error("Erro ao listar contas:", error);
    responder(res, 500, { mensagem: "Não foi possível listar as contas." });
  }
}

// POST /auth/trocar  { id } → passa a usar outra conta já conectada (sem senha)
export async function trocar(req, res) {
  try {
    const id = Number(lerJson(req).id);
    const cookies = trocarDeConta(req, id);
    const usuario = cookies ? await usuarios.buscarPorId(id) : null;
    if (!cookies || !usuario) {
      return responder(res, 401, { mensagem: "Essa conta não está mais conectada. Entre de novo com a senha." });
    }
    responder(res, 200, { usuario: await resumoDoUsuario(usuario) }, cookies);
  } catch (error) {
    console.error("Erro ao trocar de conta:", error);
    responder(res, 500, { mensagem: "Não foi possível trocar de conta." });
  }
}

// POST /auth/contas/sair  { id } → desconecta uma conta específica
export function sairDeUmaConta(req, res) {
  const id = Number(lerJson(req).id);
  if (!Number.isInteger(id)) return responder(res, 400, { mensagem: "Conta inválida." });
  responder(res, 200, { mensagem: "Conta desconectada." }, sairDaConta(req, id));
}
