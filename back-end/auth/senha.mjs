import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Hash de senha com scrypt (nativo do Node, sem dependência nativa para compilar).
// É um algoritmo próprio para senhas, como bcrypt e Argon2: lento de propósito
// e com custo de memória, o que dificulta ataques de força bruta.
// Formato salvo: scrypt$N$r$p$sal$hash

const scryptAsync = promisify(scrypt);
const N = 2 ** 15;
const R = 8;
const P = 1;
const TAMANHO = 64;
const MEMORIA = 128 * N * R * 2;

export async function gerarHashSenha(senha) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(senha.normalize("NFKC"), sal, TAMANHO, { N, r: R, p: P, maxmem: MEMORIA });
  return ["scrypt", N, R, P, sal.toString("base64"), hash.toString("base64")].join("$");
}

export async function conferirSenha(senha, salvo) {
  if (!salvo) return false;

  const [algoritmo, n, r, p, salB64, hashB64] = salvo.split("$");
  if (algoritmo !== "scrypt") return false;

  const esperado = Buffer.from(hashB64, "base64");
  const calculado = await scryptAsync(senha.normalize("NFKC"), Buffer.from(salB64, "base64"), esperado.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  });

  // Comparação em tempo constante: não dá pistas pelo tempo de resposta
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

// Para comparar contra "nada" quando o e-mail não existe, gastando o mesmo tempo
let hashFalso;
export async function conferirSenhaFalsa(senha) {
  hashFalso ??= await gerarHashSenha("senha-que-nunca-confere");
  await conferirSenha(senha, hashFalso);
  return false;
}
