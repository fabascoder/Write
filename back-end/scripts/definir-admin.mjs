// Cria ou promove um administrador. Roda no terminal, com acesso ao banco:
//
//   npm run admin -- voce@email.com
//
// - Se a conta já existe (criada pelo site ou pelo Google), vira admin.
// - Se não existe, o script pede nome e senha e cria a conta já como admin.
//   A senha é digitada sem aparecer na tela (ou vem de ADMIN_SENHA, para
//   rodar sem terminal interativo).
//
// Usa o mesmo banco do servidor: DATABASE_URL no .env aponta para o Postgres;
// sem ela, usa o banco.db local.

import readline from "node:readline";
import { inicializarBanco } from "../database/database.mjs";
import { gerarHashSenha } from "../auth/senha.mjs";
import * as usuarios from "../services/usuario.service.mjs";

function perguntar(pergunta, { oculto = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (oculto) {
    // Não ecoa o que é digitado
    rl._writeToOutput = (texto) => {
      if (texto.includes(pergunta)) process.stdout.write(texto);
    };
  }
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      rl.close();
      if (oculto) process.stdout.write("\n");
      resolve(resposta.trim());
    });
  });
}

async function principal() {
  const email = usuarios.normalizarEmail(process.argv[2]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Uso: npm run admin -- voce@email.com");
    process.exit(1);
  }

  await inicializarBanco();
  const existente = await usuarios.buscarPorEmailComSenha(email);

  if (existente) {
    if (existente.role === "admin") {
      console.log(`${email} já é administrador.`);
    } else {
      await usuarios.mudarRole(existente.id, "admin");
      console.log(`Pronto: ${email} agora é administrador (antes: ${existente.role}).`);
    }
    return;
  }

  console.log(`Ainda não existe conta com ${email}. Vamos criar uma conta de administrador.`);
  const nome = process.env.ADMIN_NOME || (await perguntar("Nome: "));
  const senha = process.env.ADMIN_SENHA || (await perguntar("Senha (mínimo 8 caracteres): ", { oculto: true }));

  if (nome.length < 2) throw new Error("Nome muito curto.");
  if (senha.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");

  if (!process.env.ADMIN_SENHA) {
    const confirmacao = await perguntar("Confirme a senha: ", { oculto: true });
    if (confirmacao !== senha) throw new Error("As senhas não são iguais.");
  }

  await usuarios.criarUsuario({ nome, email, senhaHash: await gerarHashSenha(senha), role: "admin" });
  console.log(`Pronto: conta de administrador criada para ${email}.`);
}

principal()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Não foi possível definir o administrador:", error.message);
    process.exit(1);
  });
