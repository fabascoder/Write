import { useEffect, useRef, useState } from "react";
import { iniciarMedicao, inicioDaTela, type AcaoMedida, type FimMedicao } from "../lib/medicao";

// Mede o tempo até uma tela ficar pronta (ex.: artigo com texto e fotos na tela).
// "coletar" roda quando "pronto" vira true e devolve os detalhes da medição.
export function useMedirCarregamento(acao: AcaoMedida, pronto: boolean, coletar: () => Promise<FimMedicao>) {
  const [inicio] = useState(inicioDaTela);
  const enviado = useRef(false);
  const coletarRef = useRef(coletar);

  useEffect(() => {
    coletarRef.current = coletar;
  });

  useEffect(() => {
    if (!pronto || enviado.current) return;
    enviado.current = true;

    const fim = iniciarMedicao(acao, inicio.momento);
    coletarRef
      .current()
      .then((dados) => fim({ ...dados, detalhes: { ...dados.detalhes, frio: inicio.frio } }))
      .catch(() => {});
  }, [acao, pronto, inicio]);
}
