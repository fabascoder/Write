import { LayoutIcon, TimelineIcon } from "../icons";

export type Visao = "destaques" | "linha-do-tempo";

type Props = { visao: Visao; mudar: (v: Visao) => void };

export default function ViewToggle({ visao, mudar }: Props) {
  return (
    <div className="wr-toggle" role="group" aria-label="Forma de exibir os artigos">
      <button
        type="button"
        aria-pressed={visao === "destaques"}
        onClick={() => mudar("destaques")}
      >
        <LayoutIcon />
        <span>Destaques</span>
      </button>
      <button
        type="button"
        aria-pressed={visao === "linha-do-tempo"}
        onClick={() => mudar("linha-do-tempo")}
      >
        <TimelineIcon />
        <span>Linha do tempo</span>
      </button>
    </div>
  );
}
