import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import "../styles/PostItem.css";
import { API_URL } from "../lib/api";

type Artigo = {
  id: string | number;
  titulo: string;
  dataCriacao?: string | Date | null;
};

export default function PostItem() {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function consultarArtigos() {
      try {
        const response = await fetch(`${API_URL}/documentos`);

        if (!response.ok) {
          throw new Error("Erro ao consultar artigos");
        }

        const data = (await response.json()) as {
          artigos?: Artigo[];
          documentos?: Artigo[];
        };

        setArtigos(data.artigos ?? data.documentos ?? []);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os artigos.");
      } finally {
        setCarregando(false);
      }
    }

    consultarArtigos();
  }, []);

  function formatarData(data?: string | Date | null) {
    if (!data) return "Data desconhecida";

    const dataFormatada = new Date(data);

    return dataFormatada.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  }

  function calcularTempo(data?: string | Date | null) {
    if (!data) return "";

    const agora = new Date();
    const dataCriacao = new Date(data);

    const diferenca = agora.getTime() - dataCriacao.getTime();

    const minutos = Math.floor(diferenca / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) {
      return "agora mesmo";
    }

    if (minutos < 60) {
      return `há ${minutos} minutos`;
    }

    if (horas < 24) {
      return `há ${horas} horas`;
    }

    if (dias === 1) {
      return "há 1 dia";
    }

    return `há ${dias} dias`;
  }

  if (carregando) {
    return <p>Carregando artigos...</p>;
  }

  if (erro) {
    return <p>{erro}</p>;
  }

  return (
    <ul className="wr-post-list">
      {artigos.map((artigo) => (
        <li className="wr-post" key={String(artigo.id)}>
          <span className="wr-node" aria-hidden="true" />

          <NavLink to={`/article/${artigo.id}`} className="wr-post-link">
            <h3 className="wr-post-title">{artigo.titulo}</h3>

            <p className="wr-post-meta">
              <span className="wr-post-ago">
                {calcularTempo(artigo.dataCriacao)}
              </span>

              <span className="wr-post-sep" aria-hidden="true">
                |
              </span>

              <time className="wr-post-date">
                {formatarData(artigo.dataCriacao)}
              </time>
            </p>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
