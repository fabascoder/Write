import { Link } from "react-router-dom";
import { CATEGORIAS } from "../../lib/categorias";

export default function Footer() {
  return (
    <footer className="wr-footer">
      <span className="wr-brand wr-brand--sm">
        Write<span>.</span>
      </span>
      <nav aria-label="Rodapé">
        <Link to="/">Início</Link>
        {CATEGORIAS.map((c) => (
          <Link key={c.slug} to={`/?categoria=${c.slug}`}>
            {c.nome}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
