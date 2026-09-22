import { useEffect, useState } from "react";
import Header from "../layout/Header";
import "../../styles/App.css";
import "../../styles/HomePage.css";
import { Footer } from "../layout/Footer";
import { NavLink } from "react-router-dom";
import { Head } from "../layout/Head";

type Artigo = {
  id: string | number;
  titulo: string;
  dataCriacao?: string | Date | null;
  tags?: string[];
};

export default function Home() {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function consultarArtigos() {
      try {
        const response = await fetch("http://localhost:3000/consultarArtigos", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

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
      return "Agora mesmo";
    }

    if (minutos < 60) {
      return `Há ${minutos} minutos`;
    }

    if (horas < 24) {
      return `Há ${horas} horas`;
    }

    if (dias === 1) {
      return "Há 1 dia";
    }

    return `Há ${dias} dias`;
  }

  return (
    <div className="wr-page" id="top">
      <Head title="Home" description="Essa é a página inicial da Write" />

      <div className="wr-sheet">
        <Header />

        <div className="wr-feed">
          {/* Navegação */}
          <nav className="wb-nav">
            <div className="wb-nav-item">
              <a className="wb-nav-link vida" href="#vida">
                Vida
              </a>
            </div>

            <div className="wb-nav-item">
              <a className="wb-nav-link poemas" href="#poemas">
                Poemas
              </a>
            </div>

            <div className="wb-nav-item">
              <a className="wb-nav-link trabalho" href="#trabalho">
                Trabalho
              </a>
            </div>

            <div className="wb-nav-item">
              <a className="wb-nav-link romance" href="#romance">
                Romance
              </a>

              <span className="wb-nav-arrow" aria-hidden="true">
                ↓
              </span>
            </div>
          </nav>

          {/* Artigos */}
          <main className="wb-articles">
            {carregando && <p>Carregando artigos...</p>}

            {erro && <p>{erro}</p>}

            {!carregando && !erro && artigos.length === 0 && (
              <p>Nenhum artigo encontrado.</p>
            )}

            {!carregando &&
              !erro &&
              artigos.map((artigo) => (
                <NavLink to={`/article/${artigo.id}`} key={String(artigo.id)}>
                  <article className="wb-card">
                    <p className="wb-meta">
                      {calcularTempo(artigo.dataCriacao)}
                      {" | "}
                      {formatarData(artigo.dataCriacao)}
                    </p>

                    <h2 className="wb-card-title">{artigo.titulo}</h2>

                    <p className="wb-tags">
                      {/* Exibe as tags, caso a API as forneça */}
                      {artigo.tags?.map((tag, index) => (
                        <span key={tag}>
                          {index > 0 && <span className="dot">•</span>}

                          {tag}
                        </span>
                      ))}
                    </p>

                    <hr className="wb-divider" />
                  </article>
                </NavLink>
              ))}
          </main>

          {/* Rodapé */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
