import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Article from "./components/pages/Article";
import RotaProtegida from "./components/auth/RotaProtegida";

// Quem só lê baixa só a home e o artigo. O resto é baixado quando a página é aberta:
// o editor (Quill), os gráficos (Recharts), login, perfil e o painel do admin.
const Editor = lazy(() => import("./components/pages/Editor"));
const Rascunhos = lazy(() => import("./components/pages/Rascunhos"));
const Embed = lazy(() => import("./components/pages/Embed"));
const Entrar = lazy(() => import("./components/pages/Entrar"));
const Cadastro = lazy(() => import("./components/pages/Cadastro"));
const Contas = lazy(() => import("./components/pages/Contas"));
const Perfil = lazy(() => import("./components/pages/Perfil"));
const AdminPainel = lazy(() => import("./components/pages/AdminPainel"));
const AdminArtigos = lazy(() => import("./components/pages/AdminArtigos"));
const AdminUsuarios = lazy(() => import("./components/pages/AdminUsuarios"));
const AdminDesempenho = lazy(() => import("./components/pages/AdminDesempenho"));
const AdminLeitura = lazy(() => import("./components/pages/AdminLeitura"));

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
      <Suspense fallback={carregandoPagina}>
        <Routes>
          {/* Cartão personalizado do compartilhamento, fora do layout do site */}
          <Route path="/embed/artigo/:id" element={<Embed />} />
  
          <Route element={<ComSessao />}>
            {/* Entrar e cadastro: telas próprias, sem cabeçalho e rodapé */}
            <Route path="/entrar" element={<Entrar />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/contas" element={<Contas />} />
  
            <Route element={<Layout />}>
              {/* Públicas: ninguém precisa entrar para ler */}
              <Route path="/" element={<Home />} />
              <Route path="/artigo/:id" element={<Article />} />
  
              <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
  
              {/* Administração: o React esconde, a API bloqueia de verdade */}
              <Route path="/admin" element={<RotaProtegida permissao="admin:acessar"><AdminPainel /></RotaProtegida>} />
              <Route path="/admin/artigos" element={<RotaProtegida permissao="artigos:gerenciar"><AdminArtigos /></RotaProtegida>} />
              <Route path="/admin/usuarios" element={<RotaProtegida permissao="usuarios:gerenciar"><AdminUsuarios /></RotaProtegida>} />
              <Route path="/admin/leitura" element={<RotaProtegida permissao="artigos:gerenciar"><AdminLeitura /></RotaProtegida>} />
              <Route path="/admin/desempenho" element={<RotaProtegida permissao="desempenho:ver"><AdminDesempenho /></RotaProtegida>} />
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
      </Suspense>
    </BrowserRouter>
  );
}
