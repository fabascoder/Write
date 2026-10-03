import { lerJson, lerQuery, responder } from "../http.mjs";
import { ROLES } from "../auth/permissoes.mjs";
import * as usuarios from "../services/usuario.service.mjs";

// GET /usuarios (admin)
export async function listar(req, res) {
  try {
    const lista = await usuarios.listarUsuarios();
    responder(res, 200, { usuarios: lista.map(usuarios.usuarioPublico) });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    responder(res, 500, { mensagem: "Não foi possível listar os usuários." });
  }
}

// PATCH /usuarios/:id/role  { role }  (admin)
export async function mudarRole(req, res) {
  try {
    const id = Number(req.params.id);
    const role = String(lerJson(req).role ?? "");

    if (!ROLES.includes(role)) return responder(res, 400, { mensagem: "Tipo de conta inválido." });

    // Evita que você se tranque fora do painel sem querer
    if (id === req.usuario.id) {
      return responder(res, 400, { mensagem: "Você não pode mudar o tipo da sua própria conta." });
    }

    const alvo = await usuarios.buscarPorId(id);
    if (!alvo) return responder(res, 404, { mensagem: "Usuário não encontrado." });

    if (alvo.role === "admin" && role !== "admin" && (await usuarios.contarAdmins()) <= 1) {
      return responder(res, 400, { mensagem: "Precisa existir pelo menos um administrador." });
    }

    const usuario = await usuarios.mudarRole(id, role);
    responder(res, 200, { mensagem: "Tipo de conta atualizado.", usuario: usuarios.usuarioPublico(usuario) });
  } catch (error) {
    console.error("Erro ao mudar role:", error);
    responder(res, 500, { mensagem: "Não foi possível atualizar agora." });
  }
}

// GET /usuarios/:id/foto  (pública: a foto aparece para quem vê a conta)
export async function foto(req, res) {
  try {
    const id = Number(req.params.id);
    const salva = Number.isInteger(id) && id > 0 ? await usuarios.buscarFoto(id) : null;
    if (!salva) return responder(res, 404, { mensagem: "Foto não encontrada." });

    const bytes = Buffer.from(salva.dados, "base64");
    // Com "?v=" o endereço muda a cada foto nova, então dá para guardar por 1 ano
    const versionada = lerQuery(req).has("v");
    res.writeHead(200, {
      "Content-Type": salva.tipo,
      "Content-Length": bytes.length,
      "Cache-Control": versionada ? "public, max-age=31536000, immutable" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(bytes);
  } catch (error) {
    console.error("Erro ao buscar foto:", error);
    responder(res, 500, { mensagem: "Não foi possível carregar a foto." });
  }
}
