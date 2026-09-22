import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { useTema } from "../../hooks/useTema";
import Header from "./Header";
import Drawer from "./Drawer";
import Footer from "./Footer";

export default function Layout() {
  const { tema, alternar } = useTema();
  const [menuAberto, setMenuAberto] = useState(false);
  const fechar = useCallback(() => setMenuAberto(false), []);

  return (
    <div className="wr-page">
      <div className="wr-sheet">
        <Header tema={tema} alternarTema={alternar} abrirMenu={() => setMenuAberto(true)} />
        <Outlet />
        <Footer />
      </div>
      <Drawer aberto={menuAberto} fechar={fechar} tema={tema} alternarTema={alternar} />
    </div>
  );
}
