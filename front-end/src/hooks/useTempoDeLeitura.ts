import { useEffect } from "react";
import { enviarLeitura, vigiarInteracao } from "../lib/engajamento";

// Mede a leitura de um artigo: quanto tempo o texto ficou na tela (aba visível,
// sem ficar parado por mais de 2 minutos) e até onde a pessoa rolou.
// Manda uma vez, quando ela sai do artigo ou fecha a aba.
const PARADO_DEPOIS_DE = 2 * 60 * 1000;

export function useTempoDeLeitura(artigoId: string | number | undefined, ativo: boolean) {
  useEffect(() => {
    if (!ativo || !artigoId) return;

    let segundos = 0;
    let rolagem = 0;
    let ultimaInteracao = Date.now();
    let ultimoTique = Date.now();
    let enviado = false;

    // Até que ponto do texto a parte de baixo da tela já chegou (0 a 100%)
    const medirRolagem = () => {
      const texto = document.querySelector(".fc-prosa");
      if (!texto) return;
      const r = texto.getBoundingClientRect();
      const visto = r.height <= 0 ? 100 : ((window.innerHeight - r.top) / r.height) * 100;
      rolagem = Math.max(rolagem, Math.min(100, Math.max(0, visto)));
    };

    const parar = vigiarInteracao(() => {
      ultimaInteracao = Date.now();
      medirRolagem();
    });

    const tique = window.setInterval(() => {
      const agora = Date.now();
      const passou = (agora - ultimoTique) / 1000;
      ultimoTique = agora;
      if (document.visibilityState === "visible" && agora - ultimaInteracao < PARADO_DEPOIS_DE) {
        segundos += Math.min(passou, 5);
      }
    }, 1000);

    const enviar = () => {
      if (enviado || segundos < 1) return;
      enviado = true;
      enviarLeitura(artigoId, segundos, rolagem);
    };

    // O texto pode caber todo na tela sem rolar
    const primeira = window.setTimeout(medirRolagem, 500);
    window.addEventListener("pagehide", enviar);

    return () => {
      enviar();
      parar();
      window.clearInterval(tique);
      window.clearTimeout(primeira);
      window.removeEventListener("pagehide", enviar);
    };
  }, [artigoId, ativo]);
}
