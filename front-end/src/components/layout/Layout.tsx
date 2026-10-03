import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import SocialRail from "./SocialRail";

export default function Layout() {
  const { pathname } = useLocation();

  // O artigo aberto e o editor não levam rodapé
  const semRodape = pathname.startsWith("/artigo/") || pathname.startsWith("/editor");
  const cabecalhoSimples = pathname.startsWith("/editor");

  return (
    <div className="fc-page">
      <div className="fc-container">
        <Header simples={cabecalhoSimples} />
        {/* Páginas baixadas sob demanda (ver App.tsx): o cabeçalho fica parado enquanto chegam */}
        <Suspense fallback={<main className="fc-main fc-main--simples"><p className="fc-estado">Carregando…</p></main>}>
          <Outlet />
        </Suspense>
        {!semRodape && <Footer />}
      </div>

      <SocialRail />
    </div>
  );
}
