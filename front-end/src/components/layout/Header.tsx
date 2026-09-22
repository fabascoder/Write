import { Link, NavLink, useSearchParams } from "react-router-dom";
import { CATEGORIAS } from "../../lib/categorias";
import { MenuIcon, MoonIcon, PenIcon, SunIcon } from "../icons";

type Props = {
  tema: "claro" | "escuro";
  alternarTema: () => void;
  abrirMenu: () => void;
};

export default function Header({ tema, alternarTema, abrirMenu }: Props) {
  const [params] = useSearchParams();
  const categoriaAtiva = params.get("categoria");

  return (
    <header className="wr-header">
      <Link to="/" className="wr-brand" aria-label="Write, página inicial">
        Write<span>.</span>
      </Link>

      <nav className="wr-topnav" aria-label="Categorias">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            "wr-topnav-link" + (isActive && !categoriaAtiva ? " is-active" : "")
          }
        >
          Início
        </NavLink>
        {CATEGORIAS.map((c) => (
          <Link
            key={c.slug}
            to={`/?categoria=${c.slug}`}
            className={"wr-topnav-link" + (categoriaAtiva === c.slug ? " is-active" : "")}
          >
            {c.nome}
          </Link>
        ))}
      </nav>

      <div className="wr-header-actions">
        <Link to="/editor" className="wr-btn wr-btn--ghost wr-header-write">
          <PenIcon />
          <span>Escrever</span>
        </Link>
        <button
          type="button"
          className="wr-icon-btn"
          onClick={alternarTema}
          aria-label={tema === "claro" ? "Ativar tema escuro" : "Ativar tema claro"}
        >
          {tema === "claro" ? <MoonIcon /> : <SunIcon />}
        </button>
        <button type="button" className="wr-icon-btn" onClick={abrirMenu} aria-label="Abrir menu">
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}
