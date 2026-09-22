import Brand from "./Brand";
import { ArrowRightIcon } from "../icons";

type Props = {
  logado: boolean;
  abrirLogin: () => void;
  sair: () => void;
};

export default function Footer({ logado, abrirLogin, sair }: Props) {
  return (
    <footer className="fc-footer">
      <div className="fc-footer-linha">
        <Brand />
        {logado ? (
          <button type="button" className="fc-access" onClick={sair}>
            Sair
            <ArrowRightIcon />
          </button>
        ) : (
          <button type="button" className="fc-access" onClick={abrirLogin}>
            Access
            <ArrowRightIcon />
          </button>
        )}
      </div>
      <p className="fc-copy">todos os direitos reservados</p>
    </footer>
  );
}
