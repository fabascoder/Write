import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Article from "./components/pages/Article";
import Editor from "./components/pages/Editor";
import Rascunhos from "./components/pages/Rascunhos";
import Embed from "./components/pages/Embed";
import Entrar from "./components/pages/Entrar";
import Cadastro from "./components/pages/Cadastro";
import Perfil from "./components/pages/Perfil";
import AdminPainel from "./components/pages/AdminPainel";
import AdminArtigos from "./components/pages/AdminArtigos";
import AdminUsuarios from "./components/pages/AdminUsuarios";
import RotaProtegida from "./components/auth/RotaProtegida";

// O painel de desempenho (com a biblioteca de gráficos) só é baixado quando o admin abre a página
const AdminDesempenho = lazy(() => import("./components/pages/AdminDesempenho"));

const carregandoPagina = (
  <main className="fc-main fc-main--simples">
    <p className="fc-estado">Carregando…</p>
  </main>
);

// A sessão vale para o site todo (menos o /embed, que é só um cartão público)
function ComSessao() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cartão personalizado do compartilhamento, fora do layout do site */}
        <Route path="/embed/artigo/:id" element={<Embed />} />

        <Route element={<ComSessao />}>
          {/* Entrar e cadastro: telas próprias, sem cabeçalho e rodapé */}
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route element={<Layout />}>
            {/* Públicas: ninguém precisa entrar para ler */}
            <Route path="/" element={<Home />} />
            <Route path="/artigo/:id" element={<Article />} />

            <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />

            {/* Administração: o React esconde, a API bloqueia de verdade */}
            <Route path="/admin" element={<RotaProtegida permissao="admin:acessar"><AdminPainel /></RotaProtegida>} />
            <Route path="/admin/artigos" element={<RotaProtegida permissao="artigos:gerenciar"><AdminArtigos /></RotaProtegida>} />
            <Route path="/admin/usuarios" element={<RotaProtegida permissao="usuarios:gerenciar"><AdminUsuarios /></RotaProtegida>} />
            <Route path="/admin/desempenho" element={<RotaProtegida permissao="desempenho:ver"><Suspense fallback={carregandoPagina}><AdminDesempenho /></Suspense></RotaProtegida>} />
            <Route path="/editor" element={<RotaProtegida permissao="artigos:gerenciar"><Editor /></RotaProtegida>} />
            <Route path="/rascunhos" element={<RotaProtegida permissao="artigos:gerenciar"><Rascunhos /></RotaProtegida>} />

            {/* rotas antigas continuam funcionando */}
            <Route path="/article/:id" element={<Article />} />
            <Route path="/login" element={<Navigate to="/entrar" replace />} />
            <Route path="/meus-artigos" element={<Navigate to="/admin/artigos" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
