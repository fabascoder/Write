export type Visao = "destaques" | "linha-do-tempo";

type Props = { visao: Visao; mudar: (v: Visao) => void };

export default function ViewToggle({ visao, mudar }: Props) {
  return (
    <div className="fc-toggle" role="group" aria-label="Forma de exibir os artigos">
      <span className={"fc-toggle-pilula" + (visao === "linha-do-tempo" ? " direita" : "")} aria-hidden="true" />
      <button type="button" aria-pressed={visao === "destaques"} onClick={() => mudar("destaques")}>
        Destaques
      </button>
      <button
        type="button"
        aria-pressed={visao === "linha-do-tempo"}
        onClick={() => mudar("linha-do-tempo")}
      >
        Linha do Tempo
      </button>
    </div>
  );
}
