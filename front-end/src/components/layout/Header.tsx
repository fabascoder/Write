import { Link, useLocation } from "react-router-dom";
import { MoonIcon, HomeIcon, CalendarIcon } from "../icons";
import "../../styles/Header.css";

// Style only: the buttons are intentionally inert (no handlers / no theme
// state). They carry the visual + accessibility shell for later wiring.
export default function Header() {
  const location = useLocation();
  const onCalendarPage = location.pathname === "/";
  const destination = onCalendarPage ? "/calendarPage" : "/";

  return (
    <header className="wr-header">
      <a className="wr-brand" href="#top">
        Write<span className="wr-brand-dot">.</span>
      </a>

      <nav className="wr-actions" aria-label="Ações">
        <button
          type="button"
          className="wr-icon-btn wr-icon-btn--moon"
          aria-label="Tema escuro"
        >
          <MoonIcon />
        </button>
        <Link
          to={destination}
          className="wr-icon-btn"
          aria-label={onCalendarPage ? "Ir para posts" : "Voltar para a timeline"}
        >
          {onCalendarPage ? <CalendarIcon /> : <HomeIcon />}
        </Link>
      </nav>
    </header>
  );
}
