import { requisitar } from "./api";

// 1 = like, -1 = deslike, 0 = nenhuma
export type Valor = 1 | -1 | 0;

export type Reacoes = {
  likes: number;
  dislikes: number;
  /** A reação de quem está logado (0 para visitantes) */
  minha: Valor;
};

// Público: qualquer pessoa vê os totais
export function buscarReacoes(artigoId: string | number) {
  return requisitar<Reacoes>(`/documentos/${artigoId}/reacoes`);
}

// Exige login. Devolve os totais já atualizados.
export function reagir(artigoId: string | number, valor: Valor) {
  return requisitar<Reacoes>(`/documentos/${artigoId}/reacao`, {
    method: "PUT",
    body: JSON.stringify({ valor }),
  });
}

// Como os números ficam logo depois do clique, antes da resposta da API
export function aplicarReacao(atual: Reacoes, nova: Valor): Reacoes {
  const tirar = (r: Reacoes, v: Valor) =>
    v === 1 ? { ...r, likes: r.likes - 1 } : v === -1 ? { ...r, dislikes: r.dislikes - 1 } : r;
  const por = (r: Reacoes, v: Valor) =>
    v === 1 ? { ...r, likes: r.likes + 1 } : v === -1 ? { ...r, dislikes: r.dislikes + 1 } : r;

  return { ...por(tirar(atual, atual.minha), nova), minha: nova };
}
