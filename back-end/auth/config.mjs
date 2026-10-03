import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

// Chave que assina os JWT. Precisa ser longa, aleatória e secreta.
// Sem JWT_SECRET, gera UMA chave e guarda no arquivo back-end/.jwt-secret
// (fora do Git). Assim os logins sobrevivem quando o servidor reinicia
// (o "npm run dev" reinicia a cada mudança no código). Em produção, defina a variável.
const ARQUIVO_CHAVE = new URL("../.jwt-secret", import.meta.url);

function chaveLocal() {
  try {
    const salva = readFileSync(ARQUIVO_CHAVE, "utf8").trim();
    if (salva.length >= 32) return salva;
  } catch {
    /* ainda não existe */
  }
  const nova = randomBytes(48).toString("base64url");
  try {
    writeFileSync(ARQUIVO_CHAVE, nova, { mode: 0o600 });
    console.warn("[auth] JWT_SECRET não definido: criei uma chave local em back-end/.jwt-secret.");
  } catch {
    console.warn("[auth] JWT_SECRET não definido e não deu para salvar a chave: os logins caem a cada reinício.");
  }
  return nova;
}

export const JWT_SECRET = process.env.JWT_SECRET || chaveLocal();

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn("[auth] JWT_SECRET curto demais: use pelo menos 32 caracteres aleatórios.");
}

// Endereço público do front. O login com Google volta para cá, e o cookie
// só é marcado como Secure quando o site está em https.
export const APP_URL = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

export const COOKIE_SEGURO = APP_URL.startsWith("https://");

export const GOOGLE = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  // O front chama a API por /api (proxy da Vercel e do Vite)
  redirectUri: `${APP_URL}/api/auth/google/callback`,
};

export const googleConfigurado = () => Boolean(GOOGLE.clientId && GOOGLE.clientSecret);
