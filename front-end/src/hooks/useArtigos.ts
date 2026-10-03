import { useEffect, useState } from "react";
import { artigosFrescos, artigosGuardados, listarArtigos, type Artigo } from "../lib/api";

type Opcoes = {
  /** Artigo que a página precisa. Se a lista guardada não tiver, espera a da rede. */
  id?: string | null;
  /** Ignora a cópia guardada no navegador (o editor não pode trocar o texto no meio da edição) */
  daRede?: boolean;
};

// Mostra na hora a lista que o navegador já tem (se tiver) e atualiza por trás.
// Ver o cache em lib/api.ts.
export function useArtigos({ id, daRede = false }: Opcoes = {}) {
  const [guardados] = useState(() => (daRede && !artigosFrescos() ? null : artigosGuardados()));
  const [artigos, setArtigos] = useState<Artigo[]>(guardados ?? []);
  // Lista recente em memória é a palavra final: se o artigo não está nela, não existe
  const [carregando, setCarregando] = useState(
    () => !artigosFrescos() && (guardados === null || (id != null && !guardados.some((a) => String(a.id) === id))),
  );
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (artigosFrescos()) return;
    let ativo = true;

    listarArtigos()
      .then((lista) => ativo && setArtigos(lista))
      .catch((e) => {
        console.error(e);
        // Com uma lista guardada na tela, a falha passa despercebida
        if (ativo && guardados === null) setErro("Não foi possível carregar os artigos. Confira se a API está rodando.");
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [guardados]);

  return { artigos, carregando, erro };
}
