import { useEffect } from "react";
import { CloseIcon, TrashIcon } from "../icons";

type Props = {
  aberto: boolean;
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  carregando?: boolean;
  erro?: string;
  confirmar: () => void;
  cancelar: () => void;
};

export default function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar = "Excluir",
  carregando = false,
  erro = "",
  confirmar,
  cancelar,
}: Props) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cancelar();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, cancelar]);

  if (!aberto) return null;

  return (
    <div className="fc-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmar">
      <div className="fc-modal-fundo" onClick={cancelar} />
      <div className="fc-modal-caixa">
        <button type="button" className="fc-icon-btn fc-modal-fechar" onClick={cancelar} aria-label="Fechar">
          <CloseIcon />
        </button>

        <span className="fc-modal-icone fc-modal-icone--alerta">
          <TrashIcon />
        </span>
        <h2 id="titulo-confirmar">{titulo}</h2>
        <p className="fc-modal-sub">{descricao}</p>

        {erro && <p className="fc-erro" role="alert">{erro}</p>}

        <div className="fc-modal-acoes">
          <button type="button" className="fc-btn fc-btn--contorno" onClick={cancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="fc-btn fc-btn--perigo"
            onClick={confirmar}
            disabled={carregando}
          >
            {carregando ? "Excluindo…" : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
