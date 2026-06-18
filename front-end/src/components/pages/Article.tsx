import { useEffect, useRef } from "react";
import "../../styles/Article.css";

export default function Article() {
  const articleRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      },
      {
        threshold: 0.2,
      }
    );

    if (articleRef.current) {
      observer.observe(articleRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <main className="article-container fade-up">
      <div className="article-topo">
        <button className="article-voltar">
          ←
        </button>

        <div className="article-idioma">
          <span>PT</span>
          <span>|</span>
          <span>EN</span>
        </div>
      </div>

      <h1 className="article-title">
        Ceguidão.
      </h1>

      <p className="article-description">
        Em um mundo cada vez mais conectado, a forma como compartilhamos ideias e
        experiências evolui constantemente. Este espaço foi criado para reunir
        pensamentos, reflexões e conteúdos diversos em um ambiente simples e
        agradável. A proposta é oferecer uma leitura leve, permitindo que cada
        publicação tenha seu próprio significado e contexto.
      </p>

      <section
        ref={articleRef}
        className="article-card"
      >
        <h2>Efeitos</h2>

        <p className="article-main-text">
          A maior prova de amor já existente é o sacrifício de Jesus por seus
          filhos. Com esse amor fomos perdoados e justificados diante de Deus.
        </p>

        <hr />

        <p className="article-secondary-text">
          Esse é um texto de teste, estou utilizando React. A maioria das
          pessoas são más, porque Cristo veio e nos salvou. A partir disso temos
          o prazer de estar na presença de Deus e somos perdoados pelos nossos
          pecados.
        </p>
      </section>
    </main>
  );
}