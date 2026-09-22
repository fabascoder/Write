import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Article from "./components/pages/Article";
import Editor from "./components/pages/Editor";
import MeusArtigos from "./components/pages/MeusArtigos";
import Perfil from "./components/pages/Perfil";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/artigo/:id" element={<Article />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/meus-artigos" element={<MeusArtigos />} />
          <Route path="/perfil" element={<Perfil />} />

          {/* Rotas antigas continuam funcionando */}
          <Route path="/article/:id" element={<Article />} />
          <Route path="/calendarPage" element={<Navigate to="/?visao=linha-do-tempo" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
