import { ehNovo } from "../../lib/novidades";

// Etiqueta "Novo". Some sozinha quando a novidade expira (lib/novidades.ts)
export default function NovoSelo({ id }: { id: string }) {
  if (!ehNovo(id)) return null;
  // O espaço evita que o leitor de tela junte tudo: "Copiar linkNovo"
  return (
    <>
      {" "}
      <span className="fc-novo">Novo</span>
    </>
  );
}
