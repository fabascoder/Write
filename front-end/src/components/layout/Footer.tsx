import Brand from "./Brand";
import UserMenu from "./UserMenu";
import { ArrowRightIcon } from "../icons";
import { useAuth } from "../../hooks/useAuth";

export default function Footer() {
  const { usuario, carregando, abrirLogin } = useAuth();

  return (
    <footer className="fc-footer">
      <div className="fc-footer-linha">
        <Brand />
        {usuario ? (
          <UserMenu />
        ) : (
          // Enquanto a sessão carrega, o espaço fica reservado (sem piscar "Access")
          <button
            type="button"
            className="fc-access"
            onClick={() => abrirLogin()}
            style={carregando ? { visibility: "hidden" } : undefined}
          >
            Access
            <ArrowRightIcon />
          </button>
        )}
      </div>
      <p className="fc-copy">todos os direitos reservados</p>
    </footer>
  );
}
