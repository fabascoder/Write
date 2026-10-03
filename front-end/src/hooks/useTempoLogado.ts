import { useEffect } from "react";
import { enviarAtividade, vigiarInteracao } from "../lib/engajamento";

// Conta o tempo de uso de quem está logado e avisa o servidor a cada ~30 s.
// Só conta com a aba visível e alguma interação nos últimos 3 minutos:
// deixar o site aberto esquecido não vira "tempo logado".
const PARADO_DEPOIS_DE = 3 * 60 * 1000;

export function useTempoLogado(usuarioId: number | undefined) {
  useEffect(() => {
    if (!usuarioId) return;

    let ultimaInteracao = Date.now();
    let ultimoTique = Date.now();
    let acumulado = 0;

    const parar = vigiarInteracao(() => {
      ultimaInteracao = Date.now();
    });

    const enviarSeTiver = (minimo: number) => {
      if (acumulado >= minimo) {
        enviarAtividade(acumulado);
        acumulado = 0;
      }
    };

    const tique = window.setInterval(() => {
      const agora = Date.now();
      const passou = (agora - ultimoTique) / 1000;
      ultimoTique = agora;
      if (document.visibilityState === "visible" && agora - ultimaInteracao < PARADO_DEPOIS_DE) {
        acumulado += Math.min(passou, 10);
      }
      enviarSeTiver(30);
    }, 5000);

    // Saindo da aba ou fechando: manda o que juntou
    const aoEsconder = () => document.visibilityState === "hidden" && enviarSeTiver(3);
    document.addEventListener("visibilitychange", aoEsconder);

    return () => {
      enviarSeTiver(3);
      parar();
      window.clearInterval(tique);
      document.removeEventListener("visibilitychange", aoEsconder);
    };
  }, [usuarioId]);
}
