import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAdmin } from "../../hooks/useAdmin";
import Header from "./Header";
import Footer from "./Footer";
import LoginModal from "./LoginModal";
import SocialRail from "./SocialRail";

export default function Layout() {
  const { pathname } = useLocation();
  const { logado, logar, deslogar } = useAdmin();
  const [login, setLogin] = useState(false);

  // O artigo aberto e o editor não levam rodapé
  const semRodape = pathname.startsWith("/artigo/") || pathname.startsWith("/editor");
  const cabecalhoSimples = pathname.startsWith("/editor");

  return (
    <div className="fc-page">
      <div className="fc-container">
        <Header simples={cabecalhoSimples} />
        <Outlet />
        {!semRodape && <Footer logado={logado} abrirLogin={() => setLogin(true)} sair={deslogar} />}
      </div>

      <SocialRail />
      <LoginModal aberto={login} fechar={() => setLogin(false)} entrar={logar} />
    </div>
  );
}
