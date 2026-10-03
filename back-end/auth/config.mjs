import "dotenv/config";
import { randomBytes } from "node:crypto";

// Chave que assina os JWT. Precisa ser longa, aleatória e secreta.
// Sem JWT_SECRET, gera uma chave só para esta execução: funciona, mas todo
// mundo é deslogado quando o servidor reinicia. Em produção, defina a variável.
export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (() => {
    console.warn(
      "[auth] JWT_SECRET não definido: usando uma chave temporária. " +
        "Defina JWT_SECRET no .env (e no Render) para os logins sobreviverem a reinícios.",
    );
    return randomBytes(48).toString("base64url");
  })();

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
