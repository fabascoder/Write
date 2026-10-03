import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, CloseIcon } from "../icons";

type Props = {
  mensagem: string;
  /** Chamado quando a notificação some sozinha */
  fechar: () => void;
  erro?: boolean;
  duracao?: number;
};

// Notificação curta no rodapé da tela, no lugar de alert()
export default function Toast({ mensagem, fechar, erro = false, duracao = 2600 }: Props) {
  useEffect(() => {
    const t = window.setTimeout(fechar, duracao);
    return () => window.clearTimeout(t);
  }, [fechar, duracao]);

  return createPortal(
    <div className={"fc-toast" + (erro ? " fc-toast--erro" : "")} role="status" aria-live="polite">
      <span className="fc-toast-icone" aria-hidden="true">
        {erro ? <CloseIcon /> : <CheckIcon />}
      </span>
      {mensagem}
    </div>,
    document.body,
  );
}
