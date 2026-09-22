import { useEffect, useState } from "react";
import { listarArtigos, type Artigo } from "../lib/api";

export function useArtigos() {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    listarArtigos()
      .then((lista) => ativo && setArtigos(lista))
      .catch((e) => {
        console.error(e);
        if (ativo) setErro("Não foi possível carregar os artigos. Confira se a API está rodando.");
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  return { artigos, carregando, erro };
}
