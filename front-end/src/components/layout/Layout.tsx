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
        <Outlet />
        {!semRodape && <Footer />}
      </div>

      <SocialRail />
    </div>
  );
}
