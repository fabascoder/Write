import { Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "../../context/AuthProvider";
import Header from "./Header";
import Footer from "./Footer";
import LoginModal from "./LoginModal";
import SocialRail from "./SocialRail";

export default function Layout() {
  const { pathname } = useLocation();

  // O artigo aberto e o editor não levam rodapé
  const semRodape = pathname.startsWith("/artigo/") || pathname.startsWith("/editor");
  const cabecalhoSimples = pathname.startsWith("/editor");

  return (
    <AuthProvider>
      <div className="fc-page">
        <div className="fc-container">
          <Header simples={cabecalhoSimples} />
          <Outlet />
          {!semRodape && <Footer />}
        </div>

        <SocialRail />
        <LoginModal />
      </div>
    </AuthProvider>
  );
}
