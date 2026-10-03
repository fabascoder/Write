import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O front sempre chama a API por /api. Assim o cookie de login fica no mesmo
// domínio do site (mais seguro, e funciona mesmo com cookies de terceiros bloqueados).
//   npm run dev       → /api vai para a API local (localhost:3000)
//   npm run dev:prod  → /api vai para a API de produção
//   Vercel            → /api é repassado pelo vercel.json
// API_LOCAL=http://localhost:3001 npm run dev  → se o back-end rodar em outra porta
const API_LOCAL = process.env.API_LOCAL || 'http://localhost:3000'
const API_PRODUCAO = 'https://writeapi.onrender.com'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const proxy = {
    '/api': {
      target: mode === 'producao' ? API_PRODUCAO : API_LOCAL,
      changeOrigin: true,
      rewrite: (caminho: string) => caminho.replace(/^\/api/, ''),
    },
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
