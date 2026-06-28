import Header from "../layout/Header";
import "../../styles/App.css";
import "../../styles/HomePage.css";
import { Footer } from "../layout/Footer";
import { NavLink } from "react-router-dom";
import { Head } from "../layout/Head";

// Conteúdo apenas para renderização (sem lógica de comportamento).
const posts = [
  { id: 1, time: "Há 2 horas atrás", date: "14 jun 26", title: "Visão React.", tags: ["Poemas", "Vida"] },
  { id: 2, time: "Há 2 horas atrás", date: "14 jun 26", title: "Visão React.", tags: ["Poemas", "Vida"] },
];

export default function Home() {
  return (

    <div className="wr-page" id="top">
      <Head title="Home" description="Essa é a página inicial da Write"/>
      <div className="wr-sheet">
        <Header />

        <div className="wr-feed">
          {/* Navegação */}
          <nav className="wb-nav">
            <div className="wb-nav-item">
              <a className="wb-nav-link vida" href="#vida">Vida</a>
            </div>
            <div className="wb-nav-item">
              <a className="wb-nav-link poemas" href="#poemas">Poemas</a>
            </div>
            <div className="wb-nav-item">
              <a className="wb-nav-link trabalho" href="#trabalho">Trabalho</a>
            </div>
            <div className="wb-nav-item">
              <a className="wb-nav-link romance" href="#romance">Romance</a>
              <span className="wb-nav-arrow" aria-hidden="true">↓</span>
            </div>
          </nav>

          {/* Artigos */}
          <main className="wb-articles">
            {posts.map((post) => (
              <NavLink to="/article" key={post.id}>
                <article className="wb-card" key={post.id}>
                <p className="wb-meta">{post.time} | {post.date}</p>
                <h2 className="wb-card-title">
                  <p>{post.title}</p>
                </h2>
                <p className="wb-tags">
                  {post.tags.map((tag, i) => (
                    <span key={tag}>
                      {i > 0 && <span className="dot">•</span>}
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

