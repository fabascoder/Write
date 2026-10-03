// Cores e formatos dos gráficos do painel de desempenho.
// Paleta validada (scripts do guia de dataviz) contra o fundo branco do site:
// categóricas com o azul do site no 1º lugar; status só para bom/atenção/ruim.

export const COR = {
  // Séries: 1 = mediana (o principal), 2 = 95% das vezes
  serie1: "#0b6ee0",
  serie2: "#eb6834",
  // Uma cor fixa por área, sempre na mesma ordem (a cor segue a área, nunca a posição)
  categorias: ["#0b6ee0", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"],
  // Status: reservados para bom / atenção / ruim (sempre com texto ao lado)
  status: { bom: "#0ca30c", atencao: "#fab219", ruim: "#d03b3b" },
  // Tinta e moldura (tons do próprio site)
  texto: "#3d4753",
  textoFraco: "#77818e",
  grade: "#eaeff5",
  eixo: "#d7dee7",
  apagado: "#a9b3bf",
  superficie: "#ffffff",
} as const;

export function porcentagem(valor: number | null | undefined, casas = 0) {
  if (valor === null || valor === undefined) return "—";
  return `${(valor * 100).toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
}

export function numero(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR");
}

// Rótulo de cada ponto da linha do tempo, conforme o tamanho do intervalo
export function rotuloDoTempo(iso: string, balde: number) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = `${String(d.getHours()).padStart(2, "0")}h`;
  if (balde <= 60 * 60 * 1000) return hora;
  if (balde < 24 * 60 * 60 * 1000) return `${dia} ${hora}`;
  return dia;
}

// Texto completo do intervalo, para a dica ao passar o mouse
export function intervaloDoTempo(iso: string, balde: number) {
  const de = new Date(iso);
  const ate = new Date(de.getTime() + balde);
  const fmt = (d: Date) =>
    d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `${fmt(de)} a ${fmt(ate)}`;
}
