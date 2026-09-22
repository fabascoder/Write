import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Article from "./components/pages/Article";
import Editor from "./components/pages/Editor";
import Rascunhos from "./components/pages/Rascunhos";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/artigo/:id" element={<Article />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/rascunhos" element={<Rascunhos />} />

          {/* rotas antigas continuam funcionando */}
          <Route path="/article/:id" element={<Article />} />
          <Route path="/meus-artigos" element={<Navigate to="/" replace />} />
          <Route path="/perfil" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
