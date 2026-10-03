// Funcionalidades novas e por quanto tempo elas mostram o selo "Novo".
// Para lançar outra novidade, é só adicionar um item aqui e usar
// <NovoSelo id="..." /> onde ela aparece.

export type Novidade = {
  id: string;
  nome: string;
  descricao: string;
  /** Dia em que entrou no ar (AAAA-MM-DD) */
  lancadoEm: string;
  /** Quantos meses o selo fica visível */
  meses: number;
};

export const NOVIDADES: Novidade[] = [
  {
    id: "compartilhar",
    nome: "Compartilhamento",
    descricao: "Copiar link e cartão personalizado nos artigos",
    lancadoEm: "2026-10-03",
    meses: 1,
  },
];

function inicio(n: Novidade) {
  return new Date(`${n.lancadoEm}T00:00:00`);
}

export function expiraEm(n: Novidade) {
  const fim = inicio(n);
  fim.setMonth(fim.getMonth() + n.meses);
  return fim;
}

export function ehNovo(id: string, agora = new Date()) {
  const n = NOVIDADES.find((x) => x.id === id);
  return !!n && agora >= inicio(n) && agora < expiraEm(n);
}

// "Faltam 12 dias e 5 horas", "Falta 1 hora", "Expirou"...
export function tempoRestante(n: Novidade, agora = new Date()) {
  const total = expiraEm(n).getTime() - inicio(n).getTime();
  const resta = expiraEm(n).getTime() - agora.getTime();

  if (resta <= 0) return { texto: "Expirou", progresso: 1, expirado: true };
  if (resta < 3_600_000) return { texto: "Falta menos de 1 hora", progresso: 1, expirado: false };

  const horasTotais = Math.floor(resta / 3_600_000);
  const dias = Math.floor(horasTotais / 24);
  const horas = horasTotais % 24;

  const partes: string[] = [];
  if (dias) partes.push(dias === 1 ? "1 dia" : `${dias} dias`);
  if (horas || !dias) partes.push(horas === 1 ? "1 hora" : `${horas} horas`);

  const um = dias === 0 ? horas <= 1 : dias === 1 && horas === 0;
  return {
    texto: `${um ? "Falta" : "Faltam"} ${partes.join(" e ")}`,
    progresso: Math.min(1, Math.max(0, 1 - resta / total)),
    expirado: false,
  };
}
