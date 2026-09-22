export type Perfil = { nome: string; email: string; sobre: string };

const CHAVE = "write-perfil";

export function lerPerfil(): Perfil {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "null");
    if (salvo) return salvo as Perfil;
  } catch {
    /* ignora */
  }
  return { nome: "Autor", email: "", sobre: "" };
}

export function salvarPerfil(p: Perfil) {
  localStorage.setItem(CHAVE, JSON.stringify(p));
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "W";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}
