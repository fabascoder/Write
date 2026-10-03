import "dotenv/config";

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
