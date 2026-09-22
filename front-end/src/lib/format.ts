import type { Artigo } from "./api";

type DataEntrada = string | Date | null | undefined;

export function tempo(data: DataEntrada) {
  if (!data) return 0;
  const t = new Date(data).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// "22 de set. de 26"
export function formatarData(data: DataEntrada) {
  if (!tempo(data)) return "sem data";
  return new Date(data as string).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

// "há 2 horas", "há 3 dias"...
export function tempoRelativo(data: DataEntrada) {
  const t = tempo(data);
  if (!t) return "";

  const minutos = Math.floor((Date.now() - t) / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return minutos === 1 ? "há 1 minuto" : `há ${minutos} minutos`;
  if (horas < 24) return horas === 1 ? "há 1 hora" : `há ${horas} horas`;
  if (dias === 1) return "há 1 dia";
  if (dias < 30) return `há ${dias} dias`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? "há 1 mês" : `há ${meses} meses`;

  const anos = Math.floor(meses / 12);
  return anos === 1 ? "há 1 ano" : `há ${anos} anos`;
}

// Tira o HTML do Quill e devolve só o texto, cortado com reticências
export function resumo(html: string | undefined, limite = 170) {
  if (!html) return "";
  const div = document.createElement("div");
  // espaço entre parágrafos, senão "dizer.O silêncio" fica grudado
  div.innerHTML = html.replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " $&");
  const texto = (div.textContent ?? "").replace(/\s+/g, " ").trim();
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite).replace(/\s+\S*$/, "") + "…";
}

// Tempo de leitura aproximado (200 palavras por minuto)
export function tempoLeitura(html: string | undefined) {
  const palavras = resumo(html, Infinity).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

export type GrupoMes = {
  chave: string;
  rotulo: string;
  artigos: Artigo[];
};

// Agrupa pela data real de criação ("Setembro de 2026")
export function agruparPorMes(artigos: Artigo[]): GrupoMes[] {
  const grupos = new Map<string, GrupoMes>();

  for (const artigo of artigos) {
    const t = tempo(artigo.dataCriacao);
    const data = t ? new Date(t) : null;
    const chave = data
      ? `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`
      : "sem-data";

    if (!grupos.has(chave)) {
      const rotulo = data
        ? data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
        : "Sem data";
      grupos.set(chave, {
        chave,
        rotulo: rotulo.charAt(0).toUpperCase() + rotulo.slice(1),
        artigos: [],
      });
    }

    grupos.get(chave)!.artigos.push(artigo);
  }

  return [...grupos.values()].sort((a, b) => b.chave.localeCompare(a.chave));
}
