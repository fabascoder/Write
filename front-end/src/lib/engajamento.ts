import { API_URL, requisitar } from "./api";

// Tempo logado de cada usuário e tempo de leitura de cada artigo

export type TempoUsuario = {
  id: number;
  nome: string;
  email: string;
  role: string;
  segundos: number;
  sessoes: number;
  mediaSessao: number;
  ultimaVez: string | null;
};

export type LeituraArtigo = {
  id: number;
  titulo: string;
  dataCriacao: string;
  palavras: number;
  estimadoSegundos: number;
  visitas: number;
  leituras: number;
  saidasRapidas: number;
  mediaSegundos: number | null;
  medianaSegundos: number | null;
  chegaramAoFim: number | null;
  rolagemMedia: number | null;
};

export function buscarTempoUsuarios(dias = 30) {
  return requisitar<{ dias: number; usuarios: TempoUsuario[] }>(`/engajamento/usuarios?dias=${dias}`);
}

export function buscarLeitura(dias = 30) {
  return requisitar<{ dias: number; artigos: LeituraArtigo[] }>(`/engajamento/leitura?dias=${dias}`);
}

// "45 s", "3 min 20 s", "2 h 15 min"
export function duracao(segundos: number | null | undefined) {
  if (segundos === null || segundos === undefined) return "—";
  const s = Math.round(segundos);
  if (s < 60) return `${s} s`;
  if (s < 3600) {
    const min = Math.floor(s / 60);
    const resto = s % 60;
    return resto ? `${min} min ${resto} s` : `${min} min`;
  }
  const h = Math.floor(s / 3600);
  const min = Math.round((s % 3600) / 60);
  return min ? `${h} h ${min} min` : `${h} h`;
}

// ---------- Envio pelo site ----------

export function enviarAtividade(segundos: number) {
  fetch(`${API_URL}/atividade`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segundos: Math.min(90, Math.max(1, Math.round(segundos))) }),
  }).catch(() => {});
}

export function enviarLeitura(artigoId: string | number, segundos: number, rolagem: number) {
  const corpo = JSON.stringify({
    artigoId: Number(artigoId),
    segundos: Math.min(4 * 60 * 60, Math.round(segundos)),
    rolagem: Math.min(100, Math.max(0, Math.round(rolagem))),
  });
  const url = `${API_URL}/leituras`;
  try {
    // sendBeacon chega mesmo se a pessoa estiver fechando a aba
    if (navigator.sendBeacon?.(url, new Blob([corpo], { type: "application/json" }))) return;
  } catch {
    /* cai no fetch */
  }
  fetch(url, { method: "POST", body: corpo, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
}

// A pessoa mexeu na página há pouco? (mouse, teclado, rolagem, toque)
export function vigiarInteracao(aoInteragir: () => void) {
  const eventos = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;
  eventos.forEach((e) => window.addEventListener(e, aoInteragir, { passive: true }));
  return () => eventos.forEach((e) => window.removeEventListener(e, aoInteragir));
}
