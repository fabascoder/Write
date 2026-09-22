// Rascunhos ficam no navegador até existir uma rota na API para eles
export type Rascunho = {
  id: string;
  titulo: string;
  conteudoHtml: string;
  categoria: string;
  tags: string[];
  atualizadoEm: string;
};

const CHAVE = "write-rascunhos";

export function lerRascunhos(): Rascunho[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]") as Rascunho[];
  } catch {
    return [];
  }
}

export function salvarRascunho(r: Rascunho) {
  const lista = lerRascunhos().filter((x) => x.id !== r.id);
  localStorage.setItem(CHAVE, JSON.stringify([r, ...lista]));
}

export function removerRascunho(id: string) {
  localStorage.setItem(CHAVE, JSON.stringify(lerRascunhos().filter((x) => x.id !== id)));
}
